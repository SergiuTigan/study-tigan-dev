# Day 52 — LLM-as-Judge

> *"You don't need a human to grade every answer. You need a strong model with clear criteria and a rubric."*

**Date:** Miercuri, 9 Iulie 2026
**Hours:** 2h · Evening build session
**Topic:** Automated evaluation using LLM-as-judge, scoring rubrics, calibration
**Phase:** Faza 2 — Patterns · Week 8

---

## What You're Doing

You have 30 test cases. Now you need a way to score thousands of outputs without manually reading each one. Enter LLM-as-judge — using a strong language model to evaluate the outputs of another model.

The idea is simple: give a judge model the question, the generated answer, the expected answer, and clear scoring criteria. Ask it to score on a 1-5 scale with reasoning. The reasoning is critical — it forces the judge to justify its score, which makes the scoring more reliable and gives you insight into *why* something scored low.

This pattern is used by every serious AI lab. Anthropic uses it to evaluate Claude. OpenAI uses it for GPT. It's not perfect — judges have biases, and they can be fooled — but it's the best scalable alternative to human evaluation.

The key principle: **the judge model should be STRONGER than the evaluated model.** If you're evaluating Haiku, judge with Sonnet. If you're evaluating Sonnet, judge with Opus. Judging with a weaker model produces unreliable scores.

## The Work

### Step 1: The Judge Function

Build the core judging function:

```typescript
// eval/judge.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

interface JudgeInput {
  question: string;
  generatedAnswer: string;
  expectedAnswer: string;
  evaluationCriteria: string[];
}

interface JudgeResult {
  scores: {
    correctness: number;    // 1-5
    completeness: number;   // 1-5
    faithfulness: number;   // 1-5
    conciseness: number;    // 1-5
  };
  overallScore: number;     // 1-5 (weighted average)
  reasoning: string;
  flaggedIssues: string[];
}

async function judgeWithLLM(input: JudgeInput): Promise<JudgeResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514', // Judge should be strong
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are an expert evaluator. Score the following AI-generated answer
on multiple criteria.

## Question
${input.question}

## Expected Answer
${input.expectedAnswer}

## Generated Answer
${input.generatedAnswer}

## Evaluation Criteria
${input.evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Scoring Rubric

For each criterion below, score 1-5:

**Correctness** (Is the information accurate?)
- 5: All facts are correct
- 4: Minor inaccuracies that don't affect understanding
- 3: Some factual errors but core message is right
- 2: Significant factual errors
- 1: Mostly incorrect

**Completeness** (Does it cover all required points?)
- 5: Covers all evaluation criteria and more
- 4: Covers all main points, misses minor details
- 3: Covers most points but has gaps
- 2: Missing major points
- 1: Barely addresses the question

**Faithfulness** (Is it grounded in facts, not hallucinated?)
- 5: Every claim is verifiable or properly hedged
- 4: Mostly grounded, minor speculation clearly marked
- 3: Some unsupported claims
- 2: Significant hallucination
- 1: Mostly fabricated

**Conciseness** (Is it appropriately sized?)
- 5: Perfect length — thorough but not verbose
- 4: Slightly long or short but still good
- 3: Noticeably verbose or too brief
- 2: Much too long or too short
- 1: Completely inappropriate length

Respond in JSON format:
{
  "scores": {
    "correctness": N,
    "completeness": N,
    "faithfulness": N,
    "conciseness": N
  },
  "overallScore": N,
  "reasoning": "2-3 sentences explaining the scores",
  "flaggedIssues": ["any specific problems found"]
}`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Judge did not return valid JSON');
  }

  return JSON.parse(jsonMatch[0]) as JudgeResult;
}
```

### Step 2: The Eval Runner

Connect the dataset, the system under test, and the judge:

```typescript
// eval/runner.ts
import * as fs from 'fs/promises';
import { judgeWithLLM } from './judge';

interface EvalRun {
  runId: string;
  timestamp: string;
  model: string;
  prompt: string;
  results: EvalItemResult[];
  summary: EvalSummary;
}

interface EvalItemResult {
  itemId: string;
  question: string;
  category: string;
  generatedAnswer: string;
  judgeResult: JudgeResult;
  latency: number;
  tokenUsage: { input: number; output: number };
}

interface EvalSummary {
  totalItems: number;
  avgCorrectness: number;
  avgCompleteness: number;
  avgFaithfulness: number;
  avgConciseness: number;
  avgOverall: number;
  avgLatency: number;
  totalCost: number;
  scoreDistribution: Record<number, number>;
  categoryBreakdown: Record<string, { avgScore: number; count: number }>;
}

