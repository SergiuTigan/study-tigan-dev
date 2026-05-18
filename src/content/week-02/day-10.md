# Day 10 — Multi-Tool & Agent Loop

> *"Every AI agent ever built is a while loop with tool calls. Everything else is just abstractions on top."*

**Date:** Miercuri, 28 Mai 2025
**Hours:** 2h · Seara (20:00--22:00)
**Topic:** Multi-tool orchestration and the agentic loop
**Phase:** Faza 1 — Foundations · Week 2

---

## What You're Doing

Yesterday you gave Claude one tool. Today you give it several -- and then you build the loop that lets Claude call them autonomously, one after another, until it has everything it needs to answer.

This is the day where something clicks. You'll implement a ~30-line loop that is, architecturally, identical to what powers Claude Code, GitHub Copilot's agent mode, and every "AI agent" startup you've seen on Twitter. The loop is almost embarrassingly simple. The power comes from what you put inside it.

Think about Angular's change detection cycle: Angular checks components, detects changes, updates the DOM, checks again, until stable. The agent loop works the same way: send a message, check if Claude needs a tool, execute it, send the result, check again, until Claude says "I'm done."

Today you graduate from "calling an API" to "building an agent."

---

## The Work

### Multi-Tool Setup

First, define multiple tools. Each tool is independent -- Claude picks which ones to use based on the user's question:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description:
      "Get current weather for a specific city. Returns temperature, condition, and humidity.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "City name, e.g. 'Bucharest' or 'Paris, France'",
        },
      },
      required: ["location"],
    },
  },
  {
    name: "fetch_url",
    description:
      "Fetch the text content of a webpage URL. Returns the raw text content (HTML stripped). Use for reading articles, documentation, or any public webpage.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The full URL to fetch, e.g. 'https://example.com'",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "calculate",
    description:
      "Evaluate a mathematical expression. Supports basic arithmetic (+, -, *, /), exponents (**), parentheses, and common math functions (sqrt, sin, cos, log). Returns the numeric result.",
    input_schema: {
      type: "object" as const,
      properties: {
        expression: {
          type: "string",
          description:
            "The math expression to evaluate, e.g. '(15 * 7) + sqrt(144)'",
        },
      },
      required: ["expression"],
    },
  },
];
```

### Tool Execution Dispatcher

You need a function that routes tool calls to the right implementation:

```typescript
async function executeTool(
  name: string,
  input: Record<string, string>
): Promise<string> {
  switch (name) {
    case "get_weather": {
      const url = `https://wttr.in/${encodeURIComponent(input.location)}?format=j1`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const c = data.current_condition[0];
        return JSON.stringify({
          location: input.location,
          temp_c: c.temp_C,
          condition: c.weatherDesc[0].value,
          humidity: c.humidity + "%",
        });
      } catch {
        return JSON.stringify({ error: `Weather unavailable for ${input.location}` });
      }
    }

    case "fetch_url": {
      try {
        const res = await fetch(input.url);
        const html = await res.text();
        // Simple HTML strip -- in production, use a proper library
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3000); // Limit to save tokens
        return text || "Page returned empty content.";
      } catch {
        return JSON.stringify({ error: `Failed to fetch ${input.url}` });
      }
    }

    case "calculate": {
      try {
        // Safe-ish math evaluation (for production, use mathjs library)
        const sanitized = input.expression
          .replace(/sqrt/g, "Math.sqrt")
          .replace(/sin/g, "Math.sin")
          .replace(/cos/g, "Math.cos")
          .replace(/log/g, "Math.log")
          .replace(/pi/gi, "Math.PI")
          .replace(/e(?![a-zA-Z])/g, "Math.E");

        // Only allow math characters
        if (!/^[0-9+\-*/().Math\s,sqrtincolegPIE]+$/.test(sanitized)) {
          return JSON.stringify({ error: "Invalid expression" });
        }

        const result = new Function(`return ${sanitized}`)();
        return JSON.stringify({ expression: input.expression, result });
      } catch {
        return JSON.stringify({ error: `Could not evaluate: ${input.expression}` });
      }
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
```

### THE Agent Loop

Here it is. The pattern that powers every AI agent. Read it slowly:

```typescript
async function agentLoop(userMessage: string): Promise<string> {
  // Initialize the conversation
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  console.log(`\nUser: ${userMessage}\n`);

  // THE LOOP
  while (true) {
    // Send message to Claude with all tools available
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system:
        "You are a helpful assistant with access to weather, web fetching, and calculation tools. Use them when needed. Think step by step about which tools to use.",
      tools: tools,
      messages: messages,
    });

    console.log(`  [stop_reason: ${response.stop_reason}, tokens: ${response.usage.input_tokens}+${response.usage.output_tokens}]`);

    // Check if Claude is done (no more tool calls)
    if (response.stop_reason === "end_turn") {
      // Extract and return the final text
      const textBlock = response.content.find((b) => b.type === "text");
      const finalText = textBlock && textBlock.type === "text" ? textBlock.text : "";
      console.log(`\nClaude: ${finalText}`);
      return finalText;
    }

    // Claude wants to use tool(s) -- process ALL tool calls in this response
    // Add Claude's response to message history
    messages.push({ role: "assistant", content: response.content });

    // Extract all tool use blocks
    const toolUseBlocks = response.content.filter(
      (block) => block.type === "tool_use"
    );

    // Execute each tool and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      if (toolUse.type === "tool_use") {
        console.log(`  -> Tool: ${toolUse.name}(${JSON.stringify(toolUse.input)})`);

        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, string>
        );

        console.log(`  <- Result: ${result.slice(0, 100)}...`);

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result,
        });
      }
    }

    // Send ALL tool results back to Claude
    messages.push({ role: "user", content: toolResults });

    // Loop continues -- Claude will process results and either:
    // a) Make more tool calls, or
    // b) Give a final response (stop_reason: "end_turn")
  }
}
```

That's it. That's the whole agent loop. Let me break down why each piece matters:

### Anatomy of the Loop

```
┌─────────────────────────────────────────┐
│  while (true)                            │
│  ┌─────────────────────────────────────┐ │
│  │ 1. Send messages + tools to Claude  │ │
│  └──────────────┬──────────────────────┘ │
│                 │                         │
│        ┌────────▼────────┐               │
│        │ stop_reason?     │               │
│        └────────┬────────┘               │
│                 │                         │
│     ┌───────────┼───────────┐            │
│     │                       │            │
│  "end_turn"            "tool_use"        │
│     │                       │            │
│  ┌──▼──┐    ┌──────────────▼──────────┐ │
│  │BREAK│    │ Extract tool calls       │ │
│  │return│   │ Execute each tool        │ │
│  │text  │   │ Append results to msgs   │ │
│  └──────┘   │ Continue loop            │ │
│             └─────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Parallel Tool Calls

