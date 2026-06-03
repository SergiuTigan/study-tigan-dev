---
title: "Semantic Search Implementation"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "embeddings"
moduleTitle: "Embeddings & Vector Search"
moduleDescription: "Understand how embedding models and vector databases enable semantic search and retrieval."
lessonId: "ai-engineer/embeddings/semantic-search"
duration: "12 min"
order: 303
moduleOrder: 3
lessonOrder: 3
color: "purple"
---
# Semantic Search Implementation

Semantic search finds documents based on meaning rather than keyword matching. It is the foundation of RAG systems and powers intelligent search features.

## End-to-End Pipeline

```
Query: "How do I manage state in Angular?"
  ↓
[Embed Query] → [0.12, -0.45, 0.78, ...]
  ↓
[Vector Search] → Find nearest neighbors
  ↓
[Results]:
  1. "Angular Signals provide reactive state management" (0.92)
  2. "NgRx is a Redux-inspired state management library" (0.88)
  3. "Component state can be managed with signals" (0.85)
```

## Implementation

```typescript
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai = new OpenAI();
const pinecone = new Pinecone();
const index = pinecone.index('knowledge-base');

// Step 1: Ingest documents
async function ingestDocument(id: string, text: string, metadata: Record<string, string>): Promise<void> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  await index.upsert([{
    id,
    values: response.data[0].embedding,
    metadata: { ...metadata, text },
  }]);
}

// Step 2: Search
async function search(query: string, topK = 5): Promise<SearchResult[]> {
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const results = await index.query({
    vector: queryEmbedding.data[0].embedding,
    topK,
    includeMetadata: true,
  });

  return results.matches.map(match => ({
    text: match.metadata?.text as string,
    score: match.score ?? 0,
    metadata: match.metadata,
  }));
}
```

## Hybrid Search

Combine semantic search with keyword search for better results:

```typescript
async function hybridSearch(query: string): Promise<SearchResult[]> {
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query),
    keywordSearch(query), // BM25, Elasticsearch, etc.
  ]);

  // Reciprocal Rank Fusion
  return fuseResults(semanticResults, keywordResults);
}
```

## Reranking

After initial retrieval, use a reranking model to improve result quality:

```typescript
// Retrieve top 20 with vector search (fast, approximate)
const candidates = await search(query, 20);

// Rerank to get the best 5 (slow, precise)
const reranked = await cohere.rerank({
  query,
  documents: candidates.map(c => c.text),
  topN: 5,
  model: 'rerank-v3.5',
});
```

Semantic search is not a replacement for keyword search -- it is a complement. The best systems use both.
