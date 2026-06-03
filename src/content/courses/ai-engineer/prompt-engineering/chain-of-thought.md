---
title: "Chain of Thought"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "prompt-engineering"
moduleTitle: "Prompt Engineering"
moduleDescription: "Master the art and science of crafting effective prompts for large language models."
lessonId: "ai-engineer/prompt-engineering/chain-of-thought"
duration: "10 min"
order: 202
moduleOrder: 2
lessonOrder: 2
color: "purple"
---
# Chain of Thought

Chain of Thought (CoT) prompting instructs the model to show its reasoning step by step before giving a final answer. This technique dramatically improves performance on tasks that require multi-step reasoning.

## Basic Chain of Thought

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: `A store has 15 apples. 3 customers each buy 2 apples.
Then a delivery of 10 apples arrives.
How many apples does the store have now?

Think step by step before giving your answer.`,
  }],
});
```

The model responds with:
1. Starting apples: 15
2. Customers buy: 3 x 2 = 6 apples
3. After sales: 15 - 6 = 9 apples
4. After delivery: 9 + 10 = 19 apples
5. **Answer: 19 apples**

## Why CoT Works

LLMs generate tokens sequentially. When they write out reasoning steps, each step becomes context for the next step. This "working memory" effect allows the model to solve problems that it would get wrong if forced to answer immediately.

## Structured CoT

For more complex tasks, provide a reasoning framework:

```typescript
const systemPrompt = `You are a code review assistant. For each code snippet:

1. IDENTIFY: What does this code do?
2. ISSUES: List any bugs, security issues, or performance problems.
3. REASONING: Explain why each issue is a problem.
4. FIX: Provide corrected code.

Always complete all four steps before giving your final assessment.`;
```

## When to Use CoT

CoT is most effective for:
- **Math and logic:** Word problems, calculations, logical deductions
- **Code analysis:** Bug finding, optimization, architecture decisions
- **Decision making:** Comparing options, weighing trade-offs
- **Complex classification:** Tasks with multiple criteria

## When NOT to Use CoT

CoT adds output tokens (and cost). Skip it for:
- Simple lookups and translations
- Tasks where the model is already highly accurate
- High-volume, low-complexity operations
- When you need minimal latency

## CoT and Reasoning Models

Models like OpenAI's o3 and o4-mini perform chain-of-thought reasoning internally. You do not need to prompt for CoT with these models -- they do it automatically.
