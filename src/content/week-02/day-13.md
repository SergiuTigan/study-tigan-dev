# Day 13 — Token Economics

> *"The fastest way to make an AI project unprofitable is to ignore token costs until production."*

**Date:** Sambata, 31 Mai 2025
**Hours:** 3h · Dimineata/Dupa-amiaza (10:00--13:00)
**Topic:** Understanding and tracking API costs
**Phase:** Faza 1 — Foundations · Week 2

---

## What You're Doing

You've been building tools all week -- streaming, tool use, structured outputs. But there's been a meter running quietly in the background that you've mostly ignored: the token counter. Today you learn to read that meter, predict costs, and build a system to track them.

This is the session that separates hobbyists from engineers. Anyone can build a cool demo with Claude. Shipping something people use daily requires understanding economics. How much does each conversation cost? How do you stay within budget? When should you use Opus vs. Haiku? What architectural decisions save 10x on costs?

As a senior Angular developer, you've dealt with infrastructure costs -- server sizing, CDN bandwidth, database queries. AI costs are more granular and more directly controllable. Every prompt you write, every model you choose, every token you save translates directly to money. Today you build the mental model and the code to manage this.

---

## The Work

### The Pricing Table (May 2025)

Here's what Anthropic charges per **1 million tokens**:

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Speed | Best For |
|-------|----------------------|------------------------|-------|----------|
| **Claude Opus 4** | $15.00 | $75.00 | Slower | Complex reasoning, coding, analysis |
| **Claude Sonnet 4** | $3.00 | $15.00 | Fast | Best balance of quality and cost |
| **Claude Haiku 3.5** | $0.80 | $4.00 | Fastest | Simple tasks, classification, extraction |

**With Prompt Caching** (repeated prompts get cheaper):

| Model | Cached Input (per 1M) | Cache Write (per 1M) |
|-------|----------------------|---------------------|
| Opus 4 | $1.50 (90% off) | $18.75 |
| Sonnet 4 | $0.30 (90% off) | $3.75 |
| Haiku 3.5 | $0.08 (90% off) | $1.00 |

**With Batch API** (async, non-real-time): **50% off** all prices.

### Token Math: What Things Actually Cost

Let's make this concrete:

**1 million tokens** is approximately **750,000 words** or about **1,500 pages** of text. But you're not sending books -- you're sending messages.

A typical conversational exchange:
- User message: ~50-200 tokens (a few sentences)
- System prompt: ~200-500 tokens
- Claude's response: ~200-800 tokens

**Cost per message with Sonnet** (typical):
```
Input:  300 tokens × ($3.00 / 1,000,000) = $0.0009
Output: 500 tokens × ($15.00 / 1,000,000) = $0.0075
Total per exchange: ~$0.0084 (less than 1 cent)
```

**But conversations grow.** Each turn includes ALL previous messages as context:
```
Turn 1:  300 input tokens → $0.009
Turn 5:  2,000 input tokens → $0.006
Turn 10: 5,000 input tokens → $0.015
Turn 20: 12,000 input tokens → $0.036
```

Input costs grow linearly with conversation length. This is the hidden cost of "conversation memory."

**Real-world estimates:**
- Casual chat (10 turns): ~$0.10 with Sonnet
- Complex coding session (50 turns): ~$1-5 with Sonnet
- Heavy agent use (many tool calls): ~$0.50-2.00 per task with Sonnet
- Same tasks with Haiku: roughly 4x cheaper
- Same tasks with Opus: roughly 5x more expensive

### Building a CostTracker Class

Here's the production-grade cost tracker you'll use in tomorrow's project:

