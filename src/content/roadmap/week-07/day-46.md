---
title: "Day 46 — Orchestrator-Worker Pattern"
week: 7
day: 46
phase: 2
phaseLabel: "Deep Dive"
order: 746
type: "day"
---
# Day 46 — Orchestrator-Worker Pattern

> *"A good manager doesn't do the work — they break the work into pieces and put the right people on each piece."*

**Date:** Joi, 3 Iulie 2026
**Hours:** 2h · Evening build session
**Topic:** Orchestrator-worker pattern, multi-model delegation, parallel execution
**Phase:** Faza 2 — Patterns · Week 7

---

## What You're Doing

You've been building single agents — one LLM reasoning through one problem with one set of tools. That works for many tasks, but it hits a ceiling. One context window. One thread of reasoning. One model's strengths and weaknesses.

The Orchestrator-Worker pattern shatters that ceiling. Instead of one agent doing everything, you have:

- **One orchestrator** — a strong model that plans and delegates
- **Multiple workers** — potentially cheaper models that execute specific subtasks
- **A synthesis step** — the orchestrator merges all results into a final output

This is how Claude Code works internally. When you ask it to "refactor this codebase," it doesn't try to reason about every file in one context window. An orchestrator identifies the files that need changes, workers handle individual files, and the orchestrator merges the results.

Today you build this pattern from scratch.

## The Work

### Step 1: The Architecture

Visualize the flow:

```
User Request: "Write a comprehensive guide about TypeScript generics"

Step 1: ORCHESTRATOR (Opus/Sonnet) plans
  → Subtask 1: "Write introduction explaining why generics matter"
  → Subtask 2: "Write section on basic generic functions with examples"
  → Subtask 3: "Write section on generic constraints and extends"
  → Subtask 4: "Write section on utility types (Partial, Pick, etc.)"
  → Subtask 5: "Write conclusion with best practices"

Step 2: WORKERS (Haiku/Sonnet) execute IN PARALLEL
  → Worker 1 → Introduction (Haiku — simple task)
  → Worker 2 → Basic functions (Sonnet — needs good examples)
  → Worker 3 → Constraints (Sonnet — complex topic)
  → Worker 4 → Utility types (Sonnet — needs accuracy)
  → Worker 5 → Conclusion (Haiku — simple task)

Step 3: ORCHESTRATOR synthesizes
  → Merges all sections
  → Ensures consistent tone and flow
  → Adds transitions between sections
  → Final output
```

### Step 2: Define the Types

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

interface Subtask {
  id: string;
  description: string;
  context: string;          // What the worker needs to know
  model: 'haiku' | 'sonnet' | 'opus'; // Model selection per task
  dependencies?: string[];  // IDs of subtasks that must complete first
}

interface SubtaskResult {
  id: string;
  content: string;
  model: string;
  duration: number;
  tokenUsage: number;
}

interface OrchestratorPlan {
  subtasks: Subtask[];
  synthesisInstructions: string; // How to merge the results
}

const MODEL_MAP = {
  haiku: 'claude-haiku-4-20250514',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
};
```

### Step 3: The Orchestrator — Planning Phase

The orchestrator's job is to break a task into subtasks:

```typescript
async function planTask(task: string): Promise<OrchestratorPlan> {
  console.log('\n=== ORCHESTRATOR: Planning ===\n');

  const response = await anthropic.messages.create({
    model: MODEL_MAP.sonnet, // Sonnet is great for planning
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a task orchestrator. Break this task into 3-6 independent subtasks
that can be executed in parallel by different workers.

For each subtask, specify:
1. A clear, self-contained description
2. Any context the worker needs
3. Complexity: "simple" (use haiku) or "complex" (use sonnet)

Respond in JSON format:
{
  "subtasks": [
    {
      "id": "1",
      "description": "...",
      "context": "...",
      "model": "haiku" | "sonnet"
    }
  ],
  "synthesisInstructions": "How to merge the results into a cohesive output"
}

Task: ${task}`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Orchestrator did not produce a valid plan');

  const plan = JSON.parse(jsonMatch[0]) as OrchestratorPlan;

  console.log(`Plan: ${plan.subtasks.length} subtasks`);
  for (const st of plan.subtasks) {
    console.log(`  [${st.id}] (${st.model}) ${st.description.substring(0, 80)}...`);
  }

  return plan;
}
```

### Step 4: The Workers — Parallel Execution

Workers are simple: take a subtask, produce a result. The magic is running them in parallel:

```typescript
async function executeSubtask(subtask: Subtask): Promise<SubtaskResult> {
  const startTime = Date.now();

  console.log(`  Worker [${subtask.id}] starting on ${MODEL_MAP[subtask.model]}...`);

  const response = await anthropic.messages.create({
    model: MODEL_MAP[subtask.model],
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Complete this task thoroughly and well:

Task: ${subtask.description}

Context: ${subtask.context}

Produce ONLY the content. No preamble, no "Here's the..." — just the content itself.`,
    }],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  const duration = Date.now() - startTime;

  console.log(`  Worker [${subtask.id}] done in ${duration}ms (${response.usage.output_tokens} tokens)`);

  return {
    id: subtask.id,
    content,
    model: MODEL_MAP[subtask.model],
    duration,
    tokenUsage: response.usage.input_tokens + response.usage.output_tokens,
  };
}

