---
title: "Day 83 -- Build a LangGraph Agent: Multi-Step Content Creator"
week: 12
day: 83
phase: 3
phaseLabel: "Production"
order: 1283
type: "day"
---
# Day 83 -- Build a LangGraph Agent: Multi-Step Content Creator

> *"A loop says 'keep going until done.' A graph says 'research, then outline, then draft, then review, and if the review fails, loop back to draft -- but never more than three times.'"*

**Date:** Sambata, 9 August 2025
**Hours:** 3h · Deep work session
**Topic:** Building a Production LangGraph Agent
**Phase:** Faza 3 -- Production · Week 12

---

## What You're Doing

Today you build your fifth portfolio project: a multi-step Content Creator agent using LangGraph. This agent takes a topic, researches it, creates an outline, writes a draft, reviews the draft for quality, and revises if the review score is below threshold. It demonstrates the key LangGraph patterns: sequential flow, conditional routing, cycles with termination conditions, and typed state management.

This is not a toy. This is the kind of graph-based orchestration used in production content pipelines, code review systems, and multi-agent workflows.

## The Work

### Hour 1: Define the Graph Architecture

```
                     ┌─────────┐
                     │  START  │
                     └────┬────┘
                          │
                     ┌────▼────┐
                     │ research │  ← Gather information on the topic
                     └────┬────┘
                          │
                     ┌────▼────┐
                     │ outline  │  ← Create structured outline
                     └────┬────┘
                          │
                     ┌────▼────┐
              ┌─────►│  draft   │  ← Write the article
              │      └────┬────┘
              │           │
              │      ┌────▼────┐
              │      │ review   │  ← Score quality 1-10 + feedback
              │      └────┬────┘
              │           │
              │      ┌────▼────┐
              │      │ decide   │  ← score >= 8 OR iterations >= 3?
              │      └────┬────┘
              │       /       \
              │     YES        NO
              │      │          │
              │ ┌────▼────┐     │
              │ │   END   │     │
              │ └─────────┘     │
              │                 │
              └─────────────────┘  ← Loop back to revise (draft node)
```

### Setup

```bash
mkdir content-creator-agent && cd content-creator-agent
npm init -y
npm install @langchain/langgraph @langchain/anthropic @langchain/core zod
npm install -D typescript tsx @types/node
```

### Define the State

```typescript
// src/state.ts
import { Annotation } from '@langchain/langgraph';

export const ContentState = Annotation.Root({
  // Input
  topic: Annotation<string>(),
  targetAudience: Annotation<string>({
    default: () => 'technical professionals',
  }),
  targetLength: Annotation<string>({
    default: () => 'medium (800-1200 words)',
  }),

  // Research phase
  research: Annotation<string>({
    default: () => '',
  }),

  // Outline phase
  outline: Annotation<string>({
    default: () => '',
  }),

  // Draft phase
  draft: Annotation<string>({
    default: () => '',
  }),

  // Review phase
  reviewScore: Annotation<number>({
    default: () => 0,
  }),
  reviewFeedback: Annotation<string>({
    default: () => '',
  }),

  // Meta
  iterations: Annotation<number>({
    default: () => 0,
  }),
  status: Annotation<string>({
    default: () => 'started',
  }),
  logs: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});
```

### Define the Nodes

```typescript
// src/nodes.ts
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';
import { ContentState } from './state';

const sonnet = new ChatAnthropic({ modelName: 'claude-sonnet-4-20250514' });
const haiku = new ChatAnthropic({ modelName: 'claude-haiku-4-20250514' });

// Node 1: Research
export async function research(state: typeof ContentState.State) {
  const response = await sonnet.invoke([
    {
      role: 'system',
      content: `You are a research assistant. Gather key facts, statistics, examples,
and expert opinions about the given topic. Focus on information relevant to
${state.targetAudience}. Be thorough but concise. Format as bullet points.`,
    },
    {
      role: 'user',
      content: `Research this topic thoroughly: ${state.topic}`,
    },
  ]);

  return {
    research: response.content.toString(),
    status: 'researched',
    logs: [`[Research] Gathered research on "${state.topic}"`],
  };
}

// Node 2: Outline
export async function outline(state: typeof ContentState.State) {
  const response = await sonnet.invoke([
    {
      role: 'system',
      content: `You are a content strategist. Create a detailed article outline
