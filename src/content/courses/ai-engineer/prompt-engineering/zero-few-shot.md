---
title: "Zero-Shot & Few-Shot"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "prompt-engineering"
moduleTitle: "Prompt Engineering"
moduleDescription: "Master the art and science of crafting effective prompts for large language models."
lessonId: "ai-engineer/prompt-engineering/zero-few-shot"
duration: "10 min"
order: 201
moduleOrder: 2
lessonOrder: 1
color: "purple"
---
# Zero-Shot & Few-Shot

Zero-shot and few-shot prompting are the two fundamental techniques for getting LLMs to perform tasks. Understanding when to use each is the first skill of prompt engineering.

## Zero-Shot Prompting

Give the model a task description without any examples:

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 256,
  messages: [{
    role: 'user',
    content: 'Classify the sentiment of this review as POSITIVE, NEGATIVE, or NEUTRAL:\\n\\n"The battery life is incredible but the screen is too dim."',
  }],
});
// Output: "NEUTRAL"
```

Zero-shot works well when:
- The task is straightforward and well-defined
- The model has strong prior knowledge about the task
- You want the simplest possible prompt

## Few-Shot Prompting

Provide examples of input-output pairs before the actual task:

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 256,
  messages: [{
    role: 'user',
    content: `Classify the sentiment of product reviews.

Review: "Absolutely love this product! Works perfectly."
Sentiment: POSITIVE

Review: "Broke after two days. Complete waste of money."
Sentiment: NEGATIVE

Review: "It's okay. Does what it says but nothing special."
Sentiment: NEUTRAL

Review: "The battery life is incredible but the screen is too dim."
Sentiment:`,
  }],
});
// Output: " NEUTRAL"
```

## When to Use Few-Shot

Few-shot prompting is superior when:
- The task requires a specific output format
- The model needs to learn a pattern that is not obvious from the instruction alone
- You need consistent, structured outputs
- The task is domain-specific

## Guidelines for Examples

- Use 3-5 examples for most tasks (more is not always better)
- Cover edge cases in your examples
- Ensure examples are representative of real inputs
- Keep examples consistent in format and style
- Order examples from simple to complex

## Cost Considerations

Few-shot examples add to the input token count. For high-volume applications, consider fine-tuning instead of large few-shot prompts. A fine-tuned model effectively "learns" the examples, eliminating the per-request token cost.
