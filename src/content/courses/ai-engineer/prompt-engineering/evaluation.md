---
title: "Evaluation & Testing"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "prompt-engineering"
moduleTitle: "Prompt Engineering"
moduleDescription: "Master the art and science of crafting effective prompts for large language models."
lessonId: "ai-engineer/prompt-engineering/evaluation"
duration: "12 min"
order: 205
moduleOrder: 2
lessonOrder: 5
color: "purple"
---
# Evaluation & Testing

Prompt engineering without evaluation is guesswork. Systematic evaluation ensures your prompts work reliably across diverse inputs and edge cases.

## Building an Evaluation Dataset

```typescript
interface EvalCase {
  input: string;
  expectedOutput: string;
  tags: string[];
}

const evalDataset: EvalCase[] = [
  {
    input: 'The product is amazing, best purchase ever!',
    expectedOutput: 'POSITIVE',
    tags: ['strong-positive'],
  },
  {
    input: 'It works fine I guess',
    expectedOutput: 'NEUTRAL',
    tags: ['ambiguous'],
  },
  {
    input: 'Terrible quality, fell apart immediately',
    expectedOutput: 'NEGATIVE',
    tags: ['strong-negative'],
  },
  // ... 50-100+ cases for a robust eval
];
```

## Running Evaluations

```typescript
async function runEval(
  dataset: EvalCase[],
  classify: (input: string) => Promise<string>
): Promise<{ accuracy: number; failures: EvalCase[] }> {
  let correct = 0;
  const failures: EvalCase[] = [];

  for (const testCase of dataset) {
    const result = await classify(testCase.input);
    if (result.trim() === testCase.expectedOutput) {
      correct++;
    } else {
      failures.push(testCase);
    }
  }

  return {
    accuracy: correct / dataset.length,
    failures,
  };
}
```

## Metrics

Different tasks require different metrics:

- **Classification:** Accuracy, precision, recall, F1 score
- **Generation:** BLEU, ROUGE, human evaluation
- **Extraction:** Exact match, partial match, field-level accuracy
- **Summarization:** Faithfulness, relevance, conciseness

## A/B Testing Prompts

```typescript
const results = {
  v1: await runEval(dataset, classifyV1),
  v2: await runEval(dataset, classifyV2),
};

console.log(`V1 accuracy: ${(results.v1.accuracy * 100).toFixed(1)}%`);
console.log(`V2 accuracy: ${(results.v2.accuracy * 100).toFixed(1)}%`);
```

## LLM-as-Judge

Use a stronger model to evaluate a weaker model's outputs:

```typescript
const judgePrompt = `Rate the quality of this AI-generated summary on a scale of 1-5.

Original text: ${originalText}
Summary: ${generatedSummary}

Score (1-5):`;
```

## Best Practices

- Build your eval dataset before optimizing prompts.
- Include edge cases, adversarial inputs, and common failure modes.
- Track metrics over time as you modify prompts.
- Automate evaluations in CI/CD for regression detection.
- Combine automated metrics with periodic human evaluation.
