---
title: "Day 31 -- Reranking"
week: 5
day: 31
phase: 2
phaseLabel: "Deep Dive"
order: 531
type: "day"
---
# Day 31 -- Reranking

> *"Embeddings encode query and document separately -- they never see each other. A reranker reads them together. That's the difference between 'probably relevant' and 'definitely relevant.'"*

**Date:** Miercuri, 18 Iunie 2026
**Hours:** 2h · Evening deep-focus block
**Topic:** Cross-encoder reranking for precision retrieval
**Phase:** Faza 2 -- Patterns · Week 5

---

## What You're Doing

Your hybrid search retrieves 20 candidate chunks. But Claude's prompt has limited space, and stuffing 20 chunks in dilutes the answer. You need to narrow down to the 5 most relevant. That's what a **reranker** does: it takes each candidate and scores it against the query using a cross-encoder model that sees both texts together, then you keep only the top results.

This is fundamentally different from embedding-based search. Embeddings encode query and document *independently* -- the query vector and document vector are created in isolation, then compared. A cross-encoder reranker reads the query and document as a *single input*, allowing it to model fine-grained interactions between them. It's slower (can't be pre-computed), but dramatically more accurate for the final ranking step.

## The Work

### Why Reranking: The Two-Stage Architecture

The standard production retrieval pipeline has two stages:

```
Stage 1: RECALL (fast, approximate)
┌─────────────────────────────────────────────┐
│  Hybrid Search: Vector + BM25               │
│  Input: query                                │
│  Output: 20 candidates (fast, ~50ms)         │
│  Goal: Don't miss relevant docs              │
└─────────────────────────────────────────────┘
                      ↓
Stage 2: PRECISION (slow, accurate)
┌─────────────────────────────────────────────┐
│  Reranker: Cross-encoder                     │
│  Input: query + each of 20 candidates        │
│  Output: top 5, re-scored (slower, ~500ms)   │
│  Goal: Put the BEST docs at the top          │
└─────────────────────────────────────────────┘
                      ↓
            Claude generates answer
            from top 5 chunks
```

