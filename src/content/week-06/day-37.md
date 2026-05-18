# Day 37 — ReAct Pattern

> *"Thought. Action. Observation. Repeat. It's not just an agent architecture — it's how humans solve problems too."*

**Date:** Marti, 24 Iunie 2026
**Hours:** 2h · Evening build session
**Topic:** ReAct (Reasoning + Acting), the agent loop, building your first agent
**Phase:** Faza 2 — Patterns · Week 6

---

## What You're Doing

Yesterday was theory. Today you write code that thinks for itself.

The ReAct pattern — short for **Reasoning + Acting** — is the backbone of almost every agent you'll encounter in production. The original paper (Yao et al., 2022) showed that when you let an LLM interleave reasoning traces with actions, it dramatically outperforms both pure reasoning (chain-of-thought without tools) and pure acting (tool use without reasoning).

The pattern is elegantly simple:

1. The LLM receives a goal and a set of available tools
2. It *thinks* about what to do (reasoning)
3. It *acts* by calling a tool (acting)
4. It *observes* the tool's result (observation)
5. It decides: continue or finish?

This loop is the atomic unit of agent behavior. Every agent framework — LangChain, CrewAI, AutoGen — is just a wrapper around this loop. Today you'll build it from scratch so you understand every moving part.

## The Work

### Step 1: Define Agent State

The agent needs to track its progress. Define a clean state type:

```typescript
interface AgentMessage {
  role: 'thought' | 'action' | 'observation';
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
}

interface AgentState {
  goal: string;
  history: AgentMessage[];
  isComplete: boolean;
  finalAnswer: string | null;
  steps: number;
  maxSteps: number;
}

function createAgentState(goal: string, maxSteps: number = 10): AgentState {
  return {
    goal,
    history: [],
    isComplete: false,
    finalAnswer: null,
    steps: 0,
    maxSteps,
  };
}
```

Notice `maxSteps`. This is your safety net. Without it, a confused agent will loop until your API budget is gone.

### Step 2: Define Tools

Tools are just functions with descriptions. The LLM needs to know what's available:

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

const webSearch: Tool = {
  name: 'web_search',
  description: 'Search the web for current information. Returns top results with snippets.',
  parameters: {
    query: {
      type: 'string',
      description: 'The search query',
      required: true,
    },
  },
  execute: async (args) => {
    // Placeholder — tomorrow you'll wire up real search
    const query = args.query as string;
    return `Search results for "${query}":\n1. Result about ${query}...\n2. Another result...`;
  },
};

const readUrl: Tool = {
  name: 'read_url',
  description: 'Read the content of a webpage. Returns the main text content.',
  parameters: {
    url: {
      type: 'string',
      description: 'The URL to read',
      required: true,
    },
  },
  execute: async (args) => {
    return `Content from ${args.url}: [simulated webpage content]`;
  },
};

