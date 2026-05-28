---
title: "Day 72 -- Instrument All Projects"
week: 11
day: 72
phase: 3
phaseLabel: "Production"
order: 1172
type: "day"
---
# Day 72 -- Instrument All Projects

> *"One traced project is a learning exercise. Four traced projects is a portfolio of production-grade systems."*

**Date:** Marti, 29 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** Adding Langfuse Observability to All Existing Projects
**Phase:** Faza 3 -- Production · Week 11

---

## What You're Doing

Yesterday you learned how to trace a single LLM call. Today you instrument all four of your existing projects. Each project has different tracing needs -- the CLI tool needs simple request/response traces, the RAG system needs multi-step pipeline traces, the research agent needs iteration-level traces, and the Gen UI app needs tool-level traces.

By the end of today, every AI project in your portfolio is observable. You will have real data flowing into Langfuse, and you will be able to answer questions like: "How many tokens does my agent use per research task?" and "What is the average cost of a RAG query?"

## The Work

### Project 1: CLI Tool

The CLI tool is the simplest. Each command is one trace with one generation.

```typescript
// In your CLI tool's main function
import { langfuse } from './lib/langfuse';

async function handleCommand(command: string) {
  const trace = langfuse.trace({
    name: 'cli-command',
    input: { command },
    tags: ['cli'],
    metadata: {
      cliVersion: '1.0.0',
    },
  });

  const generation = trace.generation({
    name: 'process-command',
    model: 'claude-sonnet-4-20250514',
    input: [{ role: 'user', content: command }],
  });

  const response = await callLLM(command);

  generation.end({
    output: response.text,
    usage: {
      input: response.inputTokens,
      output: response.outputTokens,
    },
  });

  trace.update({
    output: { result: response.text },
  });

  // Important: flush before CLI exits
  await langfuse.flushAsync();

  return response.text;
}
```

### Project 2: RAG System

The RAG system is the most instructive to trace. You see the full pipeline:

```typescript
async function ragQuery(question: string, userId?: string) {
  const trace = langfuse.trace({
    name: 'rag-query',
    input: { question },
    userId,
    tags: ['rag'],
  });

  // Span 1: Query embedding
  const embedSpan = trace.span({
    name: 'query-embedding',
    input: { text: question, model: 'voyage-3' },
  });
  const queryEmbedding = await embedText(question);
  embedSpan.end({
    output: { dimensions: queryEmbedding.length },
    metadata: { model: 'voyage-3' },
  });

  // Span 2: Vector retrieval
  const retrievalSpan = trace.span({
    name: 'vector-retrieval',
    input: { topK: 5, threshold: 0.7 },
  });
  const documents = await vectorSearch(queryEmbedding, 5);
  retrievalSpan.end({
    output: {
      documentsFound: documents.length,
      scores: documents.map(d => d.score),
      sources: documents.map(d => d.metadata?.source),
    },
  });

  // Span 3: Context assembly
  const contextSpan = trace.span({ name: 'context-assembly' });
  const context = documents.map(d => d.content).join('\n\n---\n\n');
  contextSpan.end({
    output: { contextLength: context.length, documentCount: documents.length },
  });

  // Generation: LLM response
  const generation = trace.generation({
    name: 'rag-generation',
    model: 'claude-sonnet-4-20250514',
    input: {
      systemPromptPreview: 'Answer based on context... [truncated]',
      question,
      contextDocuments: documents.length,
    },
  });

  const response = await generateAnswer(question, context);

  generation.end({
    output: response.answer,
    usage: {
      input: response.usage.inputTokens,
      output: response.usage.outputTokens,
    },
  });

  // Score: Track relevance (you can add human feedback later)
  trace.score({
    name: 'retrieval-relevance',
    value: documents[0]?.score || 0,
    comment: 'Top document similarity score',
  });

  trace.update({
    output: { answer: response.answer, sourcesUsed: documents.length },
  });

  return response.answer;
}
```

### Project 3: Research Agent

The agent is the most complex to trace. Each iteration of the ReAct loop is a separate span, and within each iteration there may be multiple tool calls:

