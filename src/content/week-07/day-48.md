# Day 48 — Subagents (Claude Code Pattern)

> *"The parent decides WHAT needs to happen. The subagent decides HOW to make it happen. This separation of concerns is what makes multi-agent systems work."*

**Date:** Sambata, 5 Iulie 2026
**Hours:** 3h · Deep build session
**Topic:** Subagent spawning, isolated contexts, the delegation pattern
**Phase:** Faza 2 — Patterns · Week 7

---

## What You're Doing

On Day 46, you built orchestrator-worker — a pattern where workers are simple prompt completions. Today you level up. Workers become **full agents** — with their own reasoning loops, their own tools, their own step limits, and their own completion criteria.

This is the subagent pattern, and it's how Claude Code handles complex tasks internally. When you ask Claude Code to "refactor this module and update all the tests," it doesn't try to do everything in one reasoning chain. It spawns subagents: one to analyze the codebase, one to perform the refactoring, one to update tests. Each subagent has a focused context (it only sees what it needs), focused tools (it only has what it needs), and a clear completion criterion (it knows when it's done).

The key difference from orchestrator-worker: **subagents are autonomous.** The parent doesn't micromanage them. It says "research this topic and give me a summary" and the subagent decides how many searches to run, which pages to read, when to stop. Results flow back as tool results in the parent's context.

## The Work

### Step 1: Subagent Configuration

Define what makes a subagent:

```typescript
interface SubagentConfig {
  name: string;
  systemPrompt: string;
  tools: Tool[];       // Each subagent gets its OWN set of tools
  maxSteps: number;    // Each subagent has its own step limit
  model: string;       // Can use different models per subagent
  completionCriteria: string; // What "done" means for this subagent
}

interface SubagentResult {
  name: string;
  success: boolean;
  output: string;
  steps: number;
  duration: number;
  tokenUsage: { input: number; output: number };
}
```

### Step 2: The Subagent Runner

A subagent is just a self-contained agent with its own context:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function runSubagent(
  config: SubagentConfig,
  task: string
): Promise<SubagentResult> {
  const startTime = Date.now();
  let totalInput = 0;
  let totalOutput = 0;

  console.log(`\n  [Subagent: ${config.name}] Starting...`);
  console.log(`  Task: ${task.substring(0, 100)}...`);
  console.log(`  Model: ${config.model}, Max steps: ${config.maxSteps}`);

  // Isolated message history — this is critical
  // The subagent's context is SEPARATE from the parent's
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: task },
  ];

  let step = 0;
  let finalOutput = '';
  let isComplete = false;

  while (!isComplete && step < config.maxSteps) {
    step++;

    const response = await anthropic.messages.create({
      model: config.model,
      max_tokens: 1024,
      system: config.systemPrompt + `\n\nCompletion criteria: ${config.completionCriteria}`,
      messages,
      tools: config.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: {
          type: 'object' as const,
          properties: Object.fromEntries(
            Object.entries(t.parameters).map(([key, val]) => [
              key,
              { type: val.type, description: val.description },
            ])
          ),
          required: Object.entries(t.parameters)
            .filter(([_, v]) => v.required)
            .map(([k]) => k),
        },
      })),
    });

    totalInput += response.usage.input_tokens;
    totalOutput += response.usage.output_tokens;

    // Process response — add assistant message
    messages.push({ role: 'assistant', content: response.content });

    // Handle tool calls
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        console.log(`  [${config.name}] Step ${step}: ${block.text.substring(0, 80)}...`);
      }

      if (block.type === 'tool_use') {
        const tool = config.tools.find(t => t.name === block.name);

        if (block.name === 'finish' || block.name === 'submit_result') {
          isComplete = true;
          finalOutput = (block.input as { result: string }).result;
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: 'Result accepted.',
          });
          break;
        }

        if (tool) {
          try {
            const result = await tool.execute(block.input as Record<string, unknown>);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result,
            });
          } catch (error) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              is_error: true,
            });
          }
        }
      }
    }

    // Add tool results if any
    if (toolResults.length > 0 && !isComplete) {
      messages.push({ role: 'user', content: toolResults });
    }

    // If the response had stop_reason 'end_turn' with no tool calls, treat text as output
    if (response.stop_reason === 'end_turn' && !response.content.some(b => b.type === 'tool_use')) {
      isComplete = true;
      finalOutput = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as Anthropic.TextBlock).text)
        .join('\n');
    }
  }

  const duration = Date.now() - startTime;
  console.log(`  [${config.name}] Completed in ${step} steps, ${duration}ms`);

  return {
    name: config.name,
    success: isComplete,
    output: finalOutput || 'Subagent did not produce output within step limit.',
    steps: step,
    duration,
    tokenUsage: { input: totalInput, output: totalOutput },
  };
}
```

The critical detail: **isolated message history.** Each subagent starts with a fresh `messages` array. It doesn't see the parent's conversation, the other subagents' work, or anything outside its own context. This isolation is what makes subagents reliable — they can't be confused by irrelevant context.

### Step 3: The Parent Agent

The parent agent uses subagents as tools:

```typescript
function createSubagentTool(config: SubagentConfig): Tool {
  return {
    name: `delegate_to_${config.name}`,
    description: `Delegate a task to the "${config.name}" subagent. ${config.completionCriteria}`,
    parameters: {
      task: {
        type: 'string',
        description: 'Clear description of what the subagent should accomplish',
        required: true,
      },
    },
    execute: async (args) => {
      const result = await runSubagent(config, args.task as string);
      return result.success
        ? `[${result.name} completed in ${result.steps} steps]\n\n${result.output}`
        : `[${result.name} failed after ${result.steps} steps]\n\n${result.output}`;
    },
  };
}
```

### Step 4: Build a Multi-Subagent System

Create specialized subagents for a content creation pipeline:

```typescript
const researchSubagent: SubagentConfig = {
  name: 'researcher',
  systemPrompt: `You are a research specialist. Your job is to find accurate,
current information on a given topic. Search multiple sources, cross-reference
facts, and note any contradictions.`,
  tools: [webSearchTool, readWebpageTool, submitResultTool],
  maxSteps: 8,
  model: 'claude-sonnet-4-20250514',
  completionCriteria: 'Submit a research brief with 5+ key findings and sources.',
};

