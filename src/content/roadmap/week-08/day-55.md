---
title: "Day 55 — A/B Test Prompts"
week: 8
day: 55
phase: 2
phaseLabel: "Deep Dive"
order: 855
type: "day"
---
# Day 55 — A/B Test Prompts

> *"Prompt engineering without evaluation is just prompt guessing. With evals, every change is a hypothesis you can test."*

**Date:** Sambata, 12 Iulie 2026
**Hours:** 3h · Deep build session
**Topic:** Systematic prompt optimization through A/B testing, eval-driven development
**Phase:** Faza 2 — Patterns · Week 8

---

## What You're Doing

You've built the eval infrastructure. You've compared models. Now you use it for its highest-value purpose: **optimizing prompts with data instead of intuition.**

The prompt engineering loop that most people use is: "Try a prompt. Read a few outputs. Think 'that looks better.' Ship it." This is vibing, not engineering.

The eval-driven approach is: "Write a hypothesis. Create a prompt variant. Run the eval. Compare the numbers. Ship the variant that scores highest." This is the scientific method applied to AI engineering.

Today you'll create 3+ prompt variants, run your full eval suite on each, and pick the winner based on data. You'll also experiment with non-prompt variables — temperature, number of chunks, system prompt length — that affect output quality.

## The Work

### Step 1: Define Your Variants

Create distinct prompt strategies to compare:

```typescript
// eval/variants.ts
interface PromptVariant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

const variants: PromptVariant[] = [
  {
    id: 'baseline',
    name: 'Baseline',
    description: 'No system prompt, just the question',
    systemPrompt: '',
    temperature: 1.0,
  },

  {
    id: 'structured',
    name: 'Structured Expert',
    description: 'System prompt with role, format requirements, and constraints',
    systemPrompt: `You are a senior software engineer with 15 years of experience.
When answering technical questions:

1. Start with a clear, direct answer to the question
2. Provide technical depth with concrete examples
3. Mention trade-offs and when your answer might not apply
4. Keep your response focused and concise (200-400 words)
5. If you're not sure about something, say so explicitly

Never make up facts. If a question is unanswerable or speculative, say so.`,
    temperature: 1.0,
  },

  {
    id: 'cot',
    name: 'Chain-of-Thought',
    description: 'Explicit thinking before answering',
    systemPrompt: `You are a technical expert. For every question:

First, think through the problem step by step in a <thinking> section.
Consider: What exactly is being asked? What are the key concepts?
What nuances or edge cases should I address?

Then, provide your answer in an <answer> section.
Be thorough but concise. Include examples when helpful.
Cite specific technologies, patterns, or principles.

If the question is speculative or unanswerable, explain why
in your thinking and provide a balanced perspective.`,
    temperature: 1.0,
  },

  {
    id: 'few-shot',
    name: 'Few-Shot Examples',
    description: 'System prompt includes example Q&A pairs',
    systemPrompt: `You are a technical expert. Answer questions thoroughly
and concisely, similar to these examples:

Example Q: What is a closure in JavaScript?
Example A: A closure is a function that has access to variables from its
outer (enclosing) scope, even after that outer function has returned. This
happens because the inner function maintains a reference to the outer scope's
variable environment. Closures are commonly used for data privacy
(creating private variables), callbacks, and functional programming patterns
like currying. A key thing to watch for: closures in loops can capture the
loop variable by reference, leading to unexpected behavior — use let instead
of var, or create a new scope with an IIFE.

Example Q: When should I use NoSQL over SQL?
Example A: Use NoSQL when: (1) your data schema changes frequently and
you need flexibility, (2) you need horizontal scaling for very high write
throughput, (3) your data is naturally document-shaped or graph-shaped,
or (4) you need low-latency access to simple key-value pairs. Stick with
SQL when: (1) you need complex joins and transactions, (2) data integrity
and ACID compliance matter, (3) your query patterns are complex and varied,
or (4) you need strong consistency guarantees. Many production systems use
both — SQL for transactional data, NoSQL for caching, sessions, or logs.

Now answer the following question in a similar style:`,
    temperature: 1.0,
  },

  {
    id: 'concise',
    name: 'Concise + Low Temp',
    description: 'Brevity-focused prompt with low temperature',
    systemPrompt: `Answer technical questions in 100-200 words.
Be direct. No filler. Every sentence should add information.
Use bullet points for lists. Include one concrete example.
If uncertain, say so in one sentence.`,
    temperature: 0.3,
  },
];
```

