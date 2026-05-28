---
title: "Day 34 -- Evaluate Your RAG"
week: 5
day: 34
phase: 2
phaseLabel: "Deep Dive"
order: 534
type: "day"
---
# Day 34 -- Evaluate Your RAG

> *"If you can't measure it, you can't improve it. And if you can't improve it, you're just guessing. Eval turns guessing into engineering."*

**Date:** Sambata, 21 Iunie 2026
**Hours:** 3h · Morning deep-work block
**Topic:** RAG evaluation -- golden datasets, retrieval metrics, LLM-as-judge
**Phase:** Faza 2 -- Patterns · Week 5

---

## What You're Doing

You've built a production-quality RAG pipeline. It has contextual retrieval, hybrid search, and reranking. You've even done an informal comparison against the naive pipeline. But informal comparisons aren't engineering. Today you build a proper evaluation framework: a golden dataset with expected answers, retrieval metrics that measure search quality, and an LLM-as-judge system that scores generation quality. When you're done, you'll have numbers -- not opinions -- about how well your system works.

This matters more than any other day this week. A RAG system without eval is a demo. A RAG system with eval is a product. Eval is how you catch regressions, justify improvements, and communicate quality to stakeholders.

## The Work

### Step 1: Build a Golden Dataset

A golden dataset is a set of question-answer pairs where you know the correct answer and which documents contain it. You write these by hand, based on your 5 ingested PDFs.

```typescript
interface GoldenExample {
  id: string;
  question: string;
  expectedAnswer: string;
  relevantSources: string[];     // Which PDF files contain the answer
  relevantChunkKeywords: string[]; // Key phrases that should appear in retrieved chunks
  difficulty: "easy" | "medium" | "hard";
  category: "factual" | "synthesis" | "unanswerable" | "multi-doc";
}

const goldenDataset: GoldenExample[] = [
  // EASY: Direct factual questions
  {
    id: "q1",
    question: "What is contextual retrieval?",
    expectedAnswer: "Contextual retrieval is a technique where document-level context is prepended to each chunk before embedding, improving retrieval quality by 20-35%.",
    relevantSources: ["anthropic-contextual-retrieval.pdf"],
    relevantChunkKeywords: ["contextual", "retrieval", "chunk", "context"],
    difficulty: "easy",
    category: "factual",
  },
  {
    id: "q2",
    question: "What was the company's total annual revenue?",
    expectedAnswer: "The company reported total annual revenue of $X billion.", // Fill in from your actual PDF
    relevantSources: ["company-annual-report.pdf"],
    relevantChunkKeywords: ["revenue", "annual", "total"],
    difficulty: "easy",
    category: "factual",
  },

  // MEDIUM: Requires synthesis from one document
  {
    id: "q3",
    question: "What are the main advantages of React hooks over class components?",
    expectedAnswer: "React hooks simplify state management, eliminate the need for class syntax, allow sharing logic between components via custom hooks, and make code more readable and testable.",
    relevantSources: ["react-docs-overview.pdf"],
    relevantChunkKeywords: ["hooks", "useState", "useEffect", "class"],
    difficulty: "medium",
    category: "synthesis",
  },

  // HARD: Multi-document synthesis
  {
    id: "q4",
    question: "What technologies or technical concepts are discussed across all documents?",
    expectedAnswer: "Multiple documents discuss AI/ML, data processing, and modern software practices.",
    relevantSources: ["anthropic-contextual-retrieval.pdf", "react-docs-overview.pdf", "startup-pitch-deck.pdf"],
    relevantChunkKeywords: ["technology", "AI", "machine learning"],
    difficulty: "hard",
    category: "multi-doc",
  },

  // UNANSWERABLE: Should refuse
  {
    id: "q5",
    question: "What will Apple's stock price be next quarter?",
    expectedAnswer: "UNANSWERABLE - this information is not in the provided documents.",
    relevantSources: [],
    relevantChunkKeywords: [],
    difficulty: "easy",
    category: "unanswerable",
  },

  // ... continue to 20 examples covering all your PDFs
  // Aim for: 8 easy, 6 medium, 4 hard, 2 unanswerable
];
```

