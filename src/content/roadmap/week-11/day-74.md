---
title: "Day 74 -- Rate Limiting, Retry Logic & Provider Fallbacks"
week: 11
day: 74
phase: 3
phaseLabel: "Production"
order: 1174
type: "day"
---
# Day 74 -- Rate Limiting, Retry Logic & Provider Fallbacks

> *"Your AI app will fail. The question is whether it fails gracefully with a retry and a fallback, or spectacularly with an unhandled rejection."*

**Date:** Joi, 31 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** Resilience Patterns for LLM Applications
**Phase:** Faza 3 -- Production · Week 11

---

## What You're Doing

Today you build the defensive layer that keeps your AI applications running when things go wrong. LLM APIs fail. They rate-limit you. They have outages. Networks drop. Your application needs to handle all of this without crashing and, ideally, without the user even noticing.

Three patterns: exponential backoff with jitter for transient failures, a token bucket rate limiter to stay within API limits, and provider fallback chains to survive outages.

These are not theoretical patterns. If you deploy an AI application that makes 100+ API calls per hour, you will hit rate limits. If you rely on a single provider, you will experience outages. Today you build the code that handles both.

## The Work

### Exponential Backoff with Jitter

When an API returns 429 (rate limited) or 500+ (server error), you retry. But you do not retry immediately -- that just adds to the congestion. You wait, and each retry waits longer. Adding jitter (randomness) prevents thundering herd problems where all clients retry at the same time.

```typescript
// src/lib/retry.ts

interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

function isRetryable(error: any, retryableStatuses: number[]): boolean {
  // API errors with status codes
  if (error?.status && retryableStatuses.includes(error.status)) {
    return true;
  }
  // Network errors
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
    return true;
  }
  // Anthropic SDK specific
  if (error?.error?.type === 'overloaded_error') {
    return true;
  }
  // Never retry auth errors or bad requests
  if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
    return false;
  }
  return false;
}

function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter: random value between 0 and exponentialDelay
  const jitter = Math.random() * exponentialDelay;
  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxRetries || !isRetryable(error, opts.retryableStatuses)) {
        throw error;
      }

      const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
      console.log(
        `Retry ${attempt + 1}/${opts.maxRetries} after ${Math.round(delay)}ms ` +
        `(error: ${error?.status || error?.code || 'unknown'})`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

**Usage:**

```typescript
import { withRetry } from '@/lib/retry';

const response = await withRetry(
  () => anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: question }],
  }),
  { maxRetries: 3, baseDelayMs: 1000 }
);
```

### Token Bucket Rate Limiter

Instead of letting the API tell you that you are going too fast (429), proactively limit your request rate:

```typescript
// src/lib/rate-limiter.ts

class TokenBucketRateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private lastRefill: number;
  private queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(maxTokens: number, refillRate: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  private processQueue() {
    this.refill();
    while (this.queue.length > 0 && this.tokens >= 1) {
      this.tokens -= 1;
      const next = this.queue.shift();
      next?.resolve();
    }
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait in queue
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });

      // Process queue periodically
      const interval = setInterval(() => {
        this.processQueue();
        if (this.queue.length === 0) {
          clearInterval(interval);
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        const index = this.queue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
          clearInterval(interval);
          reject(new Error('Rate limiter timeout'));
        }
      }, 30000);
    });
  }

  get available(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// Anthropic limits: ~50 requests per minute for most tiers
export const anthropicLimiter = new TokenBucketRateLimiter(
  10,  // burst capacity
  0.8  // ~50 per minute
);

// OpenAI limits vary by tier
export const openaiLimiter = new TokenBucketRateLimiter(
  20,  // burst capacity
  1.0  // ~60 per minute
);
```

**Usage:**

```typescript
import { anthropicLimiter } from '@/lib/rate-limiter';

async function callClaude(messages: Message[]) {
  await anthropicLimiter.acquire(); // Wait for available token
  return anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages,
  });
}
```

### Provider Fallback Chain

When Anthropic is down, fall back to OpenAI. When OpenAI is down, fall back to the next option:

```typescript
// src/lib/provider-fallback.ts

interface LLMProvider {
  name: string;
  call: (messages: any[]) => Promise<string>;
  isAvailable: () => boolean;
}

