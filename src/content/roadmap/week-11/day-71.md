---
title: "Day 71 -- Langfuse: See Everything Your AI Does"
week: 11
day: 71
phase: 3
phaseLabel: "Production"
order: 1171
type: "day"
---
# Day 71 -- Langfuse: See Everything Your AI Does

> *"Flying blind with LLM calls is like deploying a web app without logging. You will not know something is wrong until your bill arrives."*

**Date:** Luni, 28 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** LLM Observability with Langfuse
**Phase:** Faza 3 -- Production · Week 11

---

## What You're Doing

Today you set up Langfuse, an open-source observability platform for LLM applications. Think of it as DataDog or New Relic, but specifically designed for AI systems. Every LLM call gets traced with its input, output, token usage, cost, and latency. Every tool call, every retrieval step, every agent iteration -- all visible in a single dashboard.

You have been building AI applications for weeks without any visibility into what they actually do at runtime. How long does a RAG retrieval take? How many tokens does your agent use per research task? What percentage of requests fail? What does each request cost? After today, you will know.

## The Work

### Setting Up Langfuse

**Option 1: Langfuse Cloud (recommended for learning)**

1. Go to [cloud.langfuse.com](https://cloud.langfuse.com) and create a free account
2. Create a new project
3. Go to Settings > API Keys > Create new API key
4. Save the public key and secret key

**Option 2: Self-hosted (for privacy-sensitive projects)**

```bash
docker compose up -d  # Using langfuse docker-compose.yml
```

### Install the SDK

```bash
npm install langfuse
```

Add to your environment:

```bash
# .env.local
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASEURL=https://cloud.langfuse.com  # or your self-hosted URL
```

### Basic Tracing

The core concept: every user interaction creates a **trace**. Within a trace, you have **spans** (for non-LLM work like retrieval) and **generations** (for LLM calls).

```typescript
// src/lib/langfuse.ts
import { Langfuse } from 'langfuse';

export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_BASEURL,
});

// Ensure traces are flushed before process exits
process.on('beforeExit', async () => {
  await langfuse.shutdownAsync();
});
```

### Tracing a Simple LLM Call

```typescript
import { langfuse } from '@/lib/langfuse';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function chat(userMessage: string) {
  // Create a trace for this interaction
  const trace = langfuse.trace({
    name: 'chat',
    input: { message: userMessage },
    metadata: { source: 'web-ui' },
  });

  // Create a generation within the trace
  const generation = trace.generation({
    name: 'claude-response',
    model: 'claude-sonnet-4-20250514',
    input: [{ role: 'user', content: userMessage }],
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userMessage }],
    });

    const output = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // End the generation with output and usage
    generation.end({
      output,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
    });

    // Update the trace with the final output
    trace.update({
      output: { response: output },
    });

    return output;
  } catch (error) {
    // Log errors in the trace
    generation.end({
      output: { error: String(error) },
      level: 'ERROR',
    });
    throw error;
  }
}
```

### Tracing a RAG Pipeline

This is where Langfuse becomes really valuable. A RAG call has multiple steps, and you want to see each one:

```typescript
async function ragQuery(question: string) {
  const trace = langfuse.trace({
    name: 'rag-query',
    input: { question },
    tags: ['rag', 'production'],
  });

  // Step 1: Embed the query
  const embedSpan = trace.span({
    name: 'embed-query',
    input: { text: question },
  });

  const embedding = await embedQuery(question);
  embedSpan.end({
    output: { dimensions: embedding.length },
  });

  // Step 2: Vector search
  const searchSpan = trace.span({
    name: 'vector-search',
    input: { topK: 5 },
  });

  const results = await vectorStore.search(embedding, 5);
  searchSpan.end({
    output: {
      resultCount: results.length,
      topScore: results[0]?.score,
    },
  });

  // Step 3: LLM generation with context
  const context = results.map(r => r.content).join('\n\n');
  const generation = trace.generation({
    name: 'rag-generation',
    model: 'claude-sonnet-4-20250514',
    input: {
      system: 'Answer based on the provided context.',
      context: context.slice(0, 500) + '...', // Truncate for readability
      question,
    },
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `Answer based on this context:\n\n${context}`,
    messages: [{ role: 'user', content: question }],
  });

  const answer = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  generation.end({
    output: answer,
    usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  });

  trace.update({
    output: { answer },
  });

  return answer;
}
```

### AI SDK Integration (Simpler Approach)

If you are using the Vercel AI SDK, there is an even simpler path using the experimental telemetry feature:

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  messages,
  experimental_telemetry: {
    isEnabled: true,
    metadata: {
      userId: 'user-123',
      sessionId: 'session-456',
    },
  },
});
```

This automatically sends trace data to any configured OpenTelemetry collector. Langfuse supports OpenTelemetry ingestion. Check the Langfuse docs for the OTEL setup.

### What You See in the Langfuse Dashboard

After running a few traces, go to the Langfuse dashboard. You will see:

1. **Traces list:** Every interaction with timestamp, latency, cost, and status
2. **Trace detail:** The full tree of spans and generations within a trace
3. **Token usage:** Input/output tokens per generation
4. **Cost tracking:** Automatic cost calculation based on model pricing
5. **Latency breakdown:** How long each step took
6. **Error tracking:** Failed generations with error messages

This is the first time you have real visibility into your AI application's behavior. Spend time exploring the dashboard with real data.

## Key Insight

Observability is not a "nice to have" for AI applications -- it is a requirement. LLM calls are non-deterministic, expensive, and opaque. Without traces, you are guessing about performance, cost, and reliability. With traces, you have data. Data drives optimization. A single Langfuse trace showing you that your RAG retrieval takes 800ms while the LLM call takes 200ms tells you exactly where to optimize. Without that trace, you might spend a week optimizing the wrong thing.

## Resources

- [Langfuse Documentation](https://langfuse.com/docs) -- the complete reference
- [Langfuse JS/TS SDK](https://langfuse.com/docs/sdk/typescript/guide)
- [Langfuse + AI SDK Integration](https://langfuse.com/docs/integrations/vercel-ai-sdk)
- [Langfuse Tracing Guide](https://langfuse.com/docs/tracing)
- [OpenTelemetry for LLMs](https://langfuse.com/docs/integrations/opentelemetry)

## Done When

- [ ] Langfuse account created (cloud or self-hosted)
- [ ] SDK installed and configured with API keys
- [ ] You traced at least one LLM call and see it in the dashboard
- [ ] You can see input, output, token usage, and cost for each call
- [ ] You traced a multi-step pipeline (like RAG) with nested spans
- [ ] You spent time exploring the Langfuse dashboard with real data
- [ ] You understand the trace > span > generation hierarchy

---

*Tomorrow: Instrument ALL your projects. Every CLI call, every RAG query, every agent step -- traced and visible.*