async function runEvaluation(
  systemFn: (question: string) => Promise<{ answer: string; latency: number; tokens: { input: number; output: number } }>,
  datasetPath: string,
  label: string
): Promise<EvalRun> {
  const dataset = JSON.parse(await fs.readFile(datasetPath, 'utf-8')) as EvalDataset;
  const results: EvalItemResult[] = [];

  console.log(`\nRunning eval: ${label}`);
  console.log(`Dataset: ${dataset.items.length} items\n`);

  for (let i = 0; i < dataset.items.length; i++) {
    const item = dataset.items[i];
    console.log(`[${i + 1}/${dataset.items.length}] ${item.category}: ${item.question.substring(0, 60)}...`);

    // Generate answer
    const { answer, latency, tokens } = await systemFn(item.question);

    // Judge the answer
    const judgeResult = await judgeWithLLM({
      question: item.question,
      generatedAnswer: answer,
      expectedAnswer: item.expectedAnswer,
      evaluationCriteria: item.evaluationCriteria,
    });

    console.log(`  Score: ${judgeResult.overallScore}/5 (${latency}ms)`);

    if (judgeResult.flaggedIssues.length > 0) {
      console.log(`  Issues: ${judgeResult.flaggedIssues.join(', ')}`);
    }

    results.push({
      itemId: item.id,
      question: item.question,
      category: item.category,
      generatedAnswer: answer,
      judgeResult,
      latency,
      tokenUsage: tokens,
    });

    // Small delay to avoid rate limiting the judge
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const summary = computeSummary(results);
  const run: EvalRun = {
    runId: crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    model: label,
    prompt: 'default',
    results,
    summary,
  };

  // Save results
  const outputPath = `eval/runs/${run.runId}.json`;
  await fs.mkdir('eval/runs', { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(run, null, 2));
  console.log(`\nResults saved to ${outputPath}`);

  return run;
}
```

### Step 3: Summary Statistics

```typescript
function computeSummary(results: EvalItemResult[]): EvalSummary {
  const scores = results.map(r => r.judgeResult);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  // Score distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  scores.forEach(s => {
    const rounded = Math.round(s.overallScore);
    distribution[rounded] = (distribution[rounded] || 0) + 1;
  });

  // Category breakdown
  const categories: Record<string, { scores: number[]; count: number }> = {};
  results.forEach(r => {
    if (!categories[r.category]) {
      categories[r.category] = { scores: [], count: 0 };
    }
    categories[r.category].scores.push(r.judgeResult.overallScore);
    categories[r.category].count++;
  });

  const categoryBreakdown = Object.fromEntries(
    Object.entries(categories).map(([cat, data]) => [
      cat,
      { avgScore: avg(data.scores), count: data.count },
    ])
  );

  return {
    totalItems: results.length,
    avgCorrectness: avg(scores.map(s => s.scores.correctness)),
    avgCompleteness: avg(scores.map(s => s.scores.completeness)),
    avgFaithfulness: avg(scores.map(s => s.scores.faithfulness)),
    avgConciseness: avg(scores.map(s => s.scores.conciseness)),
    avgOverall: avg(scores.map(s => s.overallScore)),
    avgLatency: avg(results.map(r => r.latency)),
    totalCost: estimateCost(results),
    scoreDistribution: distribution,
    categoryBreakdown,
  };
}

