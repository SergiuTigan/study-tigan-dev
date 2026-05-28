---
title: "Day 73 -- Caching Strategies for LLM Applications"
week: 11
day: 73
phase: 3
phaseLabel: "Production"
order: 1173
type: "day"
---
# Day 73 -- Caching Strategies for LLM Applications

> *"The fastest LLM call is the one you never make. The cheapest token is the one you already paid for."*

**Date:** Miercuri, 30 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** Three-Layer Caching for AI Applications
**Phase:** Faza 3 -- Production · Week 11

---

## What You're Doing

LLM calls are expensive and slow. A single Claude Sonnet call costs fractions of a cent, which sounds cheap until you multiply by thousands of requests per day. And each call takes 1-5 seconds, which sounds fast until your users are waiting.

Today you learn three caching strategies, each targeting a different layer of the problem. Used together, they can reduce your costs by 80-90% and your latency to near-zero for repeat queries.

This is not theoretical. You will implement real caching code that you apply to your projects on Sunday.

## The Work

### Layer 1: Anthropic Prompt Caching (API Level)

Anthropic offers built-in prompt caching. When you send a request with cached content, subsequent requests that share the same prefix pay only 10% of the input token cost. This is automatic and requires minimal code changes.

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// The system prompt and static context are cached between calls
async function queryWithCaching(question: string, staticContext: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: `You are a helpful assistant. Use the following knowledge base to answer questions:\n\n${staticContext}`,
        cache_control: { type: 'ephemeral' }, // Mark for caching
      },
    ],
    messages: [{ role: 'user', content: question }],
  });

  // Check cache performance
  console.log('Cache read tokens:', response.usage.cache_read_input_tokens);
  console.log('Cache creation tokens:', response.usage.cache_creation_input_tokens);
  console.log('Regular input tokens:', response.usage.input_tokens);

  return response;
}
```

**When it helps:** RAG systems where the context is the same across multiple queries. System prompts that are long and shared. Any scenario where the beginning of the prompt is identical across requests.

**Cost math:** A 10,000-token system prompt costs ~$0.03 per request with Sonnet. With caching, the second request costs ~$0.003. That is a 90% reduction on the cached portion.

### Layer 2: Semantic Cache (Embedding-Based)

Sometimes users ask the same question in different ways. "What is the weather in Bucharest?" and "How's the weather in Bucharest right now?" are semantically identical but textually different. A semantic cache embeds the query, checks if a similar cached query exists, and returns the cached answer if the similarity is above a threshold.

```typescript
// src/lib/semantic-cache.ts

interface CacheEntry {
  query: string;
  embedding: number[];
  response: string;
  timestamp: number;
  ttl: number; // time to live in ms
}

class SemanticCache {
  private cache: CacheEntry[] = [];
  private similarityThreshold = 0.95;
  private maxEntries = 1000;

  async get(query: string): Promise<string | null> {
    const queryEmbedding = await this.embed(query);

    // Find the most similar cached entry
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;

    for (const entry of this.cache) {
      // Check TTL
      if (Date.now() - entry.timestamp > entry.ttl) continue;

      const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);
      if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
        bestMatch = entry;
        bestSimilarity = similarity;
      }
    }

    if (bestMatch) {
      console.log(`Cache HIT (similarity: ${bestSimilarity.toFixed(4)})`);
      return bestMatch.response;
    }

    console.log('Cache MISS');
    return null;
  }

  async set(query: string, response: string, ttlMs: number = 3600000): Promise<void> {
    const embedding = await this.embed(query);

    // Evict oldest if at capacity
    if (this.cache.length >= this.maxEntries) {
      this.cache.sort((a, b) => a.timestamp - b.timestamp);
      this.cache.shift();
    }

    this.cache.push({
      query,
      embedding,
      response,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async embed(text: string): Promise<number[]> {
    // Use your embedding model (Voyage, OpenAI, etc.)
    // For production, use the same model as your vector store
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: [text],
        model: 'voyage-3-lite', // Use lite model for cache lookups (cheaper)
      }),
    });
    const data = await response.json();
    return data.data[0].embedding;
  }
}