const writerSubagent: SubagentConfig = {
  name: 'writer',
  systemPrompt: `You are a technical writer. Given research notes, you produce
clear, engaging, well-structured content. Use examples. Be concise but thorough.`,
  tools: [submitResultTool],
  maxSteps: 3,
  model: 'claude-sonnet-4-20250514',
  completionCriteria: 'Submit a polished, formatted article.',
};

const factCheckerSubagent: SubagentConfig = {
  name: 'fact_checker',
  systemPrompt: `You are a fact checker. Verify claims against sources.
Flag anything that seems inaccurate, outdated, or unsupported.`,
  tools: [webSearchTool, submitResultTool],
  maxSteps: 5,
  model: 'claude-haiku-4-20250514', // Cheaper model for simple verification
  completionCriteria: 'Submit a list of verified facts and any flagged issues.',
};

// The submit_result tool every subagent needs
const submitResultTool: Tool = {
  name: 'submit_result',
  description: 'Submit your final result. Call this when your work is complete.',
  parameters: {
    result: { type: 'string', description: 'Your final output', required: true },
  },
  execute: async (args) => args.result as string,
};
```

### Step 5: The Parent Orchestration

```typescript
async function createContentWithSubagents(topic: string): Promise<string> {
  console.log(`\n=== Content Creation Pipeline: "${topic}" ===\n`);

  // Step 1: Research (subagent decides how to research)
  console.log('Phase 1: Research');
  const researchResult = await runSubagent(researchSubagent,
    `Research the topic: "${topic}". Find current information, statistics,
    expert opinions, and practical examples. Provide a comprehensive research brief.`
  );

  // Step 2: Write (subagent decides how to structure the article)
  console.log('\nPhase 2: Writing');
  const writeResult = await runSubagent(writerSubagent,
    `Write a comprehensive article about "${topic}" based on this research:

    ${researchResult.output}

    The article should be engaging, well-structured, and include practical examples.`
  );

  // Step 3: Fact-check (subagent decides what to verify)
  console.log('\nPhase 3: Fact-Checking');
  const factCheckResult = await runSubagent(factCheckerSubagent,
    `Fact-check this article. Verify key claims and statistics:

    ${writeResult.output}`
  );

  // Parent synthesizes
  console.log('\nPhase 4: Final Synthesis');
  const synthesis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Here is an article and its fact-check results.
Make any necessary corrections and produce the final version.

Article:
${writeResult.output}

Fact-Check Report:
${factCheckResult.output}

Output the corrected, final article only.`,
    }],
  });

  // Print metrics
  const allResults = [researchResult, writeResult, factCheckResult];
  const totalSteps = allResults.reduce((s, r) => s + r.steps, 0);
  const totalDuration = allResults.reduce((s, r) => s + r.duration, 0);

  console.log('\n=== PIPELINE METRICS ===');
  for (const r of allResults) {
    console.log(`  ${r.name}: ${r.steps} steps, ${r.duration}ms, ${r.tokenUsage.input + r.tokenUsage.output} tokens`);
  }
  console.log(`  Total: ${totalSteps} steps, ${totalDuration}ms`);

  return synthesis.content[0].type === 'text' ? synthesis.content[0].text : '';
}

// Run it
const article = await createContentWithSubagents('The state of WebAssembly in 2026');
console.log('\n=== FINAL ARTICLE ===\n');
console.log(article);
```

### Step 6: Compare — Subagent vs Single Agent

Run the same task with a single agent and with the subagent pipeline:

```markdown
## Comparison: Single Agent vs Subagent Pipeline

| Metric           | Single Agent    | Subagent Pipeline     |
|------------------|-----------------|------------------------|
| Total steps      | 10-15           | 16-20 (across 3 agents)|
| Quality          | Good            | Better (specialized)   |
| Fact accuracy    | No verification | Explicit fact-checking |
| Context window   | Crowded         | Clean (isolated)       |
| Cost             | ~$0.05          | ~$0.08                 |
| Maintainability  | One big prompt   | Modular, testable      |
```

The subagent approach costs more but produces better results because each agent has a focused context and a clear job. The fact-checker catches errors the writer wouldn't notice.

## Key Insight

The separation between WHAT and HOW is the design principle that makes subagents work. The parent says "research this topic" — that's the WHAT. The research subagent decides to search three times, read five pages, and take notes — that's the HOW. This separation means you can improve the researcher without touching the parent, replace the writer with a different model, or add a new subagent (translator, SEO optimizer) without restructuring the whole system. It's the same principle as microservices, applied to AI reasoning.

## Resources

- [Claude Code Architecture](https://docs.anthropic.com/en/docs/claude-code)
- [Building Effective Agents — Anthropic](https://www.anthropic.com/research/building-effective-agents)
- [Multi-Agent Systems — Overview](https://arxiv.org/abs/2402.01680)

## Done When

- [ ] You have a `runSubagent` function that executes an agent with isolated context
- [ ] Each subagent has its own tools, step limit, model, and completion criteria
- [ ] The parent agent delegates via `createSubagentTool`
- [ ] You've built at least 3 specialized subagents (researcher, writer, fact-checker)
- [ ] Context isolation is working — subagents don't see each other's messages
- [ ] You've observed that subagents take different numbers of steps based on the task
- [ ] You can explain the WHAT vs HOW separation to a colleague

---

*Tomorrow: Polish your MCP server, add documentation, integrate an orchestrator demo, and ship everything to GitHub.*
