# Day 8 — Streaming Responses

> *"Users don't mind waiting for a good answer. They mind staring at a blank screen while waiting."*

**Date:** Luni, 26 Mai 2025
**Hours:** 2h · Seara (20:00--22:00)
**Topic:** Streaming API responses with the Anthropic SDK
**Phase:** Faza 1 — Foundations · Week 2

---

## What You're Doing

Open ChatGPT or Claude.ai right now. Type something. Notice how the text appears word by word, almost like someone is typing back to you. That's streaming. And it's not a cosmetic trick -- it's an engineering decision that transforms the user experience from "is this broken?" to "this feels alive."

Without streaming, a typical Claude response takes 3-8 seconds of pure silence before the full answer appears at once. With streaming, the first token appears in ~200ms. Same total wait time. Radically different *perceived* latency. This is the same principle you've leveraged in Angular with progressive loading, skeleton screens, and optimistic updates -- show something immediately, fill in the rest as it arrives.

Today you'll implement streaming from scratch using the Anthropic SDK. You'll understand the event protocol, handle partial responses, and build a CLI that streams Claude's response character by character to the terminal. It's deeply satisfying to watch.

---

## The Work

### Why Streaming Matters (Beyond UX)

Streaming isn't just about perceived speed. It enables three critical capabilities:

1. **Early abort**: User can cancel mid-response, saving tokens and money
2. **Progressive processing**: You can start parsing/displaying content before it's complete
3. **Timeout management**: You can detect stalls and handle them gracefully

Think of it like Angular's `HttpClient` returning an Observable vs. a Promise. The Observable gives you control over the stream. You can `takeUntil`, you can `tap` intermediate values, you can `retry`. A Promise just gives you "wait... wait... here's everything."

### The Streaming Protocol

When you enable streaming, the Anthropic API sends **Server-Sent Events (SSE)** -- the same protocol behind `EventSource` in the browser. Each event has a type:

```
event: message_start
data: {"type":"message_start","message":{"id":"msg_...","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4-20250514","stop_reason":null,"usage":{"input_tokens":25,"output_tokens":0}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" there"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"!"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":12}}

event: message_stop
data: {"type":"message_stop"}
```

The event flow is always:

```
message_start
  └→ content_block_start (one per content block)
       └→ content_block_delta (many -- the actual text chunks)
       └→ content_block_stop
  └→ message_delta (final usage stats, stop_reason)
  └→ message_stop
```

### Implementation with the SDK

The Anthropic TypeScript SDK wraps this into a clean async iterator. Here's the full implementation:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function streamResponse(userMessage: string): Promise<string> {
  // .stream() returns a Stream object -- not a raw response
  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: userMessage }],
  });

  let fullText = "";

  // The SDK gives you typed events
  stream.on("text", (text) => {
    process.stdout.write(text); // Write without newline -- streams character by character
    fullText += text;
  });

  // Wait for the stream to complete
  const finalMessage = await stream.finalMessage();

  console.log("\n"); // Clean newline after stream ends
  console.log("---");
  console.log(`Input tokens: ${finalMessage.usage.input_tokens}`);
  console.log(`Output tokens: ${finalMessage.usage.output_tokens}`);
  console.log(`Stop reason: ${finalMessage.stop_reason}`);

  return fullText;
}

// Run it
streamResponse("Explain why streaming matters in 3 sentences.");
```

**Key method: `client.messages.stream()`** -- not `client.messages.create()`. Same parameters, different return type.

### The Three Ways to Consume Streams

The SDK gives you three patterns. Pick based on your use case:

**Pattern 1: Event listeners (shown above)**
```typescript
const stream = client.messages.stream({ ... });

stream.on("text", (text) => {
  // Each text chunk
});

stream.on("message", (message) => {
  // The complete final message
});

stream.on("error", (error) => {
  // Handle stream errors
});

const finalMessage = await stream.finalMessage();
```

**Pattern 2: Async iterator (most flexible)**
```typescript
const stream = client.messages.stream({ ... });

for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    process.stdout.write(event.delta.text);
  }
  if (event.type === "message_delta") {
    console.log(`\nStop reason: ${event.delta.stop_reason}`);
  }
}
```

**Pattern 3: Simple text accumulation**
```typescript
const stream = client.messages.stream({ ... });