export const semanticCache = new SemanticCache();
```

**Usage in your RAG system:**

```typescript
async function ragQueryWithCache(question: string) {
  // Check semantic cache first
  const cached = await semanticCache.get(question);
  if (cached) {
    return { answer: cached, source: 'cache' };
  }

  // Cache miss -- run full RAG pipeline
  const answer = await ragQuery(question);

  // Cache the result
  await semanticCache.set(question, answer, 3600000); // 1 hour TTL

  return { answer, source: 'llm' };
}
```

### Layer 3: Exact Cache (Hash-Based)

For deterministic operations -- embeddings, classifications, tool calls with identical inputs -- use a simple hash-based cache:

```typescript
// src/lib/exact-cache.ts
import { createHash } from 'crypto';

class ExactCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  get(key: string): T | null {
    const entry = this.cache.get(this.hash(key));
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(this.hash(key));
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number = 86400000): void {
    this.cache.set(this.hash(key), {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Typed caches for different purposes
export const embeddingCache = new ExactCache<number[]>();
export const classificationCache = new ExactCache<string>();
```

**Usage for embeddings:**

```typescript
async function embedWithCache(text: string): Promise<number[]> {
  const cached = embeddingCache.get(text);
  if (cached) return cached;

  const embedding = await generateEmbedding(text);
  embeddingCache.set(text, embedding, 86400000); // 24h TTL
  return embedding;
}
```

### When to Cache vs When NOT to Cache

```
CACHE (deterministic, repeatable):          DO NOT CACHE (dynamic, personal):
─────────────────────────────────           ───────────────────────────────────
Classification tasks                        Creative writing
FAQ / common questions                      Ongoing conversations
Embeddings                                  Time-sensitive queries
Static data lookups                         Personalized responses
Tool call results (same inputs)             User-specific data queries
System prompt + context (use prompt cache)  Queries about "now" or "today"
```

### Measuring Cache Effectiveness

```typescript
// src/lib/cache-metrics.ts
class CacheMetrics {
  private hits = 0;
  private misses = 0;

  recordHit() { this.hits++; }
  recordMiss() { this.misses++; }

  get hitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  get stats() {
    return {
      hits: this.hits,
      misses: this.misses,
      total: this.hits + this.misses,
      hitRate: `${(this.hitRate * 100).toFixed(1)}%`,
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
  }
}

export const cacheMetrics = new CacheMetrics();
```

## Key Insight

The three caching layers are complementary, not competing. Prompt caching reduces cost for the parts of your prompt that repeat (system prompts, context). Semantic caching eliminates entire LLM calls for questions similar to ones you have already answered. Exact caching eliminates redundant computation for deterministic operations. Stack all three, and your typical cost per request drops dramatically while latency improves from seconds to milliseconds for cache hits.

## Resources

- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Semantic Caching concept](https://gptcache.readthedocs.io/) -- GPTCache is a Python library but the concepts apply
- [Redis for production caching](https://redis.io/docs/latest/develop/get-started/) -- for when in-memory is not enough
- [Cache invalidation strategies](https://aws.amazon.com/caching/best-practices/)

## Done When

- [ ] You understand the three caching layers and when each applies
- [ ] You implemented Anthropic prompt caching with cache_control
- [ ] You built a semantic cache with cosine similarity matching
- [ ] You built an exact hash-based cache for deterministic operations
- [ ] You know when to cache and when NOT to cache
- [ ] You added cache metrics tracking
- [ ] You can estimate the cost savings from caching (rough math is fine)

---

*Tomorrow: Rate limiting, retry logic, and provider fallbacks. The defensive programming that keeps your AI apps alive when things go wrong.*
