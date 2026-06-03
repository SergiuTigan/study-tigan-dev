---
title: "Tokens & Pricing"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "foundations"
moduleTitle: "Foundations"
moduleDescription: "Understand the AI engineering landscape, LLM fundamentals, pricing models, and development tooling."
lessonId: "ai-engineer/foundations/tokens-pricing"
duration: "8 min"
order: 103
moduleOrder: 1
lessonOrder: 3
color: "purple"
---
# Tokens & Pricing

Understanding tokenization and pricing is essential for estimating costs, optimizing performance, and designing cost-effective AI systems.

## What Are Tokens?

Tokens are the fundamental units that LLMs process. A token is roughly 3/4 of a word in English. Tokenization varies by model, but the principle is the same:

```
"Hello, world!"
→ ["Hello", ",", " world", "!"]
→ 4 tokens

"TypeScript is great"
→ ["Type", "Script", " is", " great"]
→ 4 tokens

// Code is typically more token-dense
"const x = () => {}"
→ ["const", " x", " =", " ()", " =>", " {}"]
→ 6 tokens
```

## Pricing Model

LLM APIs charge per token, typically per 1 million tokens:

```
Model                | Input (per 1M) | Output (per 1M)
─────────────────────|────────────────|────────────────
GPT-4o               | $2.50          | $10.00
GPT-4o-mini          | $0.15          | $0.60
Claude Opus 4        | $15.00         | $75.00
Claude Sonnet 4      | $3.00          | $15.00
Claude Haiku         | $0.25          | $1.25
Gemini 2.5 Flash     | $0.15          | $0.60
```

*Prices are approximate and change frequently.*

## Cost Estimation

```typescript
function estimateCost(
  inputTokens: number,
  outputTokens: number,
  inputPricePerMillion: number,
  outputPricePerMillion: number
): number {
  return (
    (inputTokens / 1_000_000) * inputPricePerMillion +
    (outputTokens / 1_000_000) * outputPricePerMillion
  );
}

// Example: 1000 requests, each with 500 input + 200 output tokens
const totalCost = estimateCost(
  500 * 1000,   // 500K input tokens
  200 * 1000,   // 200K output tokens
  3.00,         // Sonnet input price
  15.00         // Sonnet output price
);
// ~$4.50 for 1000 requests
```

## Optimization Strategies

- **Prompt caching:** Cache repeated system prompts to reduce input tokens.
- **Model selection:** Use smaller models for simple tasks, larger for complex.
- **Output length:** Set `max_tokens` to avoid unnecessarily long responses.
- **Batching:** Group requests when real-time response is not needed.
- **Token budgets:** Set per-user or per-feature token limits.