```typescript
interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

interface CostEntry {
  timestamp: Date;
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  label?: string; // Optional label for the call (e.g., "weather tool", "final response")
}

const PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-20250514": { inputPer1M: 15.0, outputPer1M: 75.0 },
  "claude-sonnet-4-20250514": { inputPer1M: 3.0, outputPer1M: 15.0 },
  "claude-haiku-3-5-20241022": { inputPer1M: 0.8, outputPer1M: 4.0 },
};

class CostTracker {
  private history: CostEntry[] = [];

  /**
   * Track a single API call's cost.
   * Call this after every messages.create() or stream.finalMessage()
   */
  track(
    model: string,
    inputTokens: number,
    outputTokens: number,
    label?: string
  ): CostEntry {
    const pricing = PRICING[model];
    if (!pricing) {
      console.warn(`Unknown model: ${model}. Using Sonnet pricing as default.`);
    }
    const prices = pricing || PRICING["claude-sonnet-4-20250514"];

    const inputCost = (inputTokens / 1_000_000) * prices.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * prices.outputPer1M;

    const entry: CostEntry = {
      timestamp: new Date(),
      model,
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      label,
    };

    this.history.push(entry);
    return entry;
  }

  /** Total cost across all tracked calls */
  get totalCost(): number {
    return this.history.reduce((sum, e) => sum + e.totalCost, 0);
  }

  /** Total input tokens */
  get totalInputTokens(): number {
    return this.history.reduce((sum, e) => sum + e.inputTokens, 0);
  }

  /** Total output tokens */
  get totalOutputTokens(): number {
    return this.history.reduce((sum, e) => sum + e.outputTokens, 0);
  }

  /** Number of API calls tracked */
  get callCount(): number {
    return this.history.length;
  }

  /** Average cost per call */
  get avgCostPerCall(): number {
    return this.callCount > 0 ? this.totalCost / this.callCount : 0;
  }

  /** Get full history */
  getHistory(): CostEntry[] {
    return [...this.history];
  }

  /** Pretty-print a summary */
  printSummary(): void {
    console.log("\n╔══════════════════════════════════════╗");
    console.log("║        COST TRACKING SUMMARY         ║");
    console.log("╠══════════════════════════════════════╣");
    console.log(`║  API Calls:      ${String(this.callCount).padStart(15)}  ║`);
    console.log(`║  Input Tokens:   ${String(this.totalInputTokens).padStart(15)}  ║`);
    console.log(`║  Output Tokens:  ${String(this.totalOutputTokens).padStart(15)}  ║`);
    console.log(`║  Total Tokens:   ${String(this.totalInputTokens + this.totalOutputTokens).padStart(15)}  ║`);
    console.log("╠══════════════════════════════════════╣");
    console.log(`║  Input Cost:     $${this.history.reduce((s, e) => s + e.inputCost, 0).toFixed(6).padStart(13)}  ║`);
    console.log(`║  Output Cost:    $${this.history.reduce((s, e) => s + e.outputCost, 0).toFixed(6).padStart(13)}  ║`);
    console.log(`║  TOTAL COST:     $${this.totalCost.toFixed(6).padStart(13)}  ║`);
    console.log(`║  Avg per call:   $${this.avgCostPerCall.toFixed(6).padStart(13)}  ║`);
    console.log("╚══════════════════════════════════════╝");
  }

  /** Per-call breakdown */
  printHistory(): void {
    console.log("\nCall History:");
    console.log("─".repeat(80));
    this.history.forEach((entry, i) => {
      const label = entry.label ? ` (${entry.label})` : "";
      console.log(
        `  #${i + 1}${label}: ${entry.inputTokens}in + ${entry.outputTokens}out = $${entry.totalCost.toFixed(6)} [${entry.model.split("-").slice(0, 2).join("-")}]`
      );
    });
    console.log("─".repeat(80));
  }
}

export { CostTracker, CostEntry };
```

### Integrating CostTracker with the Agent Loop

Here's how to wire it into your existing code:

```typescript
const tracker = new CostTracker();

async function agentLoop(userMessage: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  let iteration = 0;

  while (iteration < 10) {
    iteration++;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: tools,
      messages: messages,
    });

    // Track EVERY API call
    tracker.track(
      response.model,
      response.usage.input_tokens,
      response.usage.output_tokens,
      response.stop_reason === "tool_use"
        ? `tool call (iteration ${iteration})`
        : `final response (iteration ${iteration})`
    );

    if (response.stop_reason === "end_turn") {
      const text = response.content.find((b) => b.type === "text");
      return text && text.type === "text" ? text.text : "";
    }

    // ... tool execution as before ...
  }

  return "Max iterations reached.";
}

// After conversation ends:
tracker.printSummary();
tracker.printHistory();
```

### Cost Optimization Strategies

**Strategy 1: Model Cascade**
Use the cheapest model that works:

```typescript
// Start with Haiku for classification/routing
const triage = await client.messages.create({
  model: "claude-haiku-3-5-20241022",  // $0.80/M input
  max_tokens: 50,
  messages: [{ role: "user", content: `Classify this task as SIMPLE or COMPLEX: "${userInput}"` }],
});

// Then use the appropriate model
const model = triage.includes("COMPLEX")
  ? "claude-sonnet-4-20250514"   // $3/M for hard tasks
  : "claude-haiku-3-5-20241022"; // $0.80/M for easy ones