**Write 20 examples.** This takes 30-45 minutes. Read through your PDFs and write questions you know the answers to. Cover every document, multiple difficulty levels, and include 2-3 questions that should be unanswerable.

### Step 2: Retrieval Metrics

Before measuring answer quality, measure whether your system is *finding* the right documents.

```typescript
interface RetrievalMetrics {
  hitRate: number;     // % of queries where a relevant doc is in top-K
  mrr: number;         // Mean Reciprocal Rank -- how high the first relevant doc ranks
  precision: number;   // % of retrieved docs that are relevant
  recall: number;      // % of relevant docs that are retrieved
}

function evaluateRetrieval(
  results: { query: string; retrievedSources: string[] }[],
  goldenDataset: GoldenExample[]
): RetrievalMetrics {
  let hits = 0;
  let reciprocalRankSum = 0;
  let totalPrecision = 0;
  let totalRecall = 0;
  let evaluableCount = 0;

  for (const result of results) {
    const golden = goldenDataset.find((g) => g.question === result.query);
    if (!golden || golden.relevantSources.length === 0) continue;

    evaluableCount++;
    const relevantSet = new Set(golden.relevantSources);

    // Hit Rate: Is ANY relevant source in the retrieved results?
    const hasHit = result.retrievedSources.some((s) => relevantSet.has(s));
    if (hasHit) hits++;

    // MRR: What position is the FIRST relevant source?
    const firstRelevantIndex = result.retrievedSources.findIndex((s) =>
      relevantSet.has(s)
    );
    if (firstRelevantIndex >= 0) {
      reciprocalRankSum += 1 / (firstRelevantIndex + 1);
    }

    // Precision: What fraction of retrieved docs are relevant?
    const relevantRetrieved = result.retrievedSources.filter((s) =>
      relevantSet.has(s)
    ).length;
    totalPrecision += relevantRetrieved / result.retrievedSources.length;

    // Recall: What fraction of relevant docs are retrieved?
    totalRecall += relevantRetrieved / golden.relevantSources.length;
  }

  return {
    hitRate: evaluableCount > 0 ? hits / evaluableCount : 0,
    mrr: evaluableCount > 0 ? reciprocalRankSum / evaluableCount : 0,
    precision: evaluableCount > 0 ? totalPrecision / evaluableCount : 0,
    recall: evaluableCount > 0 ? totalRecall / evaluableCount : 0,
  };
}
```

**What good looks like:**
- **Hit Rate > 0.85**: The relevant document is found 85%+ of the time
- **MRR > 0.7**: The relevant document is usually in the top 1-2 positions
- **Precision > 0.6**: Most retrieved docs are actually relevant

### Step 3: LLM-as-Judge for Generation Quality

Use a separate Claude call to score how well the generated answer matches the expected answer:

```typescript
interface JudgeScore {
  correctness: number;    // 1-5: Is the answer factually correct?
  completeness: number;   // 1-5: Does it cover all key points?
  faithfulness: number;   // 1-5: Is it grounded in the sources (no hallucination)?
  conciseness: number;    // 1-5: Is it appropriately concise?
  overall: number;        // 1-5: Overall quality
  reasoning: string;      // Judge's explanation
}

async function judgeAnswer(
  question: string,
  expectedAnswer: string,
  generatedAnswer: string,
  retrievedContext: string
): Promise<JudgeScore> {
  const prompt = `You are an expert evaluator for a question-answering system. Score the generated answer against the expected answer.

QUESTION: ${question}

EXPECTED ANSWER: ${expectedAnswer}

GENERATED ANSWER: ${generatedAnswer}

RETRIEVED CONTEXT (what the system had to work with):
${retrievedContext}

