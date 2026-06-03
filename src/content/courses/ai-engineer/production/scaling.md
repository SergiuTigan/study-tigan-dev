---
title: "Scaling Strategies"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "production"
moduleTitle: "Production"
moduleDescription: "Ship AI applications to production with proper API design, monitoring, safety, and scaling."
lessonId: "ai-engineer/production/scaling"
duration: "10 min"
order: 704
moduleOrder: 7
lessonOrder: 4
color: "purple"
---
# Scaling Strategies

As your AI application grows, you need strategies for handling more users, managing costs, and maintaining quality. This lesson covers practical scaling patterns.

## Caching

The most effective scaling strategy. LLM calls are expensive; cache the results:

```typescript
import { createHash } from 'node:crypto';

class LLMCache {
  private cache = new Map<string, { response: string; expiry: number }>();

  private hashRequest(messages: Message[], model: string): string {
    const key = JSON.stringify({ messages, model });
    return createHash('sha256').update(key).digest('hex');
  }

  async get(messages: Message[], model: string): Promise<string | null> {
    const hash = this.hashRequest(messages, model);
    const entry = this.cache.get(hash);
    if (entry && Date.now() < entry.expiry) {
      return entry.response;
    }
    return null;
  }

  async set(messages: Message[], model: string, response: string, ttl = 3600000): Promise<void> {
    const hash = this.hashRequest(messages, model);
    this.cache.set(hash, { response, expiry: Date.now() + ttl });
  }
}
```

## Model Routing

Route requests to the cheapest model that can handle them:

```typescript
async function routeRequest(request: ChatRequest): Promise<string> {
  const complexity = await classifyComplexity(request);

  switch (complexity) {
    case 'simple':
      return callModel('claude-haiku', request);    // Cheapest
    case 'moderate':
      return callModel('claude-sonnet', request);   // Balanced
    case 'complex':
      return callModel('claude-opus', request);     // Most capable
  }
}
```

## Queue-Based Processing

For non-real-time tasks, use a job queue:

```typescript
import { Queue, Worker } from 'bullmq';

const aiQueue = new Queue('ai-tasks');

// Producer: enqueue tasks
await aiQueue.add('summarize', {
  documentId: 'doc-123',
  userId: 'user-456',
});

// Consumer: process tasks with concurrency control
const worker = new Worker('ai-tasks', async (job) => {
  const result = await processAITask(job.data);
  await saveResult(job.data.documentId, result);
}, {
  concurrency: 10,  // Process 10 tasks in parallel
  limiter: {
    max: 50,         // Max 50 requests per minute
    duration: 60000,
  },
});
```

## Cost Management

```typescript
interface UsageLimits {
  maxTokensPerUser: number;      // Per user per day
  maxTokensPerOrg: number;       // Per organization per month
  maxCostPerRequest: number;     // Per individual request
}

async function checkLimits(userId: string, estimatedTokens: number): Promise<boolean> {
  const usage = await getUsage(userId, 'today');

  if (usage.tokens + estimatedTokens > limits.maxTokensPerUser) {
    throw new Error('Daily token limit exceeded');
  }

  return true;
}
```

## Horizontal Scaling

- Run multiple API server instances behind a load balancer.
- Use connection pooling for database and vector store connections.
- Implement circuit breakers for LLM API calls.
- Use CDN caching for static AI outputs (e.g., pre-generated summaries).

Start with caching and model routing. These two strategies alone can reduce costs by 50-80% without sacrificing quality.