based on the research provided. Include:
- A compelling title
- An introduction hook
- 3-5 main sections with sub-points
- A conclusion with takeaways
Target audience: ${state.targetAudience}
Target length: ${state.targetLength}`,
    },
    {
      role: 'user',
      content: `Create an outline based on this research:\n\n${state.research}`,
    },
  ]);

  return {
    outline: response.content.toString(),
    status: 'outlined',
    logs: [`[Outline] Created article structure`],
  };
}

// Node 3: Draft (handles both initial draft and revisions)
export async function draft(state: typeof ContentState.State) {
  const isRevision = state.iterations > 0;

  const systemPrompt = isRevision
    ? `You are a skilled writer revising an article. Apply the review feedback
to improve the draft. Maintain the same structure but enhance quality.
Feedback to address:\n${state.reviewFeedback}`
    : `You are a skilled technical writer. Write a complete article following
the outline. Target audience: ${state.targetAudience}.
Length: ${state.targetLength}. Write in a clear, engaging style.`;

  const userPrompt = isRevision
    ? `Revise this article:\n\n${state.draft}`
    : `Write an article following this outline:\n\n${state.outline}\n\nUsing this research:\n\n${state.research}`;

  const response = await sonnet.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  return {
    draft: response.content.toString(),
    iterations: state.iterations + 1,
    status: isRevision ? 'revised' : 'drafted',
    logs: [isRevision
      ? `[Draft] Revision #${state.iterations + 1} based on feedback`
      : `[Draft] Initial draft written`
    ],
  };
}

// Node 4: Review
export async function review(state: typeof ContentState.State) {
  const ReviewSchema = z.object({
    score: z.number().min(1).max(10).describe('Quality score from 1-10'),
    strengths: z.array(z.string()).describe('What works well'),
    improvements: z.array(z.string()).describe('What needs improvement'),
    overallFeedback: z.string().describe('Detailed feedback for the writer'),
  });

  const structuredModel = haiku.withStructuredOutput(ReviewSchema);

  const reviewResult = await structuredModel.invoke([
    {
      role: 'system',
      content: `You are a strict editor. Review the article for:
- Clarity and readability
- Technical accuracy
- Engagement and flow
- Completeness (covers the topic well)
- Target audience fit (${state.targetAudience})
Be honest. Only score 8+ if the article is genuinely publication-ready.`,
    },
    {
      role: 'user',
      content: `Review this article:\n\n${state.draft}`,
    },
  ]);

  return {
    reviewScore: reviewResult.score,
    reviewFeedback: `Score: ${reviewResult.score}/10\n\nStrengths:\n${reviewResult.strengths.map(s => `- ${s}`).join('\n')}\n\nImprovements needed:\n${reviewResult.improvements.map(s => `- ${s}`).join('\n')}\n\n${reviewResult.overallFeedback}`,
    status: 'reviewed',
    logs: [`[Review] Score: ${reviewResult.score}/10 (iteration ${state.iterations})`],
  };
}
```

### Build the Graph

```typescript
// src/graph.ts
import { StateGraph, END, START } from '@langchain/langgraph';
import { ContentState } from './state';
import { research, outline, draft, review } from './nodes';

const MAX_ITERATIONS = 3;
const MIN_QUALITY_SCORE = 8;

// The conditional edge function
function shouldContinueRevising(state: typeof ContentState.State): string {
  if (state.reviewScore >= MIN_QUALITY_SCORE) {
    return 'end'; // Quality is good enough
  }
  if (state.iterations >= MAX_ITERATIONS) {
    return 'end'; // Hit iteration limit
  }
  return 'revise'; // Need another revision
}

// Build the graph
const workflow = new StateGraph(ContentState)
  // Add all nodes
  .addNode('research', research)
  .addNode('outline', outline)
  .addNode('draft', draft)
  .addNode('review', review)

  // Linear flow: START → research → outline → draft → review
  .addEdge(START, 'research')
  .addEdge('research', 'outline')
  .addEdge('outline', 'draft')
  .addEdge('draft', 'review')

  // Conditional: review → END (if good) or → draft (if needs revision)
  .addConditionalEdges('review', shouldContinueRevising, {
    end: END,
    revise: 'draft', // Loop back to draft for revision
  });

