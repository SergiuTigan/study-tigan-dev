# Day 50 — Eval Mental Model

> *"A bad eval you run is infinitely more valuable than a perfect eval you never build."*

**Date:** Luni, 7 Iulie 2026
**Hours:** 2h · Evening study session
**Topic:** Why evals matter, types of evals, the eval pipeline, getting started
**Phase:** Faza 2 — Patterns · Week 8

---

## What You're Doing

This week is about building the evaluation muscle. Today is the mental model — the framework you'll use to think about evaluation for every AI system you ever build.

The core tension in AI evaluation: **AI outputs are probabilistic, not deterministic.** Traditional software tests check "did function X return value Y?" AI evals check "is this output good enough, often enough, across a representative set of inputs?" You're not testing for equality — you're testing for quality distributions.

This shift from binary pass/fail to scored distributions changes everything about how you test. A prompt that scores 4.2/5 on average is better than one that scores 3.8, even if the 3.8 prompt occasionally produces a perfect 5. You're optimizing for *consistent quality*, not peak performance.

Today you internalize this mental model. The rest of the week, you implement it.

## The Work

### Step 1: Why AI Evals Are Different

Write this down. It's the foundation of everything this week:

```markdown
## Traditional Tests vs AI Evals

Traditional Software Tests:
- Deterministic: same input → same output
- Binary: pass or fail
- Fast: milliseconds
- Free: no API costs
- Complete: you can test every branch

AI Evals:
- Probabilistic: same input → different outputs each run
- Scored: 1-5 scale, not pass/fail
- Slow: seconds per test case (API calls)
- Expensive: every eval run costs tokens
- Incomplete: you can never test all possible inputs

Implication:
You need MANY test cases to get statistical significance.
You need to run evals MULTIPLE TIMES to account for variance.
You need to AUTOMATE scoring because manual review doesn't scale.
```

### Step 2: Types of Evals

Not all evals measure the same thing. Map the landscape:

```markdown
## Eval Types

### Quality Evals (Does it answer well?)
1. **Accuracy/Correctness** — Is the answer factually right?
   - Easiest to evaluate. Compare against known answers.
   - Example: "What year was TypeScript released?" → 2012

2. **Completeness** — Does the answer cover everything it should?
   - Harder. Requires checking multiple aspects.
   - Example: "Explain closures" → Should cover scope, references, use cases

3. **Faithfulness** — Is the answer grounded in provided context?
   - Critical for RAG systems. Did it use the sources or hallucinate?
   - Example: Given documents about product X, does the answer only use those docs?

4. **Relevance** — Does the answer address the actual question?
   - Catches off-topic rambling, tangential responses.
   - Example: Asked about pricing, answered about features.

### Safety Evals (Does it behave?)
5. **Harmfulness** — Does it produce dangerous or inappropriate content?
   - Red-team testing. Adversarial prompts.
   - Example: Does it refuse to generate harmful instructions?

6. **Bias** — Does it treat different groups fairly?
   - Demographic parity in outputs.
   - Example: Resume screening produces equal quality across names.

### Format Evals (Does it follow instructions?)
7. **Format Compliance** — Does the output match the required format?
   - JSON validity, Markdown structure, length constraints.
   - Example: Asked for JSON → Is the output valid JSON?

### Performance Evals (Is it efficient?)
8. **Latency** — How long does it take?
   - Measured in seconds. User experience impact.

9. **Cost** — How much does it cost per query?
   - Tokens in + tokens out × price per token.

10. **Token Efficiency** — Is the output concise or verbose?
    - More tokens ≠ better answers. Often the opposite.
```

### Step 3: The Eval Pipeline

Every eval follows the same five-step pipeline:

```
┌──────────┐     ┌─────┐     ┌───────┐     ┌───────────┐     ┌─────────┐
│ Dataset  │ ──→ │ Run │ ──→ │ Score │ ──→ │ Aggregate │ ──→ │ Compare │
└──────────┘     └─────┘     └───────┘     └───────────┘     └─────────┘

1. DATASET: A set of test cases with inputs and expected outputs
   - 20-50 items for development
   - 100+ items for production decisions
   - Diverse: easy cases, hard cases, edge cases, adversarial cases

2. RUN: Execute your AI system on each test case
   - Record: input, output, latency, token usage
   - Run 1-3 times per item to account for variance

3. SCORE: Evaluate each output
   - Automated metrics (string matching, regex, JSON validation)
   - LLM-as-judge (use a stronger model to score)
   - Human review (ground truth, but doesn't scale)

4. AGGREGATE: Compute summary statistics
   - Average score, median, standard deviation
   - Score distribution (how many 1s, 2s, 3s, 4s, 5s?)
   - Failure rate (% of scores below threshold)

5. COMPARE: Make decisions
   - Prompt A vs Prompt B
   - Model X vs Model Y
   - Configuration 1 vs Configuration 2
   - Is the difference statistically significant?
```