const finish: Tool = {
  name: 'finish',
  description: 'Call this when you have enough information to answer the question. Provide your final answer.',
  parameters: {
    answer: {
      type: 'string',
      description: 'Your final, complete answer to the original question',
      required: true,
    },
  },
  execute: async (args) => {
    return args.answer as string;
  },
};
```

The `finish` tool is critical. Without it, the agent has no way to signal "I'm done." It will keep searching forever.

### Step 3: The System Prompt

The system prompt teaches the agent how to behave:

```typescript
function buildSystemPrompt(tools: Tool[]): string {
  const toolDescriptions = tools.map(t =>
    `- **${t.name}**: ${t.description}`
  ).join('\n');

  return `You are a research agent. You solve problems by thinking step-by-step
and using tools to gather information.

## Available Tools
${toolDescriptions}

## How You Work
1. THINK about what you need to find out
2. Choose a tool and use it
3. Observe the result
4. Decide: do you have enough info, or do you need more?
5. When you have a complete answer, use the "finish" tool

## Rules
- Always think before acting
- Search for 2-3 different formulations if the first search isn't helpful
- Read at least 2 sources before forming a conclusion
- If a tool fails, try a different approach
- When you use "finish", provide a comprehensive answer with sources
- Never give up — if one approach fails, try another`;
}
```

### Step 4: The Agent Loop

This is the heart of the system. A while loop that keeps going until the agent finishes or hits the step limit:

```typescript
async function runAgent(goal: string, tools: Tool[]): Promise<string> {
  const state = createAgentState(goal, 10);
  const systemPrompt = buildSystemPrompt(tools);

  console.log(`\n🎯 Agent Goal: ${goal}\n`);

  while (!state.isComplete && state.steps < state.maxSteps) {
    state.steps++;
    console.log(`--- Step ${state.steps} ---`);

    // Build messages from history
    const messages = [
      { role: 'user', content: `Goal: ${goal}` },
      ...state.history.map(h => ({
        role: h.role === 'thought' ? 'assistant' : 'user',
        content: `[${h.role.toUpperCase()}] ${h.content}`,
      })),
    ];

    // Call LLM with tool definitions
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: {
          type: 'object',
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

    // Process response
    for (const block of response.content) {
      if (block.type === 'text') {
        // Agent's thinking
        console.log(`💭 Thought: ${block.text}`);
        state.history.push({ role: 'thought', content: block.text });
      }

      if (block.type === 'tool_use') {
        console.log(`🔧 Action: ${block.name}(${JSON.stringify(block.input)})`);
        state.history.push({
          role: 'action',
          content: `${block.name}(${JSON.stringify(block.input)})`,
          toolName: block.name,
          toolArgs: block.input,
        });

        // Execute the tool
        const tool = tools.find(t => t.name === block.name);
        if (!tool) {
          const error = `Tool "${block.name}" not found`;
          state.history.push({ role: 'observation', content: error });
          continue;
        }

        const result = await tool.execute(block.input);
        console.log(`👁 Observation: ${result.substring(0, 200)}...`);
        state.history.push({ role: 'observation', content: result });

        // Check if agent called finish
        if (block.name === 'finish') {
          state.isComplete = true;
          state.finalAnswer = block.input.answer as string;
        }
      }
    }
  }

  if (!state.isComplete) {
    return `Agent stopped after ${state.maxSteps} steps without finishing. ` +
           `Last observations may contain partial answers.`;
  }

  return state.finalAnswer!;
}
```

### Step 5: Run It

```typescript
const tools = [webSearch, readUrl, finish];

const answer = await runAgent(
  'What are the key differences between React Server Components and traditional SSR?',
  tools
);

console.log('\n=== FINAL ANSWER ===');
console.log(answer);
```

Watch the console. You'll see the agent think, search, read, think again, and eventually finish. It's mesmerizing the first time.

### Step 6: Observe and Reflect

Run the agent 3-5 times with different questions. Notice:

- Does it always take the same number of steps? (It shouldn't — that's the point.)
- Does it ever get stuck or loop? (If so, how would you detect that?)
- Does it use `finish` at the right time, or too early/late?

Write down your observations. These will inform Day 39's error recovery work.

## Key Insight

The ReAct loop is deceptively simple — it's just a while loop with an LLM call inside. But the magic is in the **history**. Every thought, action, and observation becomes part of the context for the next step. The agent literally builds up its working memory as it goes. This is why the full history matters: without it, the agent would forget what it already tried and repeat itself endlessly.

## Resources

- [ReAct: Synergizing Reasoning and Acting in Language Models (Original Paper)](https://arxiv.org/abs/2210.03629)
- [Anthropic Tool Use Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Building Effective Agents — Anthropic](https://www.anthropic.com/research/building-effective-agents)

## Done When

- [ ] You have a working ReAct agent loop that can think, act, and observe
- [ ] The agent uses at least 3 tools: search, read, and finish
- [ ] You've set a maxSteps limit and it's respected
- [ ] The full history is passed to the LLM at each step
- [ ] You've run the agent on 3+ different questions and observed the behavior
- [ ] You can explain why the finish tool is essential

---

*Tomorrow: Workflows vs Agents — a deep taxonomy. You'll build the same task as both a workflow and an agent, and compare the results.*
