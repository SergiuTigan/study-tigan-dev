# Day 53 — Multi-Model Comparison

> *"Opus is not always the answer. Sometimes Haiku at 1/60th the cost gives you 90% of the quality. But you'll never know unless you measure."*

**Date:** Joi, 10 Iulie 2026
**Hours:** 2h · Evening build session
**Topic:** Running the same eval across multiple models, cost-quality trade-offs
**Phase:** Faza 2 — Patterns · Week 8

---

## What You're Doing

Yesterday you built an eval framework and ran it on Sonnet. You got a score. But a score in isolation means nothing. Is 4.1/5 good? Bad? You need *comparisons*.

Today you run the exact same evaluation on every Claude model — Opus, Sonnet, and Haiku — and optionally GPT-4 if you have an OpenAI key. Same 30 questions. Same judge. Same criteria. Different models.

The results will surprise you. The gap between Opus and Sonnet is smaller than you think for most tasks. The gap between Sonnet and Haiku is larger than you think for complex tasks but almost nonexistent for simple ones. And when you factor in cost and latency, the "best" model depends entirely on what you're optimizing for.

This is the data you need to make real engineering decisions instead of defaulting to the most expensive model.

## The Work

### Step 1: Multi-Model Runner

Extend your eval runner to sweep across models:

```typescript
// eval/multiModel.ts
import Anthropic from '@anthropic-ai/sdk';
import { runEvaluation, printSummary } from './runner';

const anthropic = new Anthropic();

interface ModelConfig {
  id: string;
  label: string;
  inputCostPer1M: number;   // USD per 1M input tokens
  outputCostPer1M: number;  // USD per 1M output tokens
}

const MODELS: ModelConfig[] = [
  {
    id: 'claude-opus-4-20250514',
    label: 'Opus',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
  },
  {
    id: 'claude-sonnet-4-20250514',
    label: 'Sonnet',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
  },
  {
    id: 'claude-haiku-4-20250514',
    label: 'Haiku',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
  },
];

function createSystemFn(modelId: string) {
  return async (question: string) => {
    const start = Date.now();
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 1024,
      messages: [{ role: 'user', content: question }],
    });

    return {
      answer: response.content[0].type === 'text' ? response.content[0].text : '',
      latency: Date.now() - start,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  };
}

async function runMultiModelEval(datasetPath: string): Promise<void> {
  const runs = [];

  for (const model of MODELS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`MODEL: ${model.label} (${model.id})`);
    console.log('='.repeat(60));

    const run = await runEvaluation(
      createSystemFn(model.id),
      datasetPath,
      model.label
    );

    runs.push({ model, run });
  }

  // Print comparison table
  printComparisonTable(runs);
}
```

### Step 2: The Comparison Table

This is the output that drives decisions:

