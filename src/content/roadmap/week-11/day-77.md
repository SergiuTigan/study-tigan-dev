---
title: "Day 77 -- Apply Everything to All Projects"
week: 11
day: 77
phase: 3
phaseLabel: "Production"
order: 1177
type: "day"
---
# Day 77 -- Apply Everything to All Projects

> *"A production system is not one that works. It is one that works, tells you when it does not, recovers automatically, and stays within budget."*

**Date:** Duminica, 3 August 2025
**Hours:** 5h · Full session
**Topic:** Full Production Stack Integration Across All Projects
**Phase:** Faza 3 -- Production · Week 11

---

## What You're Doing

Today is integration day. You take everything you built this week -- Langfuse observability, semantic and exact caching, retry logic, rate limiting, provider fallback, model routing, and cost tracking -- and apply it systematically to all four projects. Then you update every README and push everything.

This is methodical work, not creative work. You know what needs to be done. You just need to do it for each project.

## The Work

### Hour 1: CLI Tool

**Add: Langfuse tracing + caching + retry**

The CLI tool is the simplest integration:

```typescript
// Updated main function pattern
import { langfuse } from './lib/langfuse';
import { withRetry } from './lib/retry';
import { exactCache } from './lib/exact-cache';
import { costTracker } from './lib/cost-tracker';

async function processCommand(command: string) {
  // 1. Check exact cache for identical commands
  const cached = exactCache.get(command);
  if (cached) {
    console.log('[cache hit]');
    return cached;
  }

  // 2. Create Langfuse trace
  const trace = langfuse.trace({
    name: 'cli-command',
    input: { command },
  });

  // 3. Call LLM with retry
  const generation = trace.generation({
    name: 'generate',
    model: 'claude-sonnet-4-20250514',
    input: [{ role: 'user', content: command }],
  });

  const response = await withRetry(() =>
    anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: command }],
    })
  );

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // 4. Record metrics
  generation.end({
    output: text,
    usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  });

  costTracker.record({
    model: 'claude-sonnet-4-20250514',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    feature: 'cli',
    cached: false,
  });

  // 5. Cache for identical future queries
  exactCache.set(command, text, 3600000); // 1 hour

  // 6. Flush before exit
  await langfuse.flushAsync();

  return text;
}
```

Checklist for CLI tool:
- [ ] Langfuse traces every command
- [ ] Exact cache prevents redundant calls for identical inputs
- [ ] Retry logic handles transient API errors
- [ ] Cost tracker records every call

### Hour 2: RAG System

**Add: Full pipeline tracing + semantic cache + prompt caching + retry**

The RAG system benefits the most from caching because many users ask similar questions:

```typescript
async function ragQueryProduction(question: string) {
  // 1. Check semantic cache first
  const cachedAnswer = await semanticCache.get(question);
  if (cachedAnswer) {
    costTracker.record({
      model: 'cache',
      inputTokens: 0,
      outputTokens: 0,
      feature: 'rag',
      cached: true,
    });
    return { answer: cachedAnswer, source: 'semantic-cache' };
  }

  // 2. Full traced pipeline
  const trace = langfuse.trace({
    name: 'rag-query',
    input: { question },
    tags: ['rag', 'production'],
  });

  // 2a. Embed query (with exact cache for identical queries)
  const embedSpan = trace.span({ name: 'embed-query' });
  const embedding = await embedWithCache(question);
  embedSpan.end({ output: { cached: embeddingCache.get(question) !== null } });

  // 2b. Vector retrieval
  const retrievalSpan = trace.span({ name: 'vector-search' });
  const documents = await vectorSearch(embedding, 5);
  retrievalSpan.end({
    output: { count: documents.length, topScore: documents[0]?.score },
  });

  // 2c. LLM generation with prompt caching
  const context = documents.map(d => d.content).join('\n\n');
  const generation = trace.generation({
    name: 'generate-answer',
    model: 'claude-sonnet-4-20250514',
  });

  const response = await withRetry(() =>
    anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: [{
        type: 'text',
        text: `Answer questions using this context:\n\n${context}`,
        cache_control: { type: 'ephemeral' }, // Prompt caching!
      }],
      messages: [{ role: 'user', content: question }],
    })
  );

  const answer = response.content[0].type === 'text' ? response.content[0].text : '';

  generation.end({
    output: answer,
    usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  });

  // 3. Cache the answer for similar future queries
  await semanticCache.set(question, answer, 3600000);

  // 4. Track cost
  costTracker.record({
    model: 'claude-sonnet-4-20250514',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    feature: 'rag',
    cached: false,
  });

  trace.update({ output: { answer: answer.slice(0, 200) } });

  return { answer, source: 'llm' };
}
```

Checklist for RAG:
- [ ] Langfuse traces the full pipeline (embed -> retrieve -> generate)
- [ ] Semantic cache returns answers for similar questions
- [ ] Exact cache prevents re-embedding identical queries
- [ ] Anthropic prompt caching on the context prefix
- [ ] Retry logic on all external calls
- [ ] Cost tracking with cache hit/miss differentiation

### Hour 3: Research Agent

**Add: Iteration tracing + retry for web searches + model routing**

The agent benefits from model routing because planning steps can use a cheaper model:

```typescript
async function runProductionAgent(query: string) {
  const trace = langfuse.trace({
    name: 'research-agent',
    input: { query },
    tags: ['agent'],
  });

  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    const iterSpan = trace.span({ name: `iteration-${iteration}` });

    // Planning step: use Haiku (cheap) for deciding next action
    const planGen = iterSpan.generation({
      name: 'plan',
      model: 'claude-haiku-4-20250514',
    });

    const plan = await withRetry(() =>
      anthropic.messages.create({
        model: 'claude-haiku-4-20250514', // Cheap model for planning
        max_tokens: 200,
        messages: buildPlanningPrompt(query, previousSteps),
      })
    );

    planGen.end({
      output: extractPlan(plan),
      usage: { input: plan.usage.input_tokens, output: plan.usage.output_tokens },
    });

    costTracker.record({
      model: 'claude-haiku-4-20250514',
      inputTokens: plan.usage.input_tokens,
      outputTokens: plan.usage.output_tokens,
      feature: 'agent-planning',
      cached: false,
    });

    // Tool execution with retry (web searches can fail)
    if (needsToolCall(plan)) {
      const toolSpan = iterSpan.span({ name: `tool-${toolName}` });
      const toolResult = await withRetry(
        () => executeTool(toolName, toolArgs),
        { maxRetries: 2 }
      );
      toolSpan.end({ output: toolResult });
    }

    // Final answer: use Sonnet (quality) for synthesis
    if (isReadyToAnswer(plan)) {
      const answerGen = iterSpan.generation({
        name: 'synthesize',
        model: 'claude-sonnet-4-20250514',
      });

      const answer = await withRetry(() =>
        anthropic.messages.create({
          model: 'claude-sonnet-4-20250514', // Quality model for final answer
          max_tokens: 2048,
          messages: buildSynthesisPrompt(query, allFindings),
        })
      );

      answerGen.end({
        output: extractText(answer),
        usage: { input: answer.usage.input_tokens, output: answer.usage.output_tokens },
      });

      costTracker.record({
        model: 'claude-sonnet-4-20250514',
        inputTokens: answer.usage.input_tokens,
        outputTokens: answer.usage.output_tokens,
        feature: 'agent-synthesis',
        cached: false,
      });

      iterSpan.end({ output: { status: 'complete' } });
      break;
    }

    iterSpan.end({ output: { status: 'continuing' } });
  }

  trace.score({ name: 'iterations', value: iteration });
  trace.update({ output: { iterations: iteration } });
  await langfuse.flushAsync();
}
```

Checklist for Agent:
- [ ] Each iteration is a traced span
- [ ] Planning uses Haiku (cheap), synthesis uses Sonnet (quality)
- [ ] Web search tool calls have retry logic
- [ ] Cost tracking distinguishes planning vs synthesis costs
- [ ] Iteration count is tracked as a Langfuse score

### Hour 4: Gen UI App

**Add: Telemetry + cache + model routing**

```typescript
// In your Gen UI server action
export async function sendMessage(userMessage: string) {
  // Check semantic cache
  const cached = await semanticCache.get(userMessage);
  if (cached) {
    return cached; // Return cached UI response
  }

  const trace = langfuse.trace({
    name: 'gen-ui-chat',
    input: { message: userMessage },
    tags: ['gen-ui'],
  });

  const result = await streamUI({
    model: anthropic('claude-sonnet-4-20250514'),
    system: APP_CONFIG.systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    experimental_telemetry: { isEnabled: true },
    // ... tools with traced spans
  });

  return result.value;
}
```

Checklist for Gen UI:
- [ ] Telemetry enabled on streamUI calls
- [ ] Tool executions are traced as spans
- [ ] Error handling in tools creates error-level spans
- [ ] Cost tracking integrated

### Hour 5: Update READMEs and Push

Add a "Production Features" section to every README:

```markdown
## Production Features

- **Observability**: Full request tracing with [Langfuse](https://langfuse.com)
  - Every LLM call traced with input/output/cost/latency
  - Pipeline-level tracing (retrieval + generation for RAG)
  - Error tracking and alerting
- **Caching**: Three-layer caching strategy
  - Anthropic prompt caching (90% off repeated context)
  - Semantic cache (similar queries return cached answers)
  - Exact cache (identical inputs return instant results)
- **Resilience**: Production-grade error handling
  - Exponential backoff with jitter on transient failures
  - Token bucket rate limiting
  - Provider fallback (Anthropic → OpenAI)
- **Cost Optimization**: Model cascade routing
  - Query complexity classification with Haiku
  - Automatic routing to Haiku/Sonnet/Opus
  - ~5-8x cost reduction vs uniform Sonnet usage
```

Push all four projects:

```bash
# For each project:
git add .
git commit -m "feat: add production observability, caching, and cost optimization"
git push
```

## Key Insight

After today, you can credibly say "I have built production AI systems with observability, caching, and cost optimization." That is not a claim based on reading documentation. It is based on four deployed projects, each with Langfuse traces, caching layers, retry logic, and cost tracking. In an interview, when someone asks "How do you handle cost optimization for LLM applications?", you will answer with specific numbers from your own systems. That is the difference between a candidate who studied and a candidate who built.

## Resources

- Everything from Days 71-76
- [Langfuse Dashboard](https://cloud.langfuse.com) -- check your traces after pushing
- [Anthropic Prompt Caching Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)

## Done When

- [ ] CLI tool: traced + cached + retry
- [ ] RAG system: full pipeline traced + semantic cache + prompt cache + retry
- [ ] Agent: iteration traced + model routing (Haiku planning, Sonnet synthesis) + retry
- [ ] Gen UI: telemetry + tool tracing + error handling
- [ ] All READMEs updated with "Production Features" section
- [ ] All projects pushed to GitHub
- [ ] You checked Langfuse dashboard and see traces from all four projects
- [ ] You can answer "How do you handle LLM cost optimization?" with real examples

---

*Week 11 complete. All projects are production-grade. Next week: LangChain.js and LangGraph -- the final framework in your toolkit.*