// Compile
export const contentCreator = workflow.compile();
```

### Hour 2: Run and Test

```typescript
// src/index.ts
import { contentCreator } from './graph';

async function main() {
  console.log('Starting Content Creator Agent...\n');

  const result = await contentCreator.invoke({
    topic: 'Why TypeScript developers should learn AI engineering in 2025',
    targetAudience: 'senior TypeScript/JavaScript developers',
    targetLength: 'medium (800-1200 words)',
  });

  // Print the journey
  console.log('\n=== Agent Log ===');
  result.logs.forEach((log: string) => console.log(log));
  console.log('\n=== Final Stats ===');
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Final Score: ${result.reviewScore}/10`);
  console.log(`Status: ${result.status}`);
  console.log('\n=== Review Feedback ===');
  console.log(result.reviewFeedback);
  console.log('\n=== Final Article ===');
  console.log(result.draft);
}

main().catch(console.error);
```

### Hour 3: Stream the Graph Execution

LangGraph supports streaming, which lets you see each node's output as it happens:

```typescript
// Stream events from the graph
const stream = await contentCreator.stream({
  topic: 'Building production AI applications with LangGraph',
  targetAudience: 'AI engineers',
  targetLength: 'short (500-800 words)',
});

for await (const event of stream) {
  // Each event is { nodeName: partialState }
  const [nodeName, output] = Object.entries(event)[0];

  console.log(`\n--- ${nodeName.toUpperCase()} ---`);

  if (nodeName === 'research') {
    console.log(`Research gathered (${output.research?.length || 0} chars)`);
  } else if (nodeName === 'outline') {
    console.log(`Outline created`);
  } else if (nodeName === 'draft') {
    console.log(`Draft written (iteration ${output.iterations})`);
  } else if (nodeName === 'review') {
    console.log(`Review: ${output.reviewScore}/10`);
    if (output.reviewScore < 8) {
      console.log(`Sending back for revision...`);
    } else {
      console.log(`Article approved!`);
    }
  }
}
```

### Add Langfuse Tracing

```typescript
import { CallbackHandler } from 'langfuse-langchain';

const langfuseHandler = new CallbackHandler({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
});

const result = await contentCreator.invoke(
  { topic: 'LangGraph for production agents' },
  { callbacks: [langfuseHandler] }
);

await langfuseHandler.flushAsync();
```

### What This Agent Demonstrates

1. **Sequential orchestration:** Research -> Outline -> Draft -> Review in order
2. **Conditional routing:** Quality gate decides continue or finish
3. **Cycles with termination:** Revision loop with max iteration limit
4. **Typed state:** Full TypeScript safety throughout the pipeline
5. **State reducers:** Logs accumulate across all nodes
6. **Different models:** Sonnet for writing, Haiku for review (cost optimization)
7. **Structured output:** Zod schema for the review score
8. **Observability:** Langfuse traces every node

## Key Insight

The Content Creator demonstrates why LangGraph exists. This workflow has five steps, a conditional branch, a cycle with two termination conditions, accumulating state, and different models for different steps. Building this with a while loop is possible but messy -- you end up with nested conditions, manual state tracking, and unclear flow. The LangGraph version is self-documenting. Reading the graph definition tells you exactly what happens. This clarity scales: when your graph has 10 nodes and 5 conditional edges, the declarative graph definition is vastly more maintainable than imperative spaghetti.

## Resources

- [LangGraph.js Tutorials](https://langchain-ai.github.io/langgraphjs/tutorials/)
- [LangGraph State Management](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#state)
- [LangGraph Conditional Edges](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#conditional-edges)
- [LangGraph Streaming](https://langchain-ai.github.io/langgraphjs/concepts/streaming/)

## Done When

- [ ] Content Creator agent runs end-to-end: research -> outline -> draft -> review
- [ ] The review loop works: low scores trigger revision, high scores or max iterations end the graph
- [ ] You can stream the graph execution and see each node's output
- [ ] Different models are used for different steps (Sonnet for writing, Haiku for review)
- [ ] Langfuse tracing captures the full graph execution
- [ ] The agent produces a genuinely readable article
- [ ] You can explain the graph architecture to someone looking at the code

---

*Tomorrow: Faza 3 Review. Check everything. Push everything. Prepare for Faza 4. You are six projects deep and twelve weeks in.*