```

This can cut costs 50-70% for applications with a mix of simple and complex queries.

**Strategy 2: Prompt Caching**
If your system prompt is long (>1024 tokens), cache it:

```typescript
const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: longSystemPrompt, // Your large system prompt
      cache_control: { type: "ephemeral" },
    },
  ],
  messages: messages,
});

// First call: pays cache_write price ($3.75/M for Sonnet)
// Subsequent calls (within 5 min): pays cache_read price ($0.30/M -- 90% off!)
```

**Strategy 3: Token Budgeting**
Set `max_tokens` thoughtfully, not just to 4096:

```typescript
// For a quick classification:
{ max_tokens: 50 }  // Don't pay for tokens you won't use

// For a code review:
{ max_tokens: 2000 }  // Generous but bounded

// For creative writing:
{ max_tokens: 4096 }  // Let it run
```

`max_tokens` doesn't cost you anything directly -- you only pay for tokens *generated*. But it prevents runaway responses that eat your budget.

**Strategy 4: Batches API**
For non-real-time workloads (processing datasets, batch analysis), use the Batches API for 50% off:

```typescript
// Create a batch of requests (not covered in detail today)
// Key idea: if it doesn't need to be real-time, batch it for half price
// Batch results delivered within 24 hours
```

### Quick-Reference Cost Calculator

Here's a utility function to estimate costs before making calls:

```typescript
function estimateCost(
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): string {
  const pricing = PRICING[model];
  if (!pricing) return "Unknown model";

  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.outputPer1M;
  const total = inputCost + outputCost;

  return `Estimated cost: $${total.toFixed(4)} (${estimatedInputTokens} in + ${estimatedOutputTokens} out)`;
}

// Before a big call:
console.log(estimateCost("claude-sonnet-4-20250514", 5000, 2000));
// "Estimated cost: $0.0450 (5000 in + 2000 out)"
```

---

## Key Insight

Output tokens cost 5x more than input tokens (across all Claude models). This has profound implications:

- A long system prompt (500 tokens) costs almost nothing
- A verbose response (2000 tokens) is the expensive part
- Asking Claude to "be concise" literally saves money
- Structured outputs (JSON) are cheaper than prose because they're more token-efficient

The biggest cost lever you have isn't model selection -- it's **output length control**. Every token Claude generates costs 5x what it costs to send. Design your prompts and tools to elicit concise responses.

---

## Build

### CostTracker Integration

1. **Implement the `CostTracker` class** from above in its own file (`cost-tracker.ts`)
2. **Integrate it into your agent loop** from Day 10 -- track every API call
3. **Run a 5-turn conversation** with tool use and print the full cost summary at the end
4. **Run the same conversation** with `claude-haiku-3-5-20241022` instead of Sonnet. Compare costs.
5. **Add a `/cost` command** to your CLI that prints the cost summary at any point during conversation

Test scenario -- run this exact conversation and record the costs:
```
You: "What's the weather in Bucharest and Paris?"
You: "Which city is warmer? By how many degrees?"
You: "Convert that difference to Fahrenheit."
You: "Summarize our conversation in one sentence."
You: "/cost"
```

Record the total cost for Sonnet vs. Haiku. You'll reference this in tomorrow's README.

**Stretch goal**: Add a budget limit. If total cost exceeds a threshold (e.g., $0.50), warn the user. If it exceeds $1.00, refuse to make more API calls.

---

## Resources

- **[Anthropic Pricing](https://www.anthropic.com/pricing)** -- Current model pricing. Bookmark this -- it updates with new model releases.
- **[Token Counting](https://docs.anthropic.com/en/docs/build-with-claude/token-counting)** -- How to count tokens before sending requests.
- **[Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)** -- How to cache system prompts for 90% cost reduction on repeated calls.
- **[Batches API](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing)** -- 50% off for async batch processing.
- **[Usage Dashboard](https://console.anthropic.com/)** -- Monitor your actual spending in the Anthropic Console.

---

## Done When

- [ ] You can recite from memory: Sonnet is $3/$15, Haiku is $0.80/$4 per million tokens
- [ ] You understand that output tokens cost 5x more than input tokens
- [ ] Your `CostTracker` class tracks input tokens, output tokens, and cost per API call
- [ ] You can print a cost summary after a multi-turn conversation with tool use
- [ ] You've compared costs between Sonnet and Haiku for the same conversation
- [ ] You can explain at least 3 cost optimization strategies (model cascade, caching, token budgeting)
- [ ] You understand why conversation costs grow with each turn (full history re-sent each time)

---

*Tomorrow: [Day 14 -- CLI Project #1: Ship It](/day-14.md) -- combine everything from this week into a portfolio-worthy project and push it to GitHub.*
