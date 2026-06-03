---
title: "Evaluation & Deployment"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "fine-tuning"
moduleTitle: "Fine-Tuning"
moduleDescription: "Learn when and how to fine-tune LLMs for specialized tasks."
lessonId: "ai-engineer/fine-tuning/evaluation-deployment"
duration: "10 min"
order: 604
moduleOrder: 6
lessonOrder: 4
color: "purple"
---
# Evaluation & Deployment

After fine-tuning, you need to evaluate the model against your baseline and deploy it safely. This lesson covers evaluation strategies and deployment patterns.

## Baseline Comparison

Always compare your fine-tuned model against the base model with the original prompt:

```typescript
async function compareModels(
  evalDataset: EvalCase[],
  baselineModel: string,
  fineTunedModel: string,
): Promise<{ baseline: number; fineTuned: number }> {
  const baselineResults = await evaluateModel(evalDataset, baselineModel);
  const fineTunedResults = await evaluateModel(evalDataset, fineTunedModel);

  return {
    baseline: baselineResults.accuracy,
    fineTuned: fineTunedResults.accuracy,
  };
}

// Example output:
// Baseline (GPT-4o with few-shot): 87.5%
// Fine-tuned (GPT-4o-mini):        93.2%
```

## Evaluation Checklist

- [ ] Accuracy on held-out validation set
- [ ] Performance on edge cases
- [ ] Latency comparison (fine-tuned models with shorter prompts are faster)
- [ ] Cost comparison (per-request cost vs. training cost amortized)
- [ ] Safety evaluation (does the model refuse harmful requests?)
- [ ] Regression testing (does it still handle basic cases?)

## Gradual Rollout

```typescript
function selectModel(userId: string): string {
  // Route a percentage of traffic to the fine-tuned model
  const rolloutPercentage = 10; // Start with 10%
  const hash = simpleHash(userId) % 100;

  if (hash < rolloutPercentage) {
    return 'ft:gpt-4o-mini:org::support-bot-v1';
  }

  return 'gpt-4o'; // Baseline
}
```

## A/B Testing in Production

```typescript
interface ABTestResult {
  model: string;
  requestId: string;
  userRating?: number;     // Collected from user feedback
  automatedScore?: number; // From LLM-as-judge
  latencyMs: number;
  tokenCount: number;
}

// Log every request for analysis
async function handleRequest(query: string, userId: string): Promise<string> {
  const model = selectModel(userId);
  const start = performance.now();

  const response = await callModel(model, query);

  logABResult({
    model,
    requestId: crypto.randomUUID(),
    latencyMs: performance.now() - start,
    tokenCount: response.usage.total_tokens,
  });

  return response.text;
}
```

## When to Retrain

- New failure patterns emerge in production logs.
- The domain changes (new products, policies, etc.).
- You accumulate significantly more training data.
- A new base model is released that is better or cheaper.

Fine-tuning is not a one-time event. Plan for periodic retraining as your data and requirements evolve.