class ProviderFallbackChain {
  private providers: LLMProvider[];
  private failureCounters = new Map<string, { count: number; resetAt: number }>();
  private maxFailures = 3;
  private cooldownMs = 60000; // 1 minute cooldown after 3 failures

  constructor(providers: LLMProvider[]) {
    this.providers = providers;
  }

  private isProviderHealthy(name: string): boolean {
    const counter = this.failureCounters.get(name);
    if (!counter) return true;
    if (Date.now() > counter.resetAt) {
      this.failureCounters.delete(name);
      return true;
    }
    return counter.count < this.maxFailures;
  }

  private recordFailure(name: string) {
    const counter = this.failureCounters.get(name) || { count: 0, resetAt: 0 };
    counter.count++;
    counter.resetAt = Date.now() + this.cooldownMs;
    this.failureCounters.set(name, counter);
  }

  private recordSuccess(name: string) {
    this.failureCounters.delete(name);
  }

  async call(messages: any[]): Promise<{ response: string; provider: string }> {
    const errors: Array<{ provider: string; error: any }> = [];

    for (const provider of this.providers) {
      if (!this.isProviderHealthy(provider.name)) {
        console.log(`Skipping ${provider.name} (in cooldown)`);
        continue;
      }

      try {
        const response = await withRetry(
          () => provider.call(messages),
          { maxRetries: 2 }
        );
        this.recordSuccess(provider.name);
        return { response, provider: provider.name };
      } catch (error) {
        this.recordFailure(provider.name);
        errors.push({ provider: provider.name, error });
        console.log(`${provider.name} failed, trying next provider...`);
      }
    }

    throw new Error(
      `All providers failed: ${errors.map(e => `${e.provider}: ${e.error?.message}`).join(', ')}`
    );
  }
}

// Create the fallback chain
export const llmChain = new ProviderFallbackChain([
  {
    name: 'anthropic',
    call: async (messages) => {
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages,
      });
      return res.content[0].type === 'text' ? res.content[0].text : '';
    },
    isAvailable: () => !!process.env.ANTHROPIC_API_KEY,
  },
  {
    name: 'openai',
    call: async (messages) => {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages,
      });
      return res.choices[0]?.message?.content || '';
    },
    isAvailable: () => !!process.env.OPENAI_API_KEY,
  },
]);
```

**Usage:**

```typescript
const { response, provider } = await llmChain.call([
  { role: 'user', content: 'Explain quantum computing' },
]);
console.log(`Response from ${provider}: ${response.slice(0, 100)}...`);
```

### Combining Everything

```typescript
// src/lib/resilient-llm.ts
import { withRetry } from './retry';
import { anthropicLimiter } from './rate-limiter';
import { langfuse } from './langfuse';

export async function resilientLLMCall(
  messages: any[],
  options: { traceId?: string } = {}
) {
  // Rate limit
  await anthropicLimiter.acquire();

  // Retry with backoff
  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages,
    });
    return response;
  }, {
    maxRetries: 3,
    baseDelayMs: 1000,
  });
}
```

## Key Insight

These three patterns -- retry, rate limiting, and fallback -- are not specific to AI applications. They are the same patterns you would use for any external API dependency. The difference is that LLM APIs are more expensive (a failed request wastes money), more variable (latency ranges from 500ms to 30s), and less reliable (they are newer services under heavy load). This makes resilience patterns not optional but essential. An AI application without retry logic is a demo. An AI application with retry, rate limiting, and fallback is production software.

## Resources

- [Anthropic Rate Limits](https://docs.anthropic.com/en/docs/build-with-claude/rate-limits)
- [Exponential Backoff and Jitter (AWS)](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

## Done When

- [ ] You implemented exponential backoff with jitter
- [ ] You understand which HTTP status codes are retryable (429, 500+) and which are not (400, 401)
- [ ] You built a token bucket rate limiter
- [ ] You built a provider fallback chain (Anthropic -> OpenAI)
- [ ] You can combine all three: rate limit -> call with retry -> fallback on total failure
- [ ] You tested the retry logic by simulating a failure

---

*Friday is REST. Saturday: Cost optimization -- model cascade routing and budget management. The math that makes AI applications financially viable.*
