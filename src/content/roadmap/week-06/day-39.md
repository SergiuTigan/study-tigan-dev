---
title: "Day 39 — Multi-Step & Error Recovery"
week: 6
day: 39
phase: 2
phaseLabel: "Deep Dive"
order: 639
type: "day"
---
# Day 39 — Multi-Step & Error Recovery

> *"In production, the question is never 'will it fail?' — it's 'what happens when it does?'"*

**Date:** Joi, 26 Iunie 2026
**Hours:** 2h · Evening build session
**Topic:** Safe tool execution, error recovery, retry logic, stuck detection
**Phase:** Faza 2 — Patterns · Week 6

---

## What You're Doing

Your agent from Day 37 works. In a demo. On your laptop. With simulated tools.

Today you make it work in the real world, where everything breaks. APIs time out. Rate limits hit. Search returns garbage. Webpages refuse to load. The LLM hallucinates a tool that doesn't exist. The agent gets stuck in a loop, burning tokens while producing nothing useful.

Error recovery isn't a nice-to-have in agent systems — it's the difference between a toy and a tool. An agent without error recovery is like a car without brakes: impressive until the first corner.

You're going to build three layers of defense: safe tool execution, intelligent retry logic, and stuck detection. By the end of today, your agent will be resilient enough to handle the chaos of real-world APIs.

## The Work

### Step 1: Safe Tool Execution

Wrap every tool call in a safety harness:

```typescript
interface ToolResult {
  success: boolean;
  data?: string;
  error?: string;
  duration: number;
}

async function executeToolSafely(
  tool: Tool,
  args: Record<string, unknown>,
  timeoutMs: number = 10000
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    // Race between tool execution and timeout
    const result = await Promise.race([
      tool.execute(args),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timed out')), timeoutMs)
      ),
    ]);

    return {
      success: true,
      data: result,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}
```

The key principle: **tools never throw.** They always return a result object. This means your agent loop never crashes — it just gets an observation that says "this didn't work."

### Step 2: Feed Errors Back to the Agent

When a tool fails, don't crash. Tell the agent what happened:

```typescript
// In the agent loop, replace the direct tool execution:
const toolResult = await executeToolSafely(tool, block.input);

if (toolResult.success) {
  const observation = toolResult.data!;
  console.log(`Observation: ${observation.substring(0, 200)}...`);
  state.history.push({ role: 'observation', content: observation });
} else {
  // Feed the error back as an observation
  const errorMsg = `Tool "${block.name}" failed: ${toolResult.error}. ` +
                   `Try a different approach or different parameters.`;
  console.log(`Error: ${errorMsg}`);
  state.history.push({ role: 'observation', content: errorMsg });
}
```

This is powerful. The agent now *knows* the tool failed and can adapt. It might try a different search query, a different URL, or a completely different approach. The error becomes information, not a crash.

### Step 3: Retry with Exponential Backoff

Some failures are transient — rate limits, network blips, temporary outages. Build a retry wrapper:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * baseDelay; // 1s, 2s, 4s
        const jitter = Math.random() * 500; // Add randomness to prevent thundering herd
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay + jitter}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }

  throw lastError!;
}

// Usage in tool execution:
async function executeToolWithRetry(
  tool: Tool,
  args: Record<string, unknown>,
  maxRetries: number = 2
): Promise<ToolResult> {
  return withRetry(
    () => executeToolSafely(tool, args),
    maxRetries
  );
}
```

The exponential backoff pattern (1s, 2s, 4s) gives temporary failures time to resolve without hammering the API. The jitter prevents multiple retries from hitting at the same instant.

### Step 4: Enhanced Agent State

Your agent state needs to track more than just history:

```typescript
interface EnhancedAgentState extends AgentState {
  errors: Array<{
    step: number;
    toolName: string;
    error: string;
    timestamp: number;
  }>;
  retryCount: number;
  startTime: number;
  maxDuration: number; // milliseconds
  uniqueObservations: Set<string>; // for stuck detection
}