```typescript
interface ModelRun {
  model: ModelConfig;
  run: EvalRun;
}

function printComparisonTable(runs: ModelRun[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('MULTI-MODEL COMPARISON');
  console.log('='.repeat(80));

  // Header
  const header = 'Metric'.padEnd(22) +
    runs.map(r => r.model.label.padStart(12)).join('');
  console.log(`\n${header}`);
  console.log('-'.repeat(22 + runs.length * 12));

  // Score rows
  const metrics = [
    { name: 'Overall Score', key: 'avgOverall' },
    { name: 'Correctness', key: 'avgCorrectness' },
    { name: 'Completeness', key: 'avgCompleteness' },
    { name: 'Faithfulness', key: 'avgFaithfulness' },
    { name: 'Conciseness', key: 'avgConciseness' },
  ];

  for (const metric of metrics) {
    const row = metric.name.padEnd(22) +
      runs.map(r => {
        const val = r.run.summary[metric.key as keyof EvalSummary] as number;
        return `${val.toFixed(2)}/5`.padStart(12);
      }).join('');
    console.log(row);
  }

  console.log('-'.repeat(22 + runs.length * 12));

  // Performance rows
  const latencyRow = 'Avg Latency'.padEnd(22) +
    runs.map(r => `${r.run.summary.avgLatency.toFixed(0)}ms`.padStart(12)).join('');
  console.log(latencyRow);

  // Cost calculation
  const costRow = 'Est. Cost (30 items)'.padEnd(22) +
    runs.map(r => {
      const totalInput = r.run.results.reduce((s, res) => s + res.tokenUsage.input, 0);
      const totalOutput = r.run.results.reduce((s, res) => s + res.tokenUsage.output, 0);
      const cost = (totalInput / 1_000_000) * r.model.inputCostPer1M +
                   (totalOutput / 1_000_000) * r.model.outputCostPer1M;
      return `$${cost.toFixed(4)}`.padStart(12);
    }).join('');
  console.log(costRow);

  // Cost-normalized score
  const costNormRow = 'Score per $0.01'.padEnd(22) +
    runs.map(r => {
      const totalInput = r.run.results.reduce((s, res) => s + res.tokenUsage.input, 0);
      const totalOutput = r.run.results.reduce((s, res) => s + res.tokenUsage.output, 0);
      const cost = (totalInput / 1_000_000) * r.model.inputCostPer1M +
                   (totalOutput / 1_000_000) * r.model.outputCostPer1M;
      const normalized = cost > 0 ? r.run.summary.avgOverall / (cost * 100) : 0;
      return normalized.toFixed(2).padStart(12);
    }).join('');
  console.log(costNormRow);

  console.log('\n');

  // Category breakdown per model
  console.log('CATEGORY BREAKDOWN');
  console.log('-'.repeat(22 + runs.length * 12));

  const allCategories = [...new Set(
    runs.flatMap(r => Object.keys(r.run.summary.categoryBreakdown))
  )];

  for (const cat of allCategories) {
    const row = cat.padEnd(22) +
      runs.map(r => {
        const data = r.run.summary.categoryBreakdown[cat];
        return data ? `${data.avgScore.toFixed(2)}/5`.padStart(12) : 'N/A'.padStart(12);
      }).join('');
    console.log(row);
  }

  // Score distributions
  console.log('\nSCORE DISTRIBUTIONS');
  console.log('-'.repeat(22 + runs.length * 12));
  for (let score = 5; score >= 1; score--) {
    const row = `Score ${score}`.padEnd(22) +
      runs.map(r => {
        const count = r.run.summary.scoreDistribution[score] || 0;
        const pct = ((count / r.run.summary.totalItems) * 100).toFixed(0);
        return `${count} (${pct}%)`.padStart(12);
      }).join('');
    console.log(row);
  }
}
```

### Step 3: Run the Comparison

```typescript
async function main() {
  await runMultiModelEval('eval/dataset.json');
}

main().catch(console.error);
```

Expected output (illustrative):

```
MULTI-MODEL COMPARISON
================================================================================

Metric                       Opus      Sonnet       Haiku
--------------------------------------------------------------
Overall Score              4.52/5    4.31/5      3.74/5
Correctness                4.63/5    4.47/5      3.93/5
Completeness               4.57/5    4.33/5      3.53/5
Faithfulness               4.70/5    4.50/5      4.13/5
Conciseness                4.17/5    3.93/5      3.37/5
--------------------------------------------------------------
Avg Latency                4200ms    1800ms       620ms
Est. Cost (30 items)      $0.2340   $0.0468    $0.0039
Score per $0.01              0.19      0.92       9.59

CATEGORY BREAKDOWN
--------------------------------------------------------------
factual                    4.70/5    4.60/5      4.20/5
synthesis                  4.63/5    4.25/5      3.50/5
unanswerable               4.40/5    4.20/5      3.40/5
edge_case                  4.25/5    3.75/5      3.00/5
format                     4.33/5    4.33/5      4.00/5
```

### Step 4: Analysis — The Decision Framework

Build a decision framework from your data:

