---
title: "When to Fine-Tune"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "fine-tuning"
moduleTitle: "Fine-Tuning"
moduleDescription: "Learn when and how to fine-tune LLMs for specialized tasks."
lessonId: "ai-engineer/fine-tuning/when-to-fine-tune"
duration: "10 min"
order: 601
moduleOrder: 6
lessonOrder: 1
color: "purple"
---
# When to Fine-Tune

Fine-tuning trains a model on your specific data to improve performance on your tasks. It is a powerful technique, but it is not always the right choice.

## Fine-Tuning vs Alternatives

```
Approach         | Cost      | Effort   | Best When
─────────────────|───────────|──────────|──────────────────────────
Prompt engineering| Low      | Low      | Task is straightforward
Few-shot prompting| Low     | Low      | Need specific output format
RAG              | Medium    | Medium   | Need access to private data
Fine-tuning      | High      | High     | Need specialized behavior
```

## Fine-Tune When

- **Consistent style/tone:** You need the model to always write in a specific voice (e.g., your brand's tone).
- **Domain expertise:** The model needs to understand specialized terminology (medical, legal, financial).
- **Cost optimization:** You are spending heavily on few-shot prompts that could be "baked in."
- **Latency optimization:** Shorter prompts (no few-shot examples) mean faster responses.
- **Complex formatting:** The model needs to consistently produce a specific output structure.

## Do NOT Fine-Tune When

- **Fresh knowledge needed:** Fine-tuning does not update the model's knowledge reliably. Use RAG instead.
- **Small dataset:** You need at least 50-100 high-quality examples; 500+ is better.
- **Rapidly changing requirements:** Fine-tuning is slow to iterate. Prompts can change instantly.
- **General tasks:** If prompt engineering achieves 95%+ accuracy, fine-tuning may not be worth the effort.

## The Decision Framework

```typescript
function shouldFineTune(scenario: {
  promptAccuracy: number;
  requestVolume: number;
  requiresConsistentStyle: boolean;
  datasetSize: number;
}): boolean {
  if (scenario.promptAccuracy > 0.95) return false;   // Prompting is good enough
  if (scenario.datasetSize < 50) return false;         // Not enough data
  if (scenario.requestVolume < 1000) return false;     // Not worth the effort

  return scenario.requiresConsistentStyle || scenario.promptAccuracy < 0.85;
}
```

## Cost Comparison

A fine-tuned smaller model can be cheaper per request than a larger model with few-shot prompting:

```
Approach                    | Input tokens | Cost per 1K requests
────────────────────────────|──────────────|────────────────────
GPT-4o with 10-shot prompt  | 2000 tokens  | $5.00
Fine-tuned GPT-4o-mini      | 200 tokens   | $0.03
```

The training cost is a one-time expense; the per-request savings compound with volume.