function createEnhancedState(
  goal: string,
  maxSteps: number = 15,
  maxDuration: number = 120000 // 2 minutes
): EnhancedAgentState {
  return {
    goal,
    history: [],
    isComplete: false,
    finalAnswer: null,
    steps: 0,
    maxSteps,
    errors: [],
    retryCount: 0,
    startTime: Date.now(),
    maxDuration,
    uniqueObservations: new Set(),
  };
}
```

### Step 5: Stuck Detection

The subtlest agent failure: the agent isn't *crashing*, it's just not *progressing*. It searches the same thing, reads the same pages, goes in circles. Build a detector:

```typescript
function isAgentStuck(state: EnhancedAgentState): boolean {
  const recentHistory = state.history.slice(-9); // Last 3 full cycles (thought+action+observation)
  const recentObservations = recentHistory
    .filter(h => h.role === 'observation')
    .map(h => h.content);

  // Check 1: Are recent observations identical?
  if (recentObservations.length >= 3) {
    const unique = new Set(recentObservations);
    if (unique.size === 1) {
      console.log('STUCK: Last 3 observations are identical');
      return true;
    }
  }

  // Check 2: Is the agent repeating the same actions?
  const recentActions = recentHistory
    .filter(h => h.role === 'action')
    .map(h => h.content);

  if (recentActions.length >= 3) {
    const unique = new Set(recentActions);
    if (unique.size === 1) {
      console.log('STUCK: Last 3 actions are identical');
      return true;
    }
  }

  // Check 3: Has the agent been running too long?
  if (Date.now() - state.startTime > state.maxDuration) {
    console.log('STUCK: Max duration exceeded');
    return true;
  }

  // Check 4: Too many consecutive errors?
  const recentErrors = state.errors.filter(
    e => e.step > state.steps - 3
  );
  if (recentErrors.length >= 3) {
    console.log('STUCK: 3 consecutive errors');
    return true;
  }

  return false;
}
```

### Step 6: The Resilient Agent Loop

Put it all together:

```typescript
async function runResilientAgent(
  goal: string,
  tools: Tool[]
): Promise<string> {
  const state = createEnhancedState(goal);

  while (!state.isComplete && state.steps < state.maxSteps) {
    // Check if stuck
    if (isAgentStuck(state)) {
      console.log('Agent appears stuck. Forcing finish with partial results.');

      // Extract whatever useful info we have
      const observations = state.history
        .filter(h => h.role === 'observation' && !h.content.includes('failed'))
        .map(h => h.content)
        .join('\n');

      return `[PARTIAL - Agent stopped due to lack of progress]\n\n` +
             `Based on information gathered:\n${observations || 'No useful information collected.'}`;
    }

    state.steps++;
    // ... rest of the agent loop, using executeToolSafely
  }

  if (!state.isComplete) {
    return `Agent reached step limit (${state.maxSteps}). Partial results available.`;
  }

  return state.finalAnswer!;
}
```

### Step 7: Test the Failure Modes

Create tools that deliberately fail to test your recovery:

```typescript
const flakySearch: Tool = {
  name: 'web_search',
  description: 'Search the web',
  parameters: { query: { type: 'string', description: 'Query', required: true } },
  execute: async (args) => {
    // Fails 50% of the time
    if (Math.random() < 0.5) {
      throw new Error('Rate limit exceeded');
    }
    return `Results for "${args.query}": ...`;
  },
};

const slowReader: Tool = {
  name: 'read_url',
  description: 'Read a webpage',
  parameters: { url: { type: 'string', description: 'URL', required: true } },
  execute: async (args) => {
    // Takes too long 30% of the time
    if (Math.random() < 0.3) {
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
    return `Content from ${args.url}: ...`;
  },
};
```

Run the agent with these flaky tools. Verify that it recovers gracefully, retries when appropriate, and stops when stuck.

## Key Insight

Error recovery in agents follows a hierarchy: **(1)** retry the same thing (transient failure), **(2)** try a different approach (permanent failure), **(3)** stop with partial results (no progress). Each level is a fallback for when the previous level fails. The worst thing an agent can do is silently loop — consuming tokens, producing nothing, and burning your budget. Stuck detection is not optional; it's your financial safety valve.

## Resources

- [Building Effective Agents — Anthropic (Error Recovery Section)](https://www.anthropic.com/research/building-effective-agents)
- [Exponential Backoff — Google Cloud Docs](https://cloud.google.com/iot/docs/how-tos/exponential-backoff)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

## Done When

- [ ] Every tool call is wrapped in `executeToolSafely` with timeout
- [ ] Tool failures are fed back to the agent as observations, not crashes
- [ ] `withRetry` implements exponential backoff with jitter
- [ ] Agent state tracks errors, retry count, start time, and duration
- [ ] Stuck detection catches: repeated observations, repeated actions, timeout, consecutive errors
- [ ] A stuck agent stops gracefully with partial results
- [ ] You've tested with deliberately flaky tools and the agent recovers

---

*Day 40 is REST. Day 41: You build the full Research Agent — real APIs, real search, real web reading. Everything you've built this week comes together.*