Score each criterion from 1 (worst) to 5 (best):

1. CORRECTNESS: Is the generated answer factually correct compared to the expected answer?
   1=completely wrong, 3=partially correct, 5=fully correct

2. COMPLETENESS: Does the generated answer cover all key points from the expected answer?
   1=missing everything, 3=covers some points, 5=covers all points

3. FAITHFULNESS: Is the generated answer grounded in the retrieved context? (No made-up facts)
   1=mostly hallucinated, 3=mix of grounded and hallucinated, 5=fully grounded

4. CONCISENESS: Is the answer appropriately concise without unnecessary padding?
   1=extremely verbose/off-topic, 3=acceptable, 5=perfectly concise

5. OVERALL: Overall quality of the answer
   1=useless, 3=acceptable, 5=excellent

Respond in this exact JSON format:
{
  "correctness": <1-5>,
  "completeness": <1-5>,
  "faithfulness": <1-5>,
  "conciseness": <1-5>,
  "overall": <1-5>,
  "reasoning": "<2-3 sentences explaining your scores>"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    return JSON.parse(text);
  } catch {
    console.error("Failed to parse judge response:", text);
    return {
      correctness: 0, completeness: 0, faithfulness: 0,
      conciseness: 0, overall: 0, reasoning: "Parse error",
    };
  }
}
```

### Step 4: Run the Full Evaluation

```typescript
interface EvalResult {
  example: GoldenExample;
  retrievedSources: string[];
  generatedAnswer: string;
  judgeScore: JudgeScore;
}

