---
title: "Retrieval Strategies"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "rag"
moduleTitle: "RAG"
moduleDescription: "Build Retrieval-Augmented Generation systems that ground LLM responses in your data."
lessonId: "ai-engineer/rag/retrieval-strategies"
duration: "12 min"
order: 403
moduleOrder: 4
lessonOrder: 3
color: "purple"
---
# Retrieval Strategies

The retrieval stage of RAG determines which documents the LLM sees. Better retrieval means more relevant context and better answers.

## Basic Vector Search

The simplest strategy: embed the query, find nearest vectors.

```typescript
const results = await vectorDB.query({
  vector: queryEmbedding,
  topK: 5,
});
```

Limitations: The query may not be semantically similar to the best answer. "What are the side effects of aspirin?" might not match "Aspirin can cause stomach bleeding."

## Query Transformation

Rewrite the query to improve retrieval:

```typescript
async function expandQuery(query: string): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Generate 3 different phrasings of this search query to improve retrieval. Return one per line.

Query: ${query}`,
    }],
  });

  return response.content[0].text.split('\\n').filter(Boolean);
}

// Search with all query variants
const allResults = await Promise.all(
  queries.map(q => search(q, 5))
);
const merged = deduplicateAndRank(allResults.flat());
```

## Hypothetical Document Embedding (HyDE)

Generate a hypothetical answer, embed that instead of the query:

```typescript
async function hydeSearch(query: string): Promise<SearchResult[]> {
  // Generate a hypothetical answer
  const hypothetical = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Write a short paragraph that would answer this question: ${query}`,
    }],
  });

  // Embed the hypothetical answer (not the question)
  const embedding = await embed(hypothetical.content[0].text);
  return vectorDB.query({ vector: embedding, topK: 5 });
}
```

## Multi-Step Retrieval

For complex questions, retrieve in stages:

```typescript
async function multiStepRetrieval(query: string): Promise<SearchResult[]> {
  // Step 1: Broad retrieval
  const initial = await search(query, 20);

  // Step 2: Rerank
  const reranked = await rerank(query, initial, 10);

  // Step 3: Contextual retrieval -- fetch parent/sibling chunks
  const expanded = await expandContext(reranked);

  return expanded;
}
```

## Metadata Filtering

Narrow the search space before vector similarity:

```typescript
const results = await vectorDB.query({
  vector: queryEmbedding,
  topK: 5,
  filter: {
    source: { $eq: 'documentation' },
    date: { $gte: '2024-01-01' },
  },
});
```

The best retrieval strategy depends on your data, queries, and latency requirements. Start simple and add complexity based on evaluation results.