### Step 4: Start Simple, Iterate

The biggest mistake in evals is over-engineering the first version. Here's the minimal viable eval:

```typescript
// The simplest possible eval framework
interface EvalCase {
  input: string;
  expectedOutput: string;
}

interface EvalResult {
  input: string;
  output: string;
  score: number;    // 1-5
  latency: number;  // ms
}

async function runEval(
  cases: EvalCase[],
  systemFn: (input: string) => Promise<string>,
  scoreFn: (output: string, expected: string) => Promise<number>
): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (const testCase of cases) {
    const start = Date.now();
    const output = await systemFn(testCase.input);
    const latency = Date.now() - start;
    const score = await scoreFn(output, testCase.expectedOutput);

    results.push({ input: testCase.input, output, score, latency });

    console.log(`[${score}/5] ${testCase.input.substring(0, 50)}... (${latency}ms)`);
  }

  return results;
}

function summarize(results: EvalResult[]): void {
  const scores = results.map(r => r.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const avgLatency = results.reduce((a, b) => a + b.latency, 0) / results.length;

  console.log(`\nResults (${results.length} cases):`);
  console.log(`  Avg Score: ${avgScore.toFixed(2)}/5`);
  console.log(`  Avg Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`  Score Distribution: ${[1,2,3,4,5].map(s =>
    `${s}:${scores.filter(x => Math.round(x) === s).length}`
  ).join(' ')}`);
}
```

That's 40 lines. It's not perfect. It doesn't handle retries, statistical significance, or detailed criteria. But it runs, produces numbers, and lets you compare two approaches. You can improve it later.

### Step 5: The Eval-Driven Mindset

Write out this workflow. It's the process you'll use for the rest of the week:

```markdown
## Eval-Driven Development

1. HYPOTHESIS: "Adding few-shot examples will improve accuracy"
2. BASELINE: Run eval on current system → Score: 3.8/5
3. VARIANT: Add few-shot examples to the prompt
4. EVAL: Run the same eval on the variant → Score: 4.2/5
5. DECIDE: 4.2 > 3.8, improvement is consistent → Ship the variant

This is scientific method applied to AI engineering:
- You don't ship based on vibes
- You don't revert because one user complained
- You make decisions based on data across representative inputs
```

### Step 6: Plan Your Eval Framework

Sketch out what you'll build this week:

```markdown
## This Week's Build Plan

Day 51: Golden Dataset
- 30 test cases for the research agent
- Factual, synthesis, unanswerable, edge cases, format-specific

Day 52: LLM-as-Judge
- Use Claude to score other Claude outputs
- Multiple criteria: correctness, completeness, faithfulness

Day 53: Multi-Model Comparison
- Same eval on Opus, Sonnet, Haiku
- Compare quality, cost, latency

Day 55: A/B Test Prompts
- 3+ prompt variants
- Eval-driven selection of the best prompt

Day 56: Polish + Ship + Reflect
- Clean up Faza 2
- Blog post draft
- Prep for Faza 3
```

## Key Insight

The most important sentence you'll read this week: **"A bad eval you run is infinitely more valuable than a perfect eval you never build."** Most teams never build evals because they think it's too hard, too time-consuming, or not worth the effort. Then they spend 10x that effort debugging production issues they could have caught with a 30-item test suite. Start with 10 test cases and a simple scoring function. That alone puts you ahead of 90% of AI engineers.

## Resources

- [Develop Tests — Anthropic Docs](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests)
- [LLM Evaluation Best Practices](https://docs.anthropic.com/en/docs/test-and-evaluate)
- [Hamel Husain — Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/)
- [Braintrust — Eval Framework Concepts](https://www.braintrust.dev/docs/guides/evals)

## Done When

- [ ] You can explain why AI evals are different from traditional tests
- [ ] You can name at least 6 types of evals and when to use each
- [ ] You can draw the 5-step eval pipeline from memory
- [ ] You've written a minimal eval runner (even if it's 40 lines)
- [ ] You have a written plan for this week's eval framework
- [ ] You've internalized "bad eval you run > perfect eval you never build"

---

*Tomorrow: You build the golden dataset — 30 carefully designed test cases that will be the foundation for every eval this week.*