```typescript
function generateRecommendation(runs: ModelRun[]): void {
  console.log('\n=== RECOMMENDATION ===\n');

  // Sort by different criteria
  const byQuality = [...runs].sort(
    (a, b) => b.run.summary.avgOverall - a.run.summary.avgOverall
  );
  const bySpeed = [...runs].sort(
    (a, b) => a.run.summary.avgLatency - b.run.summary.avgLatency
  );
  const byEfficiency = [...runs].sort((a, b) => {
    const costA = a.run.summary.totalCost;
    const costB = b.run.summary.totalCost;
    const effA = a.run.summary.avgOverall / (costA || 0.001);
    const effB = b.run.summary.avgOverall / (costB || 0.001);
    return effB - effA;
  });

  console.log(`Best Quality:     ${byQuality[0].model.label} (${byQuality[0].run.summary.avgOverall.toFixed(2)}/5)`);
  console.log(`Best Speed:       ${bySpeed[0].model.label} (${bySpeed[0].run.summary.avgLatency.toFixed(0)}ms avg)`);
  console.log(`Best Efficiency:  ${byEfficiency[0].model.label} (best score-per-dollar)`);

  console.log('\nDecision Guide:');
  console.log('  - Need highest quality? Use Opus (but 5x the cost of Sonnet)');
  console.log('  - Need good quality at reasonable cost? Use Sonnet');
  console.log('  - Need speed and low cost? Use Haiku (but quality drops for complex tasks)');
  console.log('  - Hybrid approach: Haiku for factual/format, Sonnet for synthesis/edge cases');
}
```

### Step 5: The Hybrid Model Strategy

The most cost-effective approach often uses multiple models:

```typescript
// Route questions to the cheapest model that's "good enough"
function selectModel(category: string, difficulty: string): string {
  // Based on eval data:
  // - Haiku scores 4.0+ on factual and format → use Haiku
  // - Sonnet needed for synthesis and edge cases → use Sonnet
  // - Opus only needed for the hardest edge cases → rarely use

  if (category === 'factual' && difficulty !== 'hard') {
    return 'claude-haiku-4-20250514'; // Cheap, fast, good enough
  }

  if (category === 'format') {
    return 'claude-haiku-4-20250514'; // Format following is not model-dependent
  }

  if (category === 'synthesis' || category === 'edge_case') {
    return 'claude-sonnet-4-20250514'; // Needs reasoning ability
  }

  if (difficulty === 'hard') {
    return 'claude-sonnet-4-20250514'; // Play it safe on hard questions
  }

  return 'claude-haiku-4-20250514'; // Default to cheap
}
```

This routing strategy, informed by eval data, can cut costs by 60-80% while maintaining 95% of the quality of using Sonnet for everything.

## Key Insight

The "score per dollar" metric is the most actionable number in this comparison. Haiku often scores 3.7/5 at 1/60th the cost of Opus's 4.5/5. For many production use cases, that's a better deal. The question isn't "which model is best?" — it's "which model is best for THIS task at THIS budget?" Multi-model eval gives you the data to answer that question precisely, and it often points to a hybrid strategy where you route easy queries to cheap models and hard queries to expensive ones.

## Resources

- [Anthropic Models — Pricing and Capabilities](https://docs.anthropic.com/en/docs/about-claude/models)
- [Model Selection Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
- [The Cost of AI — Token Economics](https://docs.anthropic.com/en/docs/about-claude/models#model-comparison-table)

## Done When

- [ ] You've run the same eval on at least 3 models (Opus, Sonnet, Haiku)
- [ ] The comparison table shows scores, latency, and cost side by side
- [ ] You've computed "score per dollar" for each model
- [ ] You can see where Haiku is "good enough" and where Sonnet is needed
- [ ] You have a written model selection strategy based on your eval data
- [ ] You can explain to a stakeholder why you chose Sonnet over Opus for a specific task
- [ ] Category breakdown reveals which task types are model-sensitive

---

*Day 54 is REST. Day 55: A/B testing prompts. You'll create multiple prompt variants and use your eval framework to find the winner.*