### Step 2: Variant Runner

Run your eval suite on each variant:

```typescript
// eval/abTest.ts
import Anthropic from '@anthropic-ai/sdk';
import { runEvaluation, printSummary } from './runner';

const anthropic = new Anthropic();
const MODEL = 'claude-sonnet-4-20250514'; // Keep model constant, vary prompt

function createVariantFn(variant: PromptVariant) {
  return async (question: string) => {
    const start = Date.now();

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: question },
    ];

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: variant.maxTokens || 1024,
      temperature: variant.temperature ?? 1.0,
      system: variant.systemPrompt || undefined,
      messages,
    });

    // For CoT variant, extract just the answer portion
    let answer = response.content[0].type === 'text' ? response.content[0].text : '';
    if (variant.id === 'cot') {
      const answerMatch = answer.match(/<answer>([\s\S]*?)<\/answer>/);
      if (answerMatch) answer = answerMatch[1].trim();
    }

    return {
      answer,
      latency: Date.now() - start,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  };
}

async function runABTest(datasetPath: string): Promise<void> {
  const results: Array<{
    variant: PromptVariant;
    run: EvalRun;
  }> = [];

  for (const variant of variants) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`VARIANT: ${variant.name}`);
    console.log(`Description: ${variant.description}`);
    console.log('='.repeat(60));

    const run = await runEvaluation(
      createVariantFn(variant),
      datasetPath,
      variant.name
    );

    results.push({ variant, run });
  }

  printABTestResults(results);
}
```

### Step 3: A/B Test Results Display

```typescript
function printABTestResults(
  results: Array<{ variant: PromptVariant; run: EvalRun }>
): void {
  console.log('\n' + '='.repeat(90));
  console.log('A/B TEST RESULTS');
  console.log('='.repeat(90));

  // Sort by overall score
  const sorted = [...results].sort(
    (a, b) => b.run.summary.avgOverall - a.run.summary.avgOverall
  );

  // Main comparison table
  const header = 'Variant'.padEnd(20) +
    'Overall'.padStart(10) +
    'Correct'.padStart(10) +
    'Complete'.padStart(10) +
    'Faithful'.padStart(10) +
    'Concise'.padStart(10) +
    'Latency'.padStart(10) +
    'Tokens'.padStart(10);
  console.log(`\n${header}`);
  console.log('-'.repeat(90));

  for (const { variant, run } of sorted) {
    const s = run.summary;
    const totalTokens = run.results.reduce(
      (sum, r) => sum + r.tokenUsage.input + r.tokenUsage.output, 0
    );
    const row =
      variant.name.padEnd(20) +
      `${s.avgOverall.toFixed(2)}`.padStart(10) +
      `${s.avgCorrectness.toFixed(2)}`.padStart(10) +
      `${s.avgCompleteness.toFixed(2)}`.padStart(10) +
      `${s.avgFaithfulness.toFixed(2)}`.padStart(10) +
      `${s.avgConciseness.toFixed(2)}`.padStart(10) +
      `${s.avgLatency.toFixed(0)}ms`.padStart(10) +
      `${totalTokens}`.padStart(10);
    console.log(row);
  }

  // Winner declaration
  const winner = sorted[0];
  const baseline = results.find(r => r.variant.id === 'baseline');
  const improvement = baseline
    ? ((winner.run.summary.avgOverall - baseline.run.summary.avgOverall) /
       baseline.run.summary.avgOverall * 100).toFixed(1)
    : 'N/A';

  console.log(`\nWINNER: ${winner.variant.name}`);
  console.log(`  Score: ${winner.run.summary.avgOverall.toFixed(2)}/5`);
  console.log(`  Improvement over baseline: ${improvement}%`);
  console.log(`  Description: ${winner.variant.description}`);

  // Per-category winners (different prompts may win on different categories)
  console.log('\nBest Variant by Category:');
  const allCategories = [...new Set(
    results.flatMap(r => Object.keys(r.run.summary.categoryBreakdown))
  )];

  for (const cat of allCategories) {
    const catBest = [...results].sort((a, b) => {
      const scoreA = a.run.summary.categoryBreakdown[cat]?.avgScore || 0;
      const scoreB = b.run.summary.categoryBreakdown[cat]?.avgScore || 0;
      return scoreB - scoreA;
    })[0];
    const score = catBest.run.summary.categoryBreakdown[cat]?.avgScore || 0;
    console.log(`  ${cat.padEnd(15)} → ${catBest.variant.name} (${score.toFixed(2)}/5)`);
  }
}
```

