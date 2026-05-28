---
title: "Day 14 — CLI Project #1: Ship It"
week: 2
day: 14
phase: 1
phaseLabel: "Foundations"
order: 214
type: "day"
---
# Day 14 — CLI Project #1: Ship It

> *"A project on your machine is a hobby. A project on GitHub is a portfolio piece."*

**Date:** Duminica, 1 Iunie 2025
**Hours:** 5h · Full session (10:00--15:00, with breaks)
**Topic:** Combine everything into a production-quality CLI tool and ship to GitHub
**Phase:** Faza 1 — Foundations · Week 2

---

## What You're Doing

This is the day you ship. Not "finish a tutorial." Not "get something working locally." Ship -- meaning a project someone can clone, understand, run, and evaluate. A project with a proper README, clean architecture, and every feature you've built this week wired together.

You're building a conversational CLI agent that streams responses, uses multiple tools, outputs structured JSON on demand, tracks every penny spent, and maintains conversation memory. This is your first AI Engineering portfolio piece, and it demonstrates something most candidates can't show: you don't just know the API -- you've built a real tool with it.

Five hours is generous for this. You already have all the pieces from Days 8-13. Today is architecture, integration, polish, and documentation. Treat this like a PR you're submitting for code review at your best job. Every file should have a purpose. Every decision should be defensible.

---

## The Work

### Project Architecture

Here's the target file structure:

```
claude-cli-agent/
├── src/
│   ├── index.ts              # Entry point: readline loop, CLI interface
│   ├── client.ts             # Anthropic client singleton + message handling
│   ├── agent-loop.ts         # The core agent loop
│   ├── tools/
│   │   ├── index.ts          # Tool registry: exports all tool definitions
│   │   ├── weather.ts        # get_weather tool: definition + implementation
│   │   ├── fetch-url.ts      # fetch_url tool: definition + implementation
│   │   └── calculator.ts     # calculate tool: definition + implementation
│   ├── structured/
│   │   └── schemas.ts        # Zod schemas + tool definitions for structured output
│   ├── cost-tracker.ts       # CostTracker class
│   └── types.ts              # Shared TypeScript types/interfaces
├── prompts.md                # Your system prompt, documented and versioned
├── package.json
├── tsconfig.json
├── .env.example              # ANTHROPIC_API_KEY=your-key-here
├── .gitignore
└── README.md
```

Every file has a single responsibility. Let's build each one.

### Step 1: Project Setup (30 min)

```bash
mkdir claude-cli-agent && cd claude-cli-agent
npm init -y
npm install @anthropic-ai/sdk zod dotenv
npm install -D typescript @types/node
npx tsc --init
```

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "npx tsx src/index.ts"
  }
}
```

Create `.gitignore`:
```
node_modules/
dist/
.env
```

Create `.env.example`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

### Step 2: Types and Client (20 min)

**`src/types.ts`**
```typescript
import Anthropic from "@anthropic-ai/sdk";

export interface ToolDefinition {
  tool: Anthropic.Tool;
  execute: (input: Record<string, unknown>) => Promise<string>;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string | Anthropic.ContentBlock[];
}

export interface AgentConfig {
  model: string;
  maxTokens: number;
  maxIterations: number;
  systemPrompt: string;
}

export const DEFAULT_CONFIG: AgentConfig = {
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
  maxIterations: 10,
  systemPrompt: `You are a helpful CLI assistant with access to tools for weather, web fetching, and calculations.

Guidelines:
- Use tools when the user's question requires external data
- Be concise but thorough
- When asked for structured data, use the appropriate extraction tool
- Always explain your reasoning when chaining multiple tools`,
};
```

**`src/client.ts`**
```typescript
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

let clientInstance: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic();
    // The SDK reads ANTHROPIC_API_KEY from env automatically
  }
  return clientInstance;
}
```

### Step 3: Tools (45 min)

Each tool file exports a `ToolDefinition` -- the schema AND the implementation together:

**`src/tools/weather.ts`**
```typescript
import { ToolDefinition } from "../types";