```typescript
async function runResearchAgent(query: string) {
  const trace = langfuse.trace({
    name: 'research-agent',
    input: { query },
    tags: ['agent', 'research'],
  });

  let iteration = 0;
  let isComplete = false;

  while (!isComplete && iteration < 10) {
    iteration++;

    // Each iteration is a span
    const iterSpan = trace.span({
      name: `iteration-${iteration}`,
      input: { iterationNumber: iteration },
    });

    // Thinking step (LLM decides next action)
    const thinkGen = iterSpan.generation({
      name: 'think',
      model: 'claude-sonnet-4-20250514',
      input: { step: 'decide-next-action' },
    });

    const decision = await agentThink(query, previousSteps);

    thinkGen.end({
      output: {
        action: decision.action,
        reasoning: decision.reasoning,
      },
      usage: {
        input: decision.usage.inputTokens,
        output: decision.usage.outputTokens,
      },
    });

    if (decision.action === 'answer') {
      isComplete = true;
      iterSpan.end({ output: { status: 'complete', answer: decision.answer } });
      break;
    }

    // Tool execution step
    const toolSpan = iterSpan.span({
      name: `tool-${decision.toolName}`,
      input: decision.toolArgs,
    });

    try {
      const toolResult = await executeTool(decision.toolName, decision.toolArgs);
      toolSpan.end({
        output: { result: toolResult },
      });
    } catch (error) {
      toolSpan.end({
        output: { error: String(error) },
        level: 'ERROR',
      });
    }

    iterSpan.end({ output: { status: 'continuing' } });
  }

  trace.update({
    output: {
      totalIterations: iteration,
      completed: isComplete,
    },
    metadata: {
      iterations: iteration,
      toolCallCount: countToolCalls(),
    },
  });

  // Track key metrics as scores
  trace.score({
    name: 'agent-iterations',
    value: iteration,
    comment: `Agent completed in ${iteration} iterations`,
  });

  await langfuse.flushAsync();
}
```

### Project 4: Gen UI App (AI SDK Telemetry)

For the Gen UI app using AI SDK, use the telemetry integration:

```typescript
// In your server action
const result = await streamUI({
  model: anthropic('claude-sonnet-4-20250514'),
  messages,
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'gen-ui-chat',
    metadata: {
      toolCount: Object.keys(tools).length,
    },
  },
  tools: { /* ... */ },
});
```

Or wrap with manual Langfuse tracing for more control:

```typescript
export async function sendMessage(userMessage: string) {
  const trace = langfuse.trace({
    name: 'gen-ui-chat',
    input: { message: userMessage },
    tags: ['gen-ui'],
  });

  const result = await streamUI({
    model: anthropic('claude-sonnet-4-20250514'),
    system: APP_CONFIG.systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    text: ({ content }) => {
      trace.update({ output: { type: 'text', preview: content.slice(0, 100) } });
      return <p>{content}</p>;
    },
    tools: {
      getWeather: {
        // ... parameters ...
        generate: async function* ({ city }) {
          const toolSpan = trace.span({
            name: 'tool-weather',
            input: { city },
          });
          yield <WeatherCardLoading />;

          try {
            const data = await fetchWeather(city);
            toolSpan.end({ output: { success: true, city } });
            return <WeatherCard data={data} />;
          } catch (error) {
            toolSpan.end({ output: { error: String(error) }, level: 'ERROR' });
            return <ErrorCard title="Weather Error" message={String(error)} />;
          }
        },
      },
    },
  });

  return result.value;
}
```

### What to Track Across All Projects

Build a consistent set of metrics:

| Metric | CLI | RAG | Agent | Gen UI |
|--------|-----|-----|-------|--------|
| Cost per request | Yes | Yes | Yes | Yes |
| Latency (total) | Yes | Yes | Yes | Yes |
| Token usage (in/out) | Yes | Yes | Yes | Yes |
| Tool call frequency | -- | -- | Yes | Yes |
| Retrieval scores | -- | Yes | -- | -- |
| Iteration count | -- | -- | Yes | -- |
| Error rate | Yes | Yes | Yes | Yes |

## Key Insight

Instrumenting all four projects reveals patterns you cannot see in any single project. Your agent uses 10x the tokens of your RAG system. Your Gen UI tool calls add 500ms of latency. Your CLI tool has a 3% error rate you never noticed. These cross-project insights inform every optimization decision you make this week. Observability is not a feature -- it is the foundation for every production improvement.

## Resources

- [Langfuse Tracing Concepts](https://langfuse.com/docs/tracing)
- [Langfuse Scores](https://langfuse.com/docs/scores/overview) -- for tracking quality metrics
- [AI SDK Telemetry](https://sdk.vercel.ai/docs/ai-sdk-core/telemetry)
- [Langfuse Analytics Dashboard](https://langfuse.com/docs/analytics)

## Done When

- [ ] CLI tool has Langfuse traces for every command
- [ ] RAG system traces the full pipeline: embed -> retrieve -> generate
- [ ] Research agent traces each iteration with tool calls
- [ ] Gen UI app traces tool usage and response types
- [ ] All four projects have traces visible in the Langfuse dashboard
- [ ] You can see cost, latency, and token usage for each project
- [ ] You identified at least one surprising insight from the data

---

*Tomorrow: Caching strategies. Three layers of caching that can reduce your costs by 90%.*