Claude can request **multiple tools in a single response**. For example, if you ask "Compare the weather in Bucharest and London," Claude might return:

```json
{
  "content": [
    { "type": "text", "text": "I'll check both cities for you." },
    { "type": "tool_use", "id": "toolu_1", "name": "get_weather", "input": { "location": "Bucharest" } },
    { "type": "tool_use", "id": "toolu_2", "name": "get_weather", "input": { "location": "London" } }
  ],
  "stop_reason": "tool_use"
}
```

Your loop already handles this -- it collects ALL tool use blocks and sends ALL results back at once. Claude processes them together.

In production, you could execute parallel tool calls concurrently with `Promise.all`:

```typescript
const toolResults = await Promise.all(
  toolUseBlocks
    .filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use")
    .map(async (toolUse) => {
      const result = await executeTool(
        toolUse.name,
        toolUse.input as Record<string, string>
      );
      return {
        type: "tool_result" as const,
        tool_use_id: toolUse.id,
        content: result,
      };
    })
);
```

### Chained Tool Calls

The magic happens when Claude chains tools across multiple loop iterations. Ask something like:

> "Fetch the Anthropic pricing page and calculate the cost of sending 1 million tokens with Sonnet."

Claude will:
1. **Iteration 1**: Call `fetch_url("https://www.anthropic.com/pricing")` to get pricing data
2. **Iteration 2**: Call `calculate("3 * 1")` to compute the input cost (using data from step 1)
3. **Iteration 3**: Return the final answer with `stop_reason: "end_turn"`