async function runFullEvaluation(
  dataset: GoldenExample[],
  store: SupabaseVectorStore,
  embedder: EmbeddingProvider
): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (const example of dataset) {
    console.log(`\nEvaluating: "${example.question}" [${example.difficulty}]`);

    // Retrieve
    const context = await retrieveV2(example.question, embedder);

    // Generate
    const response = await generateAnswer(example.question, context);

    // Judge
    const score = await judgeAnswer(
      example.question,
      example.expectedAnswer,
      response.answer,
      context.map((c) => c.content).join("\n\n")
    );

    console.log(`  Scores: C=${score.correctness} Comp=${score.completeness} F=${score.faithfulness} O=${score.overall}`);
    console.log(`  Judge: ${score.reasoning}`);

    results.push({
      example,
      retrievedSources: context.map((c) => c.source),
      generatedAnswer: response.answer,
      judgeScore: score,
    });
  }

  return results;
}
```

### Step 5: Calibrate the Judge

Before trusting the LLM judge, manually verify it agrees with your assessment:

```typescript
async function calibrateJudge(results: EvalResult[]): Promise<void> {
  console.log("\n=== CALIBRATION ===");
  console.log("Manually score 5 random examples and compare with the LLM judge.\n");

  // Pick 5 random results
  const sample = results.sort(() => Math.random() - 0.5).slice(0, 5);

  for (const result of sample) {
    console.log(`Q: "${result.example.question}"`);
    console.log(`Expected: ${result.example.expectedAnswer.slice(0, 100)}...`);
    console.log(`Generated: ${result.generatedAnswer.slice(0, 100)}...`);
    console.log(`LLM Judge overall: ${result.judgeScore.overall}/5`);
    console.log(`LLM reasoning: ${result.judgeScore.reasoning}`);
    console.log(`YOUR score (1-5): ___   (fill in manually)`);
    console.log("---");
  }
}
```

If the LLM judge consistently disagrees with your assessment by more than 1 point, adjust the judging prompt. Common fixes: provide more specific rubrics, add examples of 1/3/5 scores, or separate criteria more clearly.

### Print the Final Report

```typescript
function printEvalReport(results: EvalResult[]): void {
  // Retrieval metrics
  const retrievalData = results.map((r) => ({
    query: r.example.question,
    retrievedSources: r.retrievedSources,
  }));
  const retrieval = evaluateRetrieval(retrievalData, goldenDataset);

  console.log("\n" + "=".repeat(60));
  console.log("RAG EVALUATION REPORT");
  console.log("=".repeat(60));

  console.log("\n--- Retrieval Metrics ---");
  console.log(`  Hit Rate:  ${(retrieval.hitRate * 100).toFixed(1)}%`);
  console.log(`  MRR:       ${retrieval.mrr.toFixed(3)}`);
  console.log(`  Precision: ${(retrieval.precision * 100).toFixed(1)}%`);
  console.log(`  Recall:    ${(retrieval.recall * 100).toFixed(1)}%`);

  // Generation metrics (averages)
  const avgScores = {
    correctness: avg(results.map((r) => r.judgeScore.correctness)),
    completeness: avg(results.map((r) => r.judgeScore.completeness)),
    faithfulness: avg(results.map((r) => r.judgeScore.faithfulness)),
    conciseness: avg(results.map((r) => r.judgeScore.conciseness)),
    overall: avg(results.map((r) => r.judgeScore.overall)),
  };

  console.log("\n--- Generation Metrics (avg across dataset) ---");
  console.log(`  Correctness:  ${avgScores.correctness.toFixed(2)}/5`);
  console.log(`  Completeness: ${avgScores.completeness.toFixed(2)}/5`);
  console.log(`  Faithfulness: ${avgScores.faithfulness.toFixed(2)}/5`);
  console.log(`  Conciseness:  ${avgScores.conciseness.toFixed(2)}/5`);
  console.log(`  Overall:      ${avgScores.overall.toFixed(2)}/5`);

  // Breakdown by difficulty
  for (const difficulty of ["easy", "medium", "hard"] as const) {
    const subset = results.filter((r) => r.example.difficulty === difficulty);
    if (subset.length === 0) continue;
    const subAvg = avg(subset.map((r) => r.judgeScore.overall));
    console.log(`\n  ${difficulty.toUpperCase()} (${subset.length} questions): ${subAvg.toFixed(2)}/5`);
  }

  // Worst performers
  const sorted = [...results].sort(
    (a, b) => a.judgeScore.overall - b.judgeScore.overall
  );
  console.log("\n--- Weakest Questions (improve these first) ---");
  for (const result of sorted.slice(0, 3)) {
    console.log(`  [${result.judgeScore.overall}/5] "${result.example.question}"`);
    console.log(`    Judge: ${result.judgeScore.reasoning}`);
  }
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
```

## Key Insight

Evaluation isn't a one-time activity -- it's a **regression test suite** for your RAG system. Every time you change chunking strategy, swap an embedding model, adjust the reranking threshold, or update the system prompt, you re-run the eval. If scores go up, ship it. If scores go down, revert it. This is the difference between engineering (evidence-based decisions) and tinkering (hope-based changes). Build the eval once, use it forever.

## Resources

- [RAGAS Documentation](https://docs.ragas.io/) -- the standard open-source RAG evaluation framework. Study their metrics even if you implement your own.
- [LLM-as-Judge (Anthropic)](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering) -- patterns for using Claude to evaluate outputs.
- [Evaluation Best Practices (LangSmith)](https://docs.smith.langchain.com/) -- LangChain's evaluation platform with good conceptual docs.

## Done When

- [ ] You have a golden dataset of 20 question-answer pairs covering all 5 PDFs
- [ ] You're measuring retrieval metrics: Hit Rate, MRR, Precision, Recall
- [ ] Your LLM-as-judge scores answers on correctness, completeness, faithfulness, and conciseness
- [ ] You've calibrated the judge by manually scoring 5 examples and comparing
- [ ] You have a printed evaluation report with aggregate scores and worst-performer analysis

---

*Tomorrow: The grand finale. You'll add a UI, clean the codebase, write the README, and push portfolio piece #2 to GitHub. This is the day it becomes real.*