### Step 4: Beyond Prompts — Variable Sweep

Prompts aren't the only thing to optimize. Test other variables too:

```typescript
// Temperature sweep
const temperatureVariants: PromptVariant[] = [0.0, 0.3, 0.5, 0.7, 1.0].map(temp => ({
  id: `temp-${temp}`,
  name: `Temperature ${temp}`,
  description: `Same prompt, temperature = ${temp}`,
  systemPrompt: variants[1].systemPrompt, // Use the structured expert prompt
  temperature: temp,
}));

// Max tokens sweep (does constraining length help conciseness?)
const tokenVariants: PromptVariant[] = [256, 512, 1024, 2048].map(tokens => ({
  id: `tokens-${tokens}`,
  name: `Max ${tokens} tokens`,
  description: `Same prompt, max_tokens = ${tokens}`,
  systemPrompt: variants[1].systemPrompt,
  maxTokens: tokens,
}));
```

### Step 5: The Eval-Driven Workflow

Document your process for future use:

```markdown
## Eval-Driven Development Workflow

### Step 1: Hypothesis
"I believe [change X] will improve [metric Y] because [reasoning]."

Example: "I believe adding few-shot examples will improve completeness
because the model will better understand the expected level of detail."

### Step 2: Create Variant
Make the change. Only ONE change per variant.
If you change the prompt AND the temperature, you won't know which helped.

### Step 3: Run Eval
Same dataset, same judge, same conditions.
The only variable is the thing you're testing.

### Step 4: Compare
Look at overall score, category breakdown, and score distributions.
A variant might improve average score but hurt one category.

### Step 5: Decision
- Clear winner (>0.2 improvement)? Ship it.
- Mixed results? Investigate per-category performance.
- No improvement? The hypothesis was wrong. That's useful data.
- Different variants win different categories? Consider routing.

### Step 6: Iterate
The new winner becomes the new baseline.
Form a new hypothesis. Repeat.
```

### Step 6: Build a Prompt Routing System

If different prompts win on different categories, route accordingly:

```typescript
// The eval data might show:
// - Few-shot wins on factual questions (examples help with recall)
// - CoT wins on synthesis (thinking helps with complex reasoning)
// - Concise wins on format questions (less noise)

function selectPrompt(category: string): PromptVariant {
  // Based on eval data
  const routing: Record<string, string> = {
    factual: 'few-shot',
    synthesis: 'cot',
    unanswerable: 'structured',
    edge_case: 'cot',
    format: 'concise',
  };

  const variantId = routing[category] || 'structured';
  return variants.find(v => v.id === variantId)!;
}
```

This is prompt routing — the same concept as model routing from Day 53, but applied to prompt strategies. Your eval data tells you which prompt works best for which type of question, and you route accordingly.

## Key Insight

The biggest lesson from A/B testing prompts: **no single prompt wins everything.** The few-shot prompt might ace factual questions but hurt conciseness. The CoT prompt might crush synthesis but waste tokens on simple questions. The best production system doesn't use one prompt — it routes to the best prompt for each type of input, informed by eval data. This is eval-driven prompt engineering: you don't guess which prompt is "best" overall; you measure which prompt is best for each situation.

## Resources

- [Prompt Engineering Guide — Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
- [Chain of Thought Prompting — Original Paper](https://arxiv.org/abs/2201.11903)
- [Few-Shot Learning with Language Models](https://arxiv.org/abs/2005.14165)
- [Temperature and Sampling in LLMs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)

## Done When

- [ ] You have 3+ distinct prompt variants with clear hypotheses for each
- [ ] Each variant has been run through the full 30-item eval
- [ ] The comparison table shows overall and per-category scores
- [ ] You've identified which variant wins overall and per category
- [ ] You've tested at least one non-prompt variable (temperature or max_tokens)
- [ ] You have a written eval-driven development workflow
- [ ] You can explain why prompt routing (different prompts for different inputs) is better than one universal prompt
- [ ] You've shipped (or noted) the winning variant as the new baseline

---

*Tomorrow: Faza 2 Review. Five hours to polish everything, write a retrospective, and prepare for Faza 3. You've built RAG, agents, MCP servers, and an eval framework. Time to take stock.*