Three iterations of the loop. Three API calls. Claude reasoning through a multi-step problem by choosing tools strategically. This is agentic behavior.

### Safety: Loop Limits

Always add a maximum iteration limit in production:

```typescript
const MAX_ITERATIONS = 10;
let iteration = 0;

while (iteration < MAX_ITERATIONS) {
  iteration++;
  // ... loop body ...

  if (response.stop_reason === "end_turn") break;
}

if (iteration >= MAX_ITERATIONS) {
  console.log("Warning: Agent loop hit maximum iterations.");
}
```

Without this, a pathological prompt could cause infinite tool calls. Each iteration costs tokens and money.

---

## Key Insight

The agent loop is not complex. It's `while(true) → call Claude → if done, break → process tools → loop`. The same pattern, whether you're building a weather chatbot or an autonomous coding agent. What changes between a simple bot and a sophisticated agent isn't the loop -- it's the *tools you put inside it* and the *system prompt that guides tool selection*.

When someone says "AI agent," mentally translate it to "while loop with tool calls."

---

## Build

### Multi-Tool Agent CLI

Build an interactive CLI agent with these specifications:

1. **Three tools**: `get_weather`, `fetch_url`, `calculate`
2. **The agent loop**: Runs until `stop_reason === "end_turn"` or max 10 iterations
3. **Logging**: Print each tool call and result as the agent works
4. **Conversation mode**: Support multi-turn (remember previous messages)

Test with these increasingly complex queries:

```
Simple (1 tool):
"What's the weather in Tokyo?"

Multi-tool parallel:
"Compare the weather in Bucharest and Berlin."

Chained reasoning:
"If the temperature in Bucharest is above 20°C, calculate how many degrees
 above freezing that is in Fahrenheit."

Cross-tool:
"Fetch the Wikipedia page for Bucharest and tell me its population.
 Then calculate what 15% of that population is."
```

**Watch the logs.** See which tools Claude chooses, in what order, and how it chains results. This is the agent reasoning in real time.

**Stretch goal**: Add a 4th tool -- `read_file` -- that reads a local text file by path. Now your agent can interact with your filesystem (safely, read-only).

---

## Resources

- **[Tool Use Overview](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview)** -- Full documentation including multi-tool and chaining patterns.
- **[Anthropic Cookbook: Tool Use](https://github.com/anthropics/anthropic-cookbook/tree/main/tool_use)** -- Practical notebook examples with multi-tool setups.
- **[Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)** -- Anthropic's research blog on agent architectures. The agentic loop section maps directly to what you built today.

---

## Done When

- [ ] You have 3+ tools defined and working in a single conversation
- [ ] Your agent loop runs autonomously until `stop_reason === "end_turn"`
- [ ] Claude can chain tools across multiple loop iterations (use output of one tool as context for the next)
- [ ] Claude can call multiple tools in parallel in a single response
- [ ] You have a max iteration safety limit
- [ ] You've seen the agent loop handle at least one complex, multi-step question
- [ ] You can explain, from memory, the 5-step agent loop: send -> check stop_reason -> extract tool calls -> execute -> send results -> repeat

---

*Tomorrow: [Day 11 -- Structured Outputs](/day-11.md) -- making Claude return exact JSON shapes your code can consume, validated with Zod schemas.*