export const weatherTool: ToolDefinition = {
  tool: {
    name: "get_weather",
    description:
      "Get current weather for a specific city. Returns temperature (°C), weather condition, humidity, and feels-like temperature.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "City name, e.g., 'Bucharest' or 'London, UK'",
        },
      },
      required: ["location"],
    },
  },

  execute: async (input) => {
    const location = input.location as string;
    const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const c = data.current_condition[0];

      return JSON.stringify({
        location,
        temperature: `${c.temp_C}°C`,
        feels_like: `${c.FeelsLikeC}°C`,
        condition: c.weatherDesc[0].value,
        humidity: `${c.humidity}%`,
        wind: `${c.windspeedKmph} km/h`,
      });
    } catch (err) {
      return JSON.stringify({
        error: `Could not fetch weather for "${location}"`,
        details: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
};
```

**`src/tools/fetch-url.ts`**
```typescript
import { ToolDefinition } from "../types";

export const fetchUrlTool: ToolDefinition = {
  tool: {
    name: "fetch_url",
    description:
      "Fetch and extract text content from a public webpage URL. HTML is stripped, returning only readable text. Content is truncated to 4000 characters to manage token usage.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The full URL to fetch, e.g., 'https://example.com'",
        },
      },
      required: ["url"],
    },
  },

  execute: async (input) => {
    const url = input.url as string;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "claude-cli-agent/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);

      return text || "Page returned empty content.";
    } catch (err) {
      return JSON.stringify({
        error: `Failed to fetch "${url}"`,
        details: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
};
```

**`src/tools/calculator.ts`**
```typescript
import { ToolDefinition } from "../types";

export const calculatorTool: ToolDefinition = {
  tool: {
    name: "calculate",
    description:
      "Evaluate a mathematical expression and return the numeric result. Supports: +, -, *, /, ** (exponent), parentheses, sqrt(), sin(), cos(), log(), PI, E.",
    input_schema: {
      type: "object" as const,
      properties: {
        expression: {
          type: "string",
          description: "Math expression, e.g., '(15 * 7) + sqrt(144)'",
        },
      },
      required: ["expression"],
    },
  },

  execute: async (input) => {
    const expression = input.expression as string;

    try {
      const sanitized = expression
        .replace(/sqrt/g, "Math.sqrt")
        .replace(/sin/g, "Math.sin")
        .replace(/cos/g, "Math.cos")
        .replace(/log/g, "Math.log")
        .replace(/abs/g, "Math.abs")
        .replace(/round/g, "Math.round")
        .replace(/floor/g, "Math.floor")
        .replace(/ceil/g, "Math.ceil")
        .replace(/PI/g, "Math.PI")
        .replace(/\bE\b/g, "Math.E");

      const result = new Function(`"use strict"; return (${sanitized})`)();

      if (typeof result !== "number" || !isFinite(result)) {
        return JSON.stringify({ error: "Expression did not produce a finite number" });
      }

      return JSON.stringify({ expression, result });
    } catch (err) {
      return JSON.stringify({
        error: `Could not evaluate: "${expression}"`,
        details: err instanceof Error ? err.message : "Parse error",
      });
    }
  },
};
```

**`src/tools/index.ts`**
```typescript
import { ToolDefinition } from "../types";
import { weatherTool } from "./weather";
import { fetchUrlTool } from "./fetch-url";
import { calculatorTool } from "./calculator";

// Tool registry -- add new tools here
export const allTools: ToolDefinition[] = [
  weatherTool,
  fetchUrlTool,
  calculatorTool,
];

// Quick lookup by name
export const toolMap = new Map<string, ToolDefinition>(
  allTools.map((t) => [t.tool.name, t])
);

// Just the definitions (for the API call)
export const toolDefinitions = allTools.map((t) => t.tool);
```

### Step 4: Cost Tracker (15 min)

**`src/cost-tracker.ts`** -- Use the full implementation from Day 13. Export the class.

### Step 5: The Agent Loop (30 min)

**`src/agent-loop.ts`**
```typescript
import Anthropic from "@anthropic-ai/sdk";
import { getClient } from "./client";
import { toolDefinitions, toolMap } from "./tools";
import { CostTracker } from "./cost-tracker";
import { AgentConfig, DEFAULT_CONFIG } from "./types";

export async function runAgentLoop(
  messages: Anthropic.MessageParam[],
  tracker: CostTracker,
  config: AgentConfig = DEFAULT_CONFIG
): Promise<string> {
  const client = getClient();
  let iteration = 0;

  while (iteration < config.maxIterations) {
    iteration++;

    // Stream the response
    const stream = client.messages.stream({
      model: config.model,
      max_tokens: config.maxTokens,
      system: config.systemPrompt,
      tools: toolDefinitions,
      messages: messages,
    });

    // Show streaming text as it arrives
    let isFirstText = true;
    stream.on("text", (text) => {
      if (isFirstText) {
        process.stdout.write("\n  ");
        isFirstText = false;
      }
      process.stdout.write(text);
    });

    const response = await stream.finalMessage();

    // Track cost
    tracker.track(
      response.model,
      response.usage.input_tokens,
      response.usage.output_tokens,
      response.stop_reason === "tool_use"
        ? `tool call #${iteration}`
        : "final response"
    );

    // If Claude is done, return the text
    if (response.stop_reason === "end_turn") {
      if (!isFirstText) process.stdout.write("\n");
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock && textBlock.type === "text" ? textBlock.text : "";
    }

    // Process tool calls
    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolUseBlocks = response.content.filter(
        (b) => b.type === "tool_use"
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;

        const toolDef = toolMap.get(block.name);
        if (!toolDef) {
          console.log(`\n  [Unknown tool: ${block.name}]`);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({ error: `Unknown tool: ${block.name}` }),
            is_error: true,
          });
          continue;
        }

        console.log(`\n  [calling ${block.name}(${JSON.stringify(block.input)})]`);

        const result = await toolDef.execute(
          block.input as Record<string, unknown>
        );

        console.log(`  [result: ${result.slice(0, 80)}${result.length > 80 ? "..." : ""}]`);

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }

      messages.push({ role: "user", content: toolResults });
    }
  }

  console.log("\n  [Max iterations reached]");
  return "I've reached the maximum number of steps for this request.";
}
```

### Step 6: Entry Point (30 min)

**`src/index.ts`**
```typescript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";
import { runAgentLoop } from "./agent-loop";
import { CostTracker } from "./cost-tracker";
import { DEFAULT_CONFIG } from "./types";

