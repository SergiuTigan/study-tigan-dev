---
title: "Evaluation & Optimization"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "rag"
moduleTitle: "RAG"
moduleDescription: "Build Retrieval-Augmented Generation systems that ground LLM responses in your data."
lessonId: "ai-engineer/rag/evaluation-optimization"
duration: "10 min"
order: 405
moduleOrder: 4
lessonOrder: 5
color: "purple"
---
# Evaluation & Optimization

Evaluating a RAG system requires measuring both retrieval quality and generation quality. Improving one without the other leads to suboptimal results.

## Retrieval Metrics

```typescript
interface RetrievalMetrics {
  precision: number;   // What fraction of retrieved docs are relevant?
  recall: number;      // What fraction of relevant docs were retrieved?
  mrr: number;         // Mean Reciprocal Rank -- where is the first relevant result?
  ndcg: number;        // Normalized Discounted Cumulative Gain
}

function calculatePrecision(retrieved: string[], relevant: string[]): number {
  const relevantSet = new Set(relevant);
  const hits = retrieved.filter(id => relevantSet.has(id));
  return hits.length / retrieved.length;
}

function calculateRecall(retrieved: string[], relevant: string[]): number {
  const retrievedSet = new Set(retrieved);
  const hits = relevant.filter(id => retrievedSet.has(id));
  return hits.length / relevant.length;
}
```

## Generation Metrics

Evaluate the final answer quality:

- **Faithfulness:** Does the answer accurately reflect the source documents?
- **Relevance:** Does the answer address the user's question?
- **Completeness:** Does the answer cover all aspects of the question?
- **Groundedness:** Is every claim in the answer supported by a source?

## Automated Evaluation with LLM-as-Judge

```typescript
async function evaluateAnswer(
  question: string,
  answer: string,
  sources: string[],
): Promise<{ faithfulness: number; relevance: number }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Evaluate this RAG answer on two criteria (1-5 scale):

Question: ${question}
Answer: ${answer}
Sources: ${sources.join('\\n')}

Rate:
1. Faithfulness (is the answer supported by the sources?)
2. Relevance (does the answer address the question?)

Respond as JSON: { "faithfulness": N, "relevance": N }`,
    }],
  });

  return JSON.parse(response.content[0].text);
}
```

## Optimization Strategies

1. **Improve retrieval:** Better chunking, query expansion, reranking.
2. **Improve generation:** Better system prompts, few-shot examples.
3. **Reduce hallucination:** Instruct the model to only use provided sources.
4. **Add citations:** Require the model to cite specific sources.
5. **Iterative refinement:** Use evaluation results to identify failure patterns.

## Tracking Over Time

```typescript
interface RAGEvalResult {
  timestamp: Date;
  querySetVersion: string;
  retrievalPrecision: number;
  retrievalRecall: number;
  faithfulness: number;
  relevance: number;
  latencyP50: number;
  latencyP99: number;
}
```

Track these metrics as you modify your RAG pipeline. Regressions are common when changing one component without evaluating the full system.