Stage 1 optimizes for **recall** (don't miss anything relevant). Stage 2 optimizes for **precision** (only keep the best). Together they give you both.

### Bi-Encoder vs Cross-Encoder

Understanding the difference is crucial:

```
BI-ENCODER (embeddings):
  Query:    "What is the revenue?" → [0.2, -0.4, ...] ─┐
                                                         ├─ cosine similarity
  Document: "Q3 revenue was $4.2B" → [0.3, -0.3, ...] ─┘

  ✓ Fast: encode once, compare many
  ✗ Limited: can't model word interactions between query and doc

CROSS-ENCODER (reranker):
  Input: "[Query: What is the revenue?] [Document: Q3 revenue was $4.2B]"
         → relevance score: 0.94

  ✗ Slow: must process each (query, doc) pair separately
  ✓ Accurate: sees both texts together, models interactions
```

The bi-encoder can't tell if "revenue" in the query refers to the same concept as "revenue" in the document -- it just knows the vectors are close. The cross-encoder reads both together and *understands* the relationship.

### Implementation: Cohere Rerank

Cohere's Rerank API is the most popular production reranker:

```typescript
// npm install cohere-ai
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

interface RerankResult {
  content: string;
  relevanceScore: number;
  originalIndex: number;
  metadata: Record<string, unknown>;
}

async function rerankDocuments(
  query: string,
  documents: { content: string; metadata: Record<string, unknown> }[],
  topK: number = 5
): Promise<RerankResult[]> {
  const response = await cohere.rerank({
    model: "rerank-english-v3.0",
    query: query,
    documents: documents.map((d) => d.content),
    topN: topK,
    returnDocuments: true,
  });

  return response.results.map((result) => ({
    content: result.document?.text || documents[result.index].content,
    relevanceScore: result.relevanceScore,
    originalIndex: result.index,
    metadata: documents[result.index].metadata,
  }));
}
```

### Implementation: Voyage AI Rerank (Alternative)

Voyage AI also offers a reranker, which pairs well if you're already using their embeddings:

```typescript
import VoyageAI from "voyageai";

const voyage = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY });

async function rerankWithVoyage(
  query: string,
  documents: { content: string; metadata: Record<string, unknown> }[],
  topK: number = 5
): Promise<RerankResult[]> {
  const response = await voyage.rerank({
    query: query,
    documents: documents.map((d) => d.content),
    model: "rerank-2",
    topK: topK,
    returnDocuments: true,
  });

  return response.data.map((result) => ({
    content: result.document || documents[result.index].content,
    relevanceScore: result.relevanceScore,
    originalIndex: result.index,
    metadata: documents[result.index].metadata,
  }));
}
```

### The Complete Retrieval Pipeline

Now wire everything together:

```typescript
async function fullRetrievalPipeline(
  query: string,
  store: SupabaseVectorStore,
  embedder: EmbeddingProvider,
  options: {
    retrieveCount?: number;  // How many to get from hybrid search
    rerankCount?: number;    // How many to keep after reranking
    vectorWeight?: number;
    textWeight?: number;
  } = {}
): Promise<RerankResult[]> {
  const {
    retrieveCount = 20,
    rerankCount = 5,
    vectorWeight = 0.6,
    textWeight = 0.4,
  } = options;

  console.log(`\n[Pipeline] Query: "${query}"`);

  // Stage 1: Hybrid search (recall)
  const queryEmbedding = await embedder.embedQuery(query);
  const candidates = await hybridSearch(query, queryEmbedding, {
    topK: retrieveCount,
    vectorWeight,
    textWeight,
  });
  console.log(`[Pipeline] Hybrid search: ${candidates.length} candidates`);

  if (candidates.length === 0) {
    return [];
  }

  // Stage 2: Rerank (precision)
  const reranked = await rerankDocuments(
    query,
    candidates.map((c) => ({ content: c.content, metadata: c.metadata })),
    rerankCount
  );
  console.log(`[Pipeline] Reranked: top ${reranked.length} selected`);

  // Log the ranking changes
  for (const result of reranked) {
    const originalRank = result.originalIndex + 1;
    const newRank = reranked.indexOf(result) + 1;
    const moved = originalRank !== newRank ? ` (was #${originalRank})` : "";
    console.log(
      `  #${newRank}${moved}: [${result.relevanceScore.toFixed(3)}] ${result.content.slice(0, 60)}...`
    );
  }

  return reranked;
}
```

### Updated RAG Function

```typescript
async function askRAGv2(
  query: string,
  store: SupabaseVectorStore,
  embedder: EmbeddingProvider
): Promise<RAGResponse> {
  // Full pipeline: hybrid search → rerank → generate
  const topChunks = await fullRetrievalPipeline(query, store, embedder, {
    retrieveCount: 20,
    rerankCount: 5,
  });

  if (topChunks.length === 0) {
    return {
      answer: "I couldn't find any relevant documents to answer this question.",
      sources: [],
      chunksUsed: 0,
    };
  }

  // Convert to the format generateAnswer expects
  const context: RetrievedChunk[] = topChunks.map((chunk) => ({
    content: chunk.content,
    source: (chunk.metadata as any).source || "unknown",
    similarity: chunk.relevanceScore,
    metadata: chunk.metadata,
  }));

  return generateAnswer(query, context);
}
```

### Observing the Reranker's Impact

Build a comparison test:

```typescript
async function compareWithAndWithoutRerank(query: string): Promise<void> {
  const queryEmbedding = await embedder.embedQuery(query);

  // Without reranking: just take top 5 from hybrid search
  const hybridTop5 = await hybridSearch(query, queryEmbedding, { topK: 5 });

  // With reranking: get top 20, rerank to top 5
  const hybridTop20 = await hybridSearch(query, queryEmbedding, { topK: 20 });
  const rerankedTop5 = await rerankDocuments(
    query,
    hybridTop20.map((c) => ({ content: c.content, metadata: c.metadata })),
    5
  );

  console.log(`\nQuery: "${query}"\n`);

  console.log("Without reranking (hybrid top 5):");
  hybridTop5.forEach((r, i) =>
    console.log(`  ${i + 1}. ${r.content.slice(0, 80)}...`)
  );

  console.log("\nWith reranking (hybrid top 20 → rerank top 5):");
  rerankedTop5.forEach((r, i) =>
    console.log(`  ${i + 1}. [${r.relevanceScore.toFixed(3)}] ${r.content.slice(0, 80)}...`)
  );
}
```

Run this on several queries. You'll see the reranker promote relevant documents that hybrid search ranked lower, and demote false positives that happened to have high vector similarity.

## Key Insight

Reranking is a precision tool, not a recall tool. It can't find documents that weren't retrieved in Stage 1 -- it can only re-order what you give it. This is why you retrieve 20 in Stage 1 (cast a wide net) and narrow to 5 in Stage 2 (pick the best). If your Stage 1 only returns 5 documents, reranking has nothing to work with. The retrieve-many-then-rerank pattern is the standard architecture in every production search system, from Google to Amazon to your RAG pipeline.

## Resources

- [Cohere Rerank Documentation](https://docs.cohere.com/docs/rerank-2) -- API reference and best practices for Cohere's reranker.
- [Voyage AI Rerank](https://docs.voyageai.com/docs/reranker) -- alternative reranker that pairs well with Voyage embeddings.
- [Cross-Encoders vs Bi-Encoders (SBERT)](https://www.sbert.net/examples/applications/cross-encoder/README.html) -- technical deep dive on the two architectures.
- [Contextual Retrieval (Anthropic)](https://www.anthropic.com/news/contextual-retrieval) -- see the benchmarks showing reranking's impact.

## Done When

- [ ] You can explain the difference between bi-encoders (embeddings) and cross-encoders (rerankers)
- [ ] You've implemented reranking using Cohere or Voyage AI
- [ ] Your pipeline is: Query -> Embed -> Hybrid Search (top 20) -> Rerank (top 5) -> Prompt -> Answer
- [ ] You've compared results with and without reranking on the same queries
- [ ] You understand that reranking improves precision, not recall

---

*Tomorrow: Time to put it all together. You'll re-implement your entire RAG pipeline with contextual retrieval, hybrid search, and reranking -- then compare it head-to-head against your Week 4 naive version.*