const tracker = new CostTracker();
const messages: Anthropic.MessageParam[] = [];

function printHelp(): void {
  console.log(`
  Commands:
    /cost     Show cost tracking summary
    /history  Show detailed cost per API call
    /clear    Clear conversation history
    /model    Show current model
    /help     Show this help message
    /exit     Exit the program
  `);
}

async function handleInput(input: string): Promise<boolean> {
  const trimmed = input.trim();

  if (!trimmed) return true; // continue

  // Handle slash commands
  if (trimmed.startsWith("/")) {
    switch (trimmed.toLowerCase()) {
      case "/exit":
      case "/quit":
        tracker.printSummary();
        return false; // exit
      case "/cost":
        tracker.printSummary();
        return true;
      case "/history":
        tracker.printHistory();
        return true;
      case "/clear":
        messages.length = 0;
        console.log("  Conversation cleared.");
        return true;
      case "/model":
        console.log(`  Current model: ${DEFAULT_CONFIG.model}`);
        return true;
      case "/help":
        printHelp();
        return true;
      default:
        console.log(`  Unknown command: ${trimmed}. Type /help for options.`);
        return true;
    }
  }

  // Regular message -- run the agent loop
  messages.push({ role: "user", content: trimmed });

  try {
    const response = await runAgentLoop(messages, tracker);
    messages.push({ role: "assistant", content: response });

    // Show inline cost
    const lastEntry = tracker.getHistory().at(-1);
    if (lastEntry) {
      console.log(
        `  [${tracker.totalInputTokens + tracker.totalOutputTokens} total tokens | session: $${tracker.totalCost.toFixed(4)}]`
      );
    }
  } catch (error) {
    console.error(
      `\n  Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return true;
}

async function main(): Promise<void> {
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║     Claude CLI Agent v1.0                 ║");
  console.log("║     Streaming | Tools | Cost Tracking     ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log(`  Model: ${DEFAULT_CONFIG.model}`);
  console.log("  Type /help for commands, /exit to quit.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (): void => {
    rl.question("You > ", async (input) => {
      const shouldContinue = await handleInput(input);
      if (shouldContinue) {
        askQuestion();
      } else {
        rl.close();
        process.exit(0);
      }
    });
  };

  askQuestion();
}

main();
```

### Step 7: System Prompt Documentation (15 min)

**`prompts.md`** -- Document your system prompt so future-you (and reviewers) understand the design:

```markdown
# System Prompts

## Main Agent Prompt

**Purpose:** Guides Claude's behavior as a CLI assistant with tool access.

**Design decisions:**
- Instructs Claude to use tools only when external data is needed
- Emphasizes conciseness (saves output tokens = saves money)
- Asks Claude to explain reasoning when chaining tools (transparency)

**Current prompt:**
[paste the system prompt from types.ts]

**Iteration notes:**
- v1: Simple "you are a helpful assistant" -- too generic
- v2: Added tool guidance -- improved tool selection accuracy
- v3: Added conciseness instruction -- reduced output tokens ~30%
```

### Step 8: README (45 min)

This is as important as the code. Write a README that shows engineering maturity:

```markdown
# Claude CLI Agent

A conversational CLI agent built with the Anthropic SDK.
Streams responses, uses tools, tracks costs, and outputs structured data.

## Features

- **Streaming responses** — Text appears in real-time, not after a 5-second wait
- **Tool use** — Weather lookup, web fetching, and calculations
- **Agent loop** — Autonomous multi-step reasoning with tool chaining
- **Cost tracking** — Per-call and session-level cost visibility
- **Conversation memory** — Multi-turn context maintained across the session

## Quick Start

[instructions]

## Architecture

[describe the file structure and why each piece exists]

## Architecture Decisions

- **Why tool-per-file pattern?** Each tool is self-contained (definition +
  implementation). Adding a new tool = adding one file + registering it.
- **Why streaming in the agent loop?** Even tool-call iterations show
  Claude's "thinking" text, so the user never stares at a blank screen.
- **Why track costs per-call, not per-session?** Granular tracking reveals
  which operations are expensive (tool calls add up).

## What I Learned

[your honest reflection]

## Cost Analysis

[paste a real cost summary from a test session]
```

### Step 9: Git and GitHub (30 min)

```bash
cd claude-cli-agent
git init
git add .
git commit -m "feat: CLI agent with streaming, tools, cost tracking"

# Create GitHub repo (using gh CLI or web UI)
gh repo create claude-cli-agent --public --source=. --push
```

### Step 10: Week 2 Reflection (15 min)

Before you close the laptop, fill out this checklist honestly:

**Technical Skills:**
- [ ] I can stream Claude's responses and handle SSE events
- [ ] I can define tools and handle the tool_use/tool_result cycle
- [ ] I can build an agent loop that chains multiple tools autonomously
- [ ] I can force structured JSON output using tool_choice
- [ ] I can validate LLM output with Zod schemas
- [ ] I can track and report API costs per call and per session
- [ ] I can explain the cost difference between Opus, Sonnet, and Haiku

**Engineering Skills:**
- [ ] I shipped a complete project to GitHub with a quality README
- [ ] My project has clean separation of concerns (files < 100 lines each)
- [ ] I documented my system prompt and architecture decisions
- [ ] Someone could clone my repo and run it in under 2 minutes

**Mental Models:**
- [ ] AI agents are while loops with tool calls
- [ ] Claude doesn't execute tools -- I do
- [ ] tool_choice forces schema compliance at the API level
- [ ] Output tokens cost 5x more than input tokens
- [ ] Conversation costs grow linearly with message history length

---

## Key Insight

Shipping is a skill separate from building. The code you wrote this week would earn you an interview. The README, the clean architecture, the cost analysis, the documented decisions -- that's what earns you the job. AI Engineering is still engineering. The fundamentals matter: clean code, clear documentation, thoughtful architecture, and the discipline to actually ship.

---

## Build

This entire day IS the build. Your deliverable is a GitHub repository containing:

1. **Working CLI agent** that compiles and runs
2. **Streaming** -- visible in the terminal
3. **At least 2 tools** -- functional, calling real APIs
4. **Cost tracking** -- visible per-call and per-session via `/cost` command
5. **Conversation memory** -- multi-turn works correctly
6. **README** -- covers what/why/how/architecture/learnings
7. **System prompt** documented in `prompts.md`
8. **Clean code** -- TypeScript strict mode, no `any` types, meaningful names

---

## Resources

- **[GitHub CLI (gh)](https://cli.github.com/)** -- For creating repos from the command line.
- **[How to write a great README](https://www.makeareadme.com/)** -- Template and best practices.
- **[Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)** -- Reference for any SDK questions during integration.
- **[tsx](https://github.com/privatenumber/tsx)** -- Run TypeScript files directly without a build step during development.

---

## Done When

- [ ] The project is on GitHub (public repository)
- [ ] `npm install && npm run dev` works from a fresh clone (with API key set)
- [ ] The CLI streams responses visibly in the terminal
- [ ] At least 2 tools work (test: ask about weather, ask to calculate something)
- [ ] `/cost` shows a formatted cost summary with real numbers
- [ ] Multi-turn conversation works (Claude remembers context from previous messages)
- [ ] README exists and contains: description, setup instructions, architecture, learnings
- [ ] You've had at least one multi-step conversation where Claude chained 2+ tools
- [ ] You've completed the Week 2 reflection checklist honestly
- [ ] You feel proud of what you shipped

---

*Next week: [Week 3 -- Prompt Engineering Deep Dive](/week-03/week-intro.md) -- the art and science of getting Claude to do exactly what you need, every time.*
