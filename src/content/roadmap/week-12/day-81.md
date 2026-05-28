---
title: "Day 81 -- Advanced LangChain: Custom Chains, Output Parsers, Callbacks"
week: 12
day: 81
phase: 3
phaseLabel: "Production"
order: 1281
type: "day"
---
# Day 81 -- Advanced LangChain: Custom Chains, Output Parsers, Callbacks

> *"The beginner uses LangChain's built-in chains. The intermediate builds custom chains. The advanced developer knows when to skip the framework entirely."*

**Date:** Joi, 7 August 2025
**Hours:** 2h · Evening session
**Topic:** Advanced LangChain.js Patterns
**Phase:** Faza 3 -- Production · Week 12

---

## What You're Doing

Yesterday you used LangChain's pre-built chains (createRetrievalChain, createStuffDocumentsChain). Today you learn to build custom chains from primitives. This is the difference between using LangChain as a cookbook and using it as a toolkit. You also learn output parsers for structured data and callbacks for observability integration.

These are the patterns that appear in production LangChain codebases and in interview questions about the framework.

## The Work

### RunnableSequence: Building Custom Chains

`RunnableSequence` is the building block for custom chains. It is the explicit version of `.pipe()`:

```typescript
import { RunnableSequence, RunnablePassthrough, RunnableLambda } from '@langchain/core/runnables';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const model = new ChatAnthropic({ modelName: 'claude-sonnet-4-20250514' });

// A chain that takes a topic, generates an outline, then writes an article
const outlinePrompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a content strategist. Create a 3-point outline for an article.'],
  ['human', 'Topic: {topic}'],
]);

const articlePrompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a skilled technical writer. Write a concise article following the outline.'],
  ['human', 'Outline:\n{outline}\n\nWrite the full article for the topic: {topic}'],
]);

const chain = RunnableSequence.from([
  // Step 1: Pass topic through and generate outline
  {
    topic: new RunnablePassthrough(),  // Pass the input through
    outline: outlinePrompt.pipe(model).pipe(new StringOutputParser()),
  },
  // Step 2: Use both topic and outline to write article
  articlePrompt,
  model,
  new StringOutputParser(),
]);

const article = await chain.invoke({ topic: 'Building AI agents with TypeScript' });
console.log(article);
```

The `RunnablePassthrough` is important -- it forwards the input unchanged so later steps can access it. Without it, the topic would be consumed by the first step and unavailable to the second.

### RunnableParallel: Running Steps Simultaneously

```typescript
import { RunnableParallel } from '@langchain/core/runnables';

// Run multiple analyses in parallel
const parallelChain = RunnableParallel.from({
  sentiment: ChatPromptTemplate.fromMessages([
    ['system', 'Analyze sentiment. Reply: positive, negative, or neutral.'],
    ['human', '{text}'],
  ]).pipe(model).pipe(new StringOutputParser()),

  keywords: ChatPromptTemplate.fromMessages([
    ['system', 'Extract 5 keywords. Reply with comma-separated list.'],
    ['human', '{text}'],
  ]).pipe(model).pipe(new StringOutputParser()),

  summary: ChatPromptTemplate.fromMessages([
    ['system', 'Summarize in one sentence.'],
    ['human', '{text}'],
  ]).pipe(model).pipe(new StringOutputParser()),
});

const results = await parallelChain.invoke({
  text: 'LangChain is a framework for building applications with LLMs...',
});

console.log(results.sentiment);  // 'positive'
console.log(results.keywords);   // 'LangChain, framework, LLM, applications, building'
console.log(results.summary);    // 'LangChain is an LLM application framework.'
```

All three LLM calls run concurrently. This is faster than sequential and cleaner than manual `Promise.all`.

### Structured Output with Zod

The cleanest pattern for typed LLM outputs:

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';

const model = new ChatAnthropic({ modelName: 'claude-sonnet-4-20250514' });

// Define the exact output structure
const AnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed'])
    .describe('Overall sentiment of the text'),
  confidence: z.number().min(0).max(1)
    .describe('Confidence score from 0 to 1'),
  topics: z.array(z.string())
    .describe('Main topics discussed'),
  actionItems: z.array(z.object({
    task: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })).describe('Any action items found'),
  summary: z.string()
    .describe('One-paragraph summary'),
});

const structuredModel = model.withStructuredOutput(AnalysisSchema);

const analysis = await structuredModel.invoke(
  'Meeting notes: We decided to migrate to React. John will lead the effort. ' +
  'Timeline is tight - need to finish by Q3. Budget approved. ' +
  'Some concerns about team training. Overall positive momentum.'
);

// Fully typed result
console.log(analysis.sentiment);     // 'positive'
console.log(analysis.confidence);    // 0.8
console.log(analysis.topics);        // ['migration', 'React', 'timeline']
console.log(analysis.actionItems);   // [{ task: 'Lead migration', priority: 'high' }]
console.log(analysis.summary);       // '...'
```

This is one of LangChain's genuinely best features. The `.withStructuredOutput()` method:
1. Adds the schema as tool definition
2. Forces the model to respond in the structured format
3. Parses and validates the response
4. Returns a fully typed object

No more `JSON.parse()` with hope and prayer.

### Callbacks: Hooking Into the Chain

Callbacks let you observe and log what happens inside chains. This is how you integrate LangChain with Langfuse or any other observability tool:

```typescript
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { Serialized } from '@langchain/core/load/serializable';