async function executeAllWorkers(subtasks: Subtask[]): Promise<SubtaskResult[]> {
  console.log('\n=== WORKERS: Executing in parallel ===\n');
  const startTime = Date.now();

  // Run all independent subtasks in parallel
  const results = await Promise.all(
    subtasks.map(st => executeSubtask(st))
  );

  const totalDuration = Date.now() - startTime;
  const sequentialDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nAll workers done in ${totalDuration}ms (saved ${sequentialDuration - totalDuration}ms via parallelism)`);

  return results;
}
```

Notice the parallel execution. If you have 5 workers that each take 2 seconds, sequential execution takes 10 seconds. Parallel execution takes ~2 seconds. This is one of the key benefits of orchestrator-worker.

### Step 5: The Orchestrator — Synthesis Phase

The orchestrator merges worker results into a cohesive output:

```typescript
async function synthesizeResults(
  originalTask: string,
  plan: OrchestratorPlan,
  results: SubtaskResult[]
): Promise<string> {
  console.log('\n=== ORCHESTRATOR: Synthesizing ===\n');

  const workerOutputs = results
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(r => `--- Section ${r.id} ---\n${r.content}`)
    .join('\n\n');

  const response = await anthropic.messages.create({
    model: MODEL_MAP.sonnet,
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are synthesizing the work of multiple writers into one cohesive document.

Original task: ${originalTask}

Synthesis instructions: ${plan.synthesisInstructions}

Worker outputs:
${workerOutputs}

Merge these into a single, well-structured document. Ensure:
- Consistent tone throughout
- Smooth transitions between sections
- No redundancy
- A natural flow from start to finish`,
    }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

### Step 6: The Complete Pipeline

```typescript
async function orchestratorWorker(task: string): Promise<void> {
  const startTime = Date.now();

  // Phase 1: Plan
  const plan = await planTask(task);

  // Phase 2: Execute
  const results = await executeAllWorkers(plan.subtasks);

  // Phase 3: Synthesize
  const finalOutput = await synthesizeResults(task, plan, results);

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalTokens = results.reduce((sum, r) => sum + r.tokenUsage, 0);

  // Cost breakdown
  console.log('\n=== METRICS ===');
  console.log(`Total time: ${totalDuration}s`);
  console.log(`Total worker tokens: ${totalTokens}`);
  console.log(`Models used: ${[...new Set(results.map(r => r.model))].join(', ')}`);
  console.log(`Parallelism speedup: ${results.length}x potential`);

  console.log('\n=== FINAL OUTPUT ===\n');
  console.log(finalOutput);
}

// Run it
orchestratorWorker(
  'Write a comprehensive guide about TypeScript generics including basic usage, constraints, utility types, and best practices'
);
```

### Step 7: Observe the Cost Optimization

Run it and track the numbers:

```markdown
## Cost Comparison: Single Agent vs Orchestrator-Worker

Single Agent (Sonnet doing everything):
- ~4000 output tokens at Sonnet pricing
- Sequential, ~30 seconds
- One context window must hold everything

Orchestrator-Worker (Sonnet + Haiku mix):
- Orchestrator: ~500 tokens (Sonnet) — planning
- Workers: ~2000 tokens (mix of Haiku and Sonnet)
- Synthesizer: ~500 tokens (Sonnet) — merging
- Parallel workers, ~12 seconds total
- Each worker has a focused context window

Result: Similar quality, lower cost, faster execution.
```

## Key Insight

The orchestrator-worker pattern's real power isn't just parallelism — it's **model selection per subtask.** Simple, well-defined tasks (write an introduction, summarize a section) can use Haiku at 1/10th the cost. Complex tasks (write accurate code examples, analyze tradeoffs) get Sonnet. The orchestrator itself needs strong reasoning (Sonnet or Opus). This heterogeneous model approach is how you build AI systems that are both high-quality and economically viable.

## Resources

- [Building Effective Agents — Orchestrator-Worker Section](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic Model Comparison](https://docs.anthropic.com/en/docs/about-claude/models)
- [Promise.all — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

## Done When

- [ ] Your orchestrator breaks a task into 3-6 subtasks with appropriate model selection
- [ ] Workers execute in parallel using `Promise.all`
- [ ] You can see the time savings from parallelism in the logs
- [ ] The synthesizer merges worker outputs into a cohesive result
- [ ] You've observed the cost breakdown (Haiku vs Sonnet usage)
- [ ] You can explain why this pattern is better than a single large agent for structured tasks

---

*Day 47 is REST. Day 48: Subagents — spawning fully autonomous child agents with their own context, tools, and completion criteria. The Claude Code pattern.*