// If you just want the text and don't need events:
stream.on("text", (text) => process.stdout.write(text));
const final = await stream.finalMessage();
const fullText = final.content[0].type === "text" ? final.content[0].text : "";
```

### Handling Abort / Cancellation

One of streaming's biggest advantages -- you can stop early:

```typescript
const controller = new AbortController();

const stream = client.messages.stream({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  messages: [{ role: "user", content: "Write a very long essay about space." }],
}, {
  signal: controller.signal,
});

// Abort after 2 seconds (or on user Ctrl+C)
setTimeout(() => {
  console.log("\n[Aborting stream...]");
  controller.abort();
}, 2000);

try {
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
    }
  }
} catch (err) {
  if (err instanceof Error && err.name === "AbortError") {
    console.log("\nStream aborted by user.");
  } else {
    throw err;
  }
}
```

This is critical for production: you're billed for tokens *generated*, even if the user walks away. Abort saves money.

### Streaming + System Prompt

Works exactly as you'd expect:

```typescript
const stream = client.messages.stream({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: "You are a laconic Unix veteran. Answer in as few words as possible.",
  messages: [{ role: "user", content: "How do I find large files?" }],
});
```

---

## Key Insight

Streaming is not a feature. It's a **delivery mechanism**. The response content is identical whether you stream or not. What changes is *when* you receive each piece. This is exactly like the difference between downloading a file and streaming a video -- same data, different timing, radically different experience.

In Angular terms: `client.messages.create()` is a Promise. `client.messages.stream()` is an Observable. You already know which one gives you more control.

---

## Build

### Streaming CLI Chat

Build a command-line chat tool that:

1. Takes user input via `readline`
2. Streams Claude's response to the terminal in real time
3. Shows token usage after each response
4. Supports multi-turn conversation (keeps message history)
5. Handles Ctrl+C gracefully (aborts current stream, doesn't exit the app)

Here's your starter scaffold:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

interface Message {
  role: "user" | "assistant";
  content: string;
}

const conversationHistory: Message[] = [];

async function chat(userInput: string): Promise<void> {
  conversationHistory.push({ role: "user", content: userInput });

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: "You are a helpful assistant. Be concise but thorough.",
    messages: conversationHistory,
  });

  let assistantResponse = "";

  process.stdout.write("\n🤖 ");

  stream.on("text", (text) => {
    process.stdout.write(text);
    assistantResponse += text;
  });

  const finalMessage = await stream.finalMessage();

  conversationHistory.push({ role: "assistant", content: assistantResponse });

  console.log(`\n\n  [${finalMessage.usage.input_tokens} in / ${finalMessage.usage.output_tokens} out]`);
}

async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Streaming Chat CLI (type 'exit' to quit)\n");

  const askQuestion = (): void => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();
      if (trimmed.toLowerCase() === "exit") {
        console.log("Goodbye!");
        rl.close();
        return;
      }
      if (!trimmed) {
        askQuestion();
        return;
      }

      await chat(trimmed);
      askQuestion();
    });
  };

  askQuestion();
}

main();
```

**Stretch goal**: Add a `/time` command that measures and displays the time-to-first-token vs. total response time.

---

## Resources

- **[Anthropic Streaming Documentation](https://docs.anthropic.com/en/api/streaming)** -- The official reference. Read the SSE event types section carefully.
- **[Anthropic TypeScript SDK - Streaming](https://github.com/anthropics/anthropic-sdk-typescript#streaming)** -- SDK-specific streaming patterns and helpers.
- **[Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)** -- If you want to understand the underlying protocol.

---

## Done When

- [ ] You can stream a Claude response to the terminal in real time (text appears progressively)
- [ ] You understand the SSE event flow: `message_start` -> `content_block_start` -> `content_block_delta` (many) -> `content_block_stop` -> `message_delta` -> `message_stop`
- [ ] Your CLI maintains conversation history across multiple turns
- [ ] You can display input/output token counts after each streamed response
- [ ] You've tried aborting a stream mid-response and seen it stop
- [ ] You can explain the difference between `client.messages.create()` and `client.messages.stream()`

---

*Tomorrow: [Day 9 -- Tool Use (Basic)](/day-09.md) -- giving Claude the ability to interact with the outside world. This is where things get seriously interesting.*
