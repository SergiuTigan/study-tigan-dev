# Day 1 --- Setup & First API Call

> *"The best way to understand a new technology is to make it say hello."*

**Date:** Luni, 19 Mai 2026
**Hours:** 2h · 20:00--22:00
**Topic:** Environment setup, Anthropic SDK, first programmatic conversation with Claude
**Phase:** Faza 1 --- Foundations · Week 1

---

## What You Are Doing

Today is the equivalent of `ng new` for your AI engineering career. You are going to scaffold a TypeScript project, install the Anthropic SDK, and make your very first programmatic API call to Claude. Not through a chat interface --- through *code*.

This matters because every AI-powered feature you will ever build starts here: a structured request to a model, and a structured response back. You already know how to call REST APIs from eight years of Angular work. The Anthropic Messages API is conceptually similar --- it is a POST request with a specific payload shape --- but the *mental model* around it is different. You are not fetching data from a database. You are sending a specification to a reasoning engine, and the quality of your specification determines the quality of the output. Today you learn the shape of that specification.

## The Work

### Step 1: Create Your Anthropic Account (15 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up and navigate to **API Keys**
3. Create a new key --- name it something like `ai-roadmap-dev`
4. Copy it immediately. You will not see it again.

> **Angular parallel:** Think of this like setting up a Firebase project. The API key is your service account credential. Treat it exactly the same way --- never commit it, always load from environment.

### Step 2: Scaffold the TypeScript Project (20 min)

```bash
mkdir claude-lab && cd claude-lab
npm init -y
npm install @anthropic-ai/sdk dotenv
npm install -D typescript tsx @types/node
npx tsc --init
```

Create your `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Create `.gitignore` immediately:

```
node_modules/
.env
dist/
```

Update `tsconfig.json` --- keep it simple:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

Add a run script to `package.json`:

```json
{
  "scripts": {
    "dev": "tsx src/main.ts"
  }
}
```

### Step 3: Write Your First API Call (30 min)

Create `src/main.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic();
// The SDK automatically reads ANTHROPIC_API_KEY from env

async function main() {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: "Hello, Claude. I'm a Senior Angular developer starting my AI engineering journey. What's the single most important concept I should understand first?",
      },
    ],
  });

  console.log("=== FULL RESPONSE OBJECT ===");
  console.log(JSON.stringify(message, null, 2));

  console.log("\n=== JUST THE TEXT ===");
  if (message.content[0].type === "text") {
    console.log(message.content[0].text);
  }

  console.log("\n=== METADATA ===");
  console.log(`Model: ${message.model}`);
  console.log(`Stop reason: ${message.stop_reason}`);
  console.log(`Input tokens: ${message.usage.input_tokens}`);
  console.log(`Output tokens: ${message.usage.output_tokens}`);
}

main().catch(console.error);
```

Run it:

```bash
npm run dev
```

### Step 4: Dissect the Response Object (30 min)

Do not skip this. Print the full response and study every field. Here is what you will see:

```typescript
{
  id: "msg_...",            // Unique message ID (useful for logging/debugging)
  type: "message",          // Always "message" for this endpoint
  role: "assistant",        // Claude's response role
  content: [                // Array! Not a string. This matters.
    {
      type: "text",         // Could also be "tool_use" later (Week 3)
      text: "..."           // The actual response text
    }
  ],
  model: "claude-sonnet-4-20250514",
  stop_reason: "end_turn",  // Why did Claude stop? "end_turn" | "max_tokens" | "stop_sequence"
  usage: {
    input_tokens: 35,       // What you sent (you pay for this)
    output_tokens: 247      // What Claude generated (you pay more for this)
  }
}
```

**Critical things to internalize:**

- **`content` is an array**, not a string. This is because Claude can return multiple content blocks (text + tool calls). You will use this heavily in Week 3.
- **`stop_reason`** tells you *why* Claude stopped. If it says `"max_tokens"`, your response got cut off --- you need to increase `max_tokens`.
- **Token counts** are your cost meter. At current pricing, input tokens are cheaper than output tokens. This becomes a real engineering concern at scale.
- **`messages` is an array** in your request --- this is the conversation history. Claude is stateless. Every call sends the full conversation.

### Step 5: Experiment (25 min)

Modify your script to try these variations:

```typescript
// Variation 1: Add a system prompt
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: "You are a helpful assistant who explains things using Angular analogies.",
  messages: [
    { role: "user", content: "What are tokens in LLM context?" },
  ],
});

// Variation 2: Multi-turn conversation
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "What is prompt engineering?" },
    { role: "assistant", content: "Prompt engineering is the practice of designing inputs to language models to get desired outputs." },
    { role: "user", content: "Give me a concrete example relevant to a TypeScript developer." },
  ],
});

// Variation 3: Intentionally hit max_tokens
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 10, // Very low!
  messages: [
    { role: "user", content: "Explain the Angular change detection cycle in detail." },
  ],
});
// Check stop_reason — it will be "max_tokens" instead of "end_turn"
```

## Key Concepts

**The API is stateless.** This is the single most important thing to understand today. Unlike a chat interface where Claude "remembers" the conversation, the API gets a fresh `messages` array every time. There is no session. If you want Claude to remember something, you include it in the messages array. This is exactly like an HTTP API --- no server-side session state.

**You are the orchestrator.** In Angular terms, *you* are the framework now. Angular manages component lifecycle, change detection, and rendering. In AI engineering, *your code* manages conversation history, prompt construction, response parsing, and error handling. The model is just the rendering engine.

**Tokens are not words.** A token is roughly 3/4 of a word in English, but this varies. Code tends to use more tokens per line than prose. The `usage` field tells you exact counts. Get in the habit of checking it.

## Build / Practice

By the end of tonight, your `claude-lab/src/` folder should contain:

1. `main.ts` --- your working API call with full response logging
2. At least 3 variations you tried (system prompt, multi-turn, max_tokens limit)
3. A mental map of the response object you could whiteboard from memory

**Stretch goal:** Create a `src/chat.ts` that reads user input from stdin and maintains a conversation array, sending the full history on each call. You know how to do this --- it is just a while loop with `readline` and an array that grows.

## Resources

- [Anthropic Initial Setup Guide](https://docs.anthropic.com/en/docs/initial-setup) --- official setup walkthrough
- [Messages API Reference](https://docs.anthropic.com/en/api/messages) --- the complete API spec, bookmark this
- [Anthropic SDK on npm](https://www.npmjs.com/package/@anthropic-ai/sdk) --- TypeScript SDK documentation
- [Anthropic API Pricing](https://www.anthropic.com/pricing) --- understand cost per token for each model

## Done When

- [ ] You can run `npm run dev` and get a response from Claude
- [ ] You can explain what every field in the response object means
- [ ] You understand why `content` is an array and not a string
- [ ] You know what `stop_reason: "max_tokens"` means and how to fix it
- [ ] You can articulate why the API is stateless and what that implies for conversation management
- [ ] Your `.env` is in `.gitignore` and you have not committed your API key

---

*Tomorrow: You will learn that a prompt is not a question --- it is a specification. Day 2 covers prompt structure, system prompts vs user messages, and why "write me a blog post" is the prompt equivalent of `any` in TypeScript.*
