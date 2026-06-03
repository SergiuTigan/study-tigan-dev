---
title: "Dataset Preparation"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "fine-tuning"
moduleTitle: "Fine-Tuning"
moduleDescription: "Learn when and how to fine-tune LLMs for specialized tasks."
lessonId: "ai-engineer/fine-tuning/dataset-preparation"
duration: "12 min"
order: 602
moduleOrder: 6
lessonOrder: 2
color: "purple"
---
# Dataset Preparation

The quality of your fine-tuning dataset determines the quality of your fine-tuned model. This lesson covers how to prepare, clean, and format training data.

## Dataset Format

Most fine-tuning APIs expect JSONL (JSON Lines) format with conversation-style examples:

```jsonl
{"messages": [{"role": "system", "content": "You are a support assistant."}, {"role": "user", "content": "How do I reset my password?"}, {"role": "assistant", "content": "To reset your password, go to Settings > Security > Reset Password."}]}
{"messages": [{"role": "system", "content": "You are a support assistant."}, {"role": "user", "content": "My order hasn't arrived."}, {"role": "assistant", "content": "I'll look into your order status. Can you provide your order number?"}]}
```

## Creating Training Data

```typescript
interface TrainingExample {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
}

function createTrainingData(
  examples: { input: string; output: string }[],
  systemPrompt: string,
): TrainingExample[] {
  return examples.map(ex => ({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: ex.input },
      { role: 'assistant', content: ex.output },
    ],
  }));
}
```

## Data Quality Guidelines

1. **Diversity:** Cover the full range of inputs your model will see in production.
2. **Accuracy:** Every example must have a correct output. One bad example can teach bad behavior.
3. **Consistency:** Use the same format and style across all examples.
4. **Edge cases:** Include examples for unusual or tricky inputs.
5. **Balance:** Ensure all categories/classes are represented proportionally.

## Data Cleaning

```typescript
function cleanExample(example: TrainingExample): TrainingExample | null {
  for (const msg of example.messages) {
    // Remove examples with empty content
    if (!msg.content.trim()) return null;

    // Normalize whitespace
    msg.content = msg.content.replace(/\\s+/g, ' ').trim();

    // Check for minimum length
    if (msg.role === 'assistant' && msg.content.length < 10) return null;
  }

  return example;
}
```

## Dataset Size Recommendations

```
Task Complexity     | Minimum Examples | Recommended
────────────────────|──────────────────|──────────────
Simple (classify)   | 50               | 200-500
Medium (extract)    | 100              | 500-1000
Complex (generate)  | 200              | 1000-5000
```

## Train/Validation Split

Always hold out a validation set:

```typescript
function splitDataset<T>(data: T[], trainRatio = 0.8): { train: T[]; val: T[] } {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const splitIdx = Math.floor(shuffled.length * trainRatio);
  return {
    train: shuffled.slice(0, splitIdx),
    val: shuffled.slice(splitIdx),
  };
}
```