class LoggingCallbackHandler extends BaseCallbackHandler {
  name = 'logging_handler';

  async handleLLMStart(llm: Serialized, prompts: string[]) {
    console.log(`[LLM Start] Model: ${llm.id?.join('/') || 'unknown'}`);
    console.log(`[LLM Start] Prompt length: ${prompts[0]?.length || 0} chars`);
  }

  async handleLLMEnd(output: any) {
    const tokens = output.llmOutput?.tokenUsage;
    if (tokens) {
      console.log(`[LLM End] Tokens: ${tokens.totalTokens} (${tokens.promptTokens} in, ${tokens.completionTokens} out)`);
    }
  }

  async handleLLMError(error: Error) {
    console.error(`[LLM Error] ${error.message}`);
  }

  async handleChainStart(chain: Serialized, inputs: Record<string, any>) {
    console.log(`[Chain Start] ${chain.id?.join('/') || 'unnamed'}`);
  }

  async handleChainEnd(outputs: Record<string, any>) {
    console.log(`[Chain End] Output keys: ${Object.keys(outputs).join(', ')}`);
  }

  async handleToolStart(tool: Serialized, input: string) {
    console.log(`[Tool Start] ${tool.id?.join('/') || 'unnamed'}: ${input.slice(0, 100)}`);
  }

  async handleToolEnd(output: string) {
    console.log(`[Tool End] ${output.slice(0, 100)}`);
  }
}

// Use the callback
const result = await chain.invoke(
  { topic: 'AI engineering' },
  { callbacks: [new LoggingCallbackHandler()] }
);
```

### Langfuse Integration via Callbacks

```typescript
import { CallbackHandler } from 'langfuse-langchain';

// Create Langfuse callback handler
const langfuseHandler = new CallbackHandler({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_BASEURL,
});

// Every chain invocation is automatically traced
const result = await chain.invoke(
  { input: 'What is machine learning?' },
  { callbacks: [langfuseHandler] }
);

// Flush at the end
await langfuseHandler.flushAsync();
```

This is the easiest way to add observability to LangChain code. One callback handler, passed to every invoke call, and you get full traces in Langfuse.

### RunnableLambda: Custom Transformation Steps

For steps that are not LLM calls but need to be part of the chain:

```typescript
import { RunnableLambda } from '@langchain/core/runnables';

const preprocessInput = new RunnableLambda({
  func: (input: { text: string }) => ({
    text: input.text.trim().toLowerCase(),
    wordCount: input.text.split(/\s+/).length,
    timestamp: new Date().toISOString(),
  }),
});

const postprocessOutput = new RunnableLambda({
  func: (output: string) => ({
    content: output,
    charCount: output.length,
    generatedAt: new Date().toISOString(),
  }),
});

const fullChain = preprocessInput
  .pipe(prompt)
  .pipe(model)
  .pipe(new StringOutputParser())
  .pipe(postprocessOutput);
```

### Chaining Multiple Chains

Chains are themselves Runnables, so they can be composed:

```typescript
const researchChain = researchPrompt.pipe(model).pipe(new StringOutputParser());
const outlineChain = outlinePrompt.pipe(model).pipe(new StringOutputParser());
const writeChain = writePrompt.pipe(model).pipe(new StringOutputParser());

// Chain of chains
const fullPipeline = RunnableSequence.from([
  { topic: new RunnablePassthrough(), research: researchChain },
  { topic: (input: any) => input.topic, research: (input: any) => input.research, outline: outlineChain },
  writeChain,
]);
```

## Key Insight

Advanced LangChain is about three things: composability (building complex chains from simple Runnables), structured output (getting typed data from LLMs without manual parsing), and observability (callbacks that let you see inside the chain). These three capabilities justify the framework for complex projects. For simple projects, the overhead is not worth it. For projects with multiple LLM calls, parallel execution, structured outputs, and observability requirements, LangChain's primitives save real development time.

## Resources

- [LCEL Interface](https://js.langchain.com/docs/concepts/lcel/) -- the Runnable API
- [Structured Output](https://js.langchain.com/docs/concepts/structured_outputs/)
- [Callbacks](https://js.langchain.com/docs/concepts/callbacks/)
- [Langfuse LangChain Integration](https://langfuse.com/docs/integrations/langchain/tracing)
- [RunnableSequence Reference](https://api.js.langchain.com/classes/langchain_core_runnables.RunnableSequence.html)

## Done When

- [ ] You built a custom chain with RunnableSequence
- [ ] You used RunnablePassthrough to forward data between steps
- [ ] You used RunnableParallel to run LLM calls concurrently
- [ ] You used withStructuredOutput to get typed Zod objects from LLMs
- [ ] You implemented a callback handler (logging or Langfuse)
- [ ] You can compose chains of chains
- [ ] You understand when these advanced patterns are worth using

---

*Friday is REST. Saturday: Build a LangGraph agent -- the multi-step content creator with quality gates and iteration loops.*