function estimateCost(results: EvalItemResult[]): number {
  // Approximate cost based on token usage
  const totalTokens = results.reduce(
    (sum, r) => sum + r.tokenUsage.input + r.tokenUsage.output,
    0
  );
  return totalTokens * 0.000003; // Rough Sonnet pricing
}
```

### Step 4: Pretty Print Results

```typescript
function printSummary(summary: EvalSummary): void {
  console.log('\n' + '='.repeat(60));
  console.log('EVALUATION SUMMARY');
  console.log('='.repeat(60));

  console.log(`\nOverall: ${summary.avgOverall.toFixed(2)}/5`);
  console.log(`  Correctness:  ${summary.avgCorrectness.toFixed(2)}/5`);
  console.log(`  Completeness: ${summary.avgCompleteness.toFixed(2)}/5`);
  console.log(`  Faithfulness: ${summary.avgFaithfulness.toFixed(2)}/5`);
  console.log(`  Conciseness:  ${summary.avgConciseness.toFixed(2)}/5`);

  console.log(`\nScore Distribution:`);
  const maxBar = 20;
  const maxCount = Math.max(...Object.values(summary.scoreDistribution));
  for (let score = 5; score >= 1; score--) {
    const count = summary.scoreDistribution[score] || 0;
    const bar = '#'.repeat(Math.round((count / maxCount) * maxBar));
    console.log(`  ${score}: ${bar.padEnd(maxBar)} (${count})`);
  }

  console.log(`\nBy Category:`);
  for (const [cat, data] of Object.entries(summary.categoryBreakdown)) {
    console.log(`  ${cat}: ${data.avgScore.toFixed(2)}/5 (${data.count} items)`);
  }

  console.log(`\nPerformance:`);
  console.log(`  Avg Latency: ${summary.avgLatency.toFixed(0)}ms`);
  console.log(`  Est. Cost: $${summary.totalCost.toFixed(4)}`);
}
```

### Step 5: Calibration — The Critical Step

Before trusting your judge, calibrate it. Manually score 5 items and compare:

```typescript
async function calibrate(datasetPath: string): Promise<void> {
  const dataset = JSON.parse(await fs.readFile(datasetPath, 'utf-8')) as EvalDataset;

  // Pick 5 diverse items
  const sampleItems = dataset.items.filter((_, i) => i % 6 === 0).slice(0, 5);

  console.log('CALIBRATION: Score these answers yourself, then compare with the LLM judge.\n');

  for (const item of sampleItems) {
    // Generate a sample answer (use your system)
    const answer = await generateAnswer(item.question);

    console.log(`Q: ${item.question}`);
    console.log(`A: ${answer.substring(0, 300)}...`);
    console.log(`Expected: ${item.expectedAnswer.substring(0, 200)}...`);

    // Get LLM judge score
    const judgeResult = await judgeWithLLM({
      question: item.question,
      generatedAnswer: answer,
      expectedAnswer: item.expectedAnswer,
      evaluationCriteria: item.evaluationCriteria,
    });

    console.log(`\nLLM Judge Score: ${judgeResult.overallScore}/5`);
    console.log(`Reasoning: ${judgeResult.reasoning}`);
    console.log(`\nYOUR score (1-5)? ___`);
    console.log(`Agreement? ___\n`);
    console.log('-'.repeat(50));
  }

  console.log('\nIf LLM scores consistently differ from yours by >1 point,');
  console.log('adjust the rubric in the judge prompt.');
}
```

Run calibration. If the judge scores within 1 point of your manual scores on 4/5 items, the judge is calibrated. If not, adjust the rubric.

### Step 6: Run Your First Eval

```typescript
// eval/firstRun.ts
async function main() {
  const systemFn = async (question: string) => {
    const start = Date.now();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: question }],
    });

    return {
      answer: response.content[0].type === 'text' ? response.content[0].text : '',
      latency: Date.now() - start,
      tokens: { input: response.usage.input_tokens, output: response.usage.output_tokens },
    };
  };

  const run = await runEvaluation(systemFn, 'eval/dataset.json', 'sonnet-baseline');
  printSummary(run.summary);
}

main().catch(console.error);
```

## Key Insight

LLM-as-judge has a known bias: judges tend to prefer longer, more detailed answers — even when conciseness would be better. This is called "verbosity bias." Counter it by explicitly including conciseness as a scoring criterion and by calibrating against human scores. Another bias: judges are lenient toward outputs that match their own style. Using a different model family for judging (e.g., GPT-4 to judge Claude) can reduce this, but adds complexity. For now, calibration against your own manual scores is the pragmatic solution.

## Resources

- [Anthropic — LLM-based Grading](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests#llm-based-grading)
- [Judging LLM-as-a-Judge — Paper](https://arxiv.org/abs/2306.05685)
- [Hamel Husain — LLM-as-Judge Eval](https://hamel.dev/blog/posts/llm-judge/)

## Done When

- [ ] `judgeWithLLM` function scores answers on 4 criteria (correctness, completeness, faithfulness, conciseness)
- [ ] The judge returns structured JSON with scores, reasoning, and flagged issues
- [ ] The eval runner processes all 30 items and saves results
- [ ] Summary statistics include per-category breakdown and score distribution
- [ ] You've calibrated by manually scoring 5 items and comparing with the judge
- [ ] Judge agrees with your manual scores within 1 point on at least 4/5 items
- [ ] You've completed one full eval run and have a baseline score

---

*Tomorrow: Multi-model comparison. Same eval, different models. You'll see exactly how Opus, Sonnet, and Haiku compare on quality, cost, and speed.*
