---
title: "Day 24 -- Vector Similarity Search"
week: 4
day: 24
phase: 2
phaseLabel: "Deep Dive"
order: 424
type: "day"
---
# Day 24 -- Vector Similarity Search

> *"Every vector database in the world -- Pinecone, Weaviate, Chroma, pgvector -- does exactly what you'll build today. They just do it faster."*

**Date:** Miercuri, 11 Iunie 2026
**Hours:** 2h · Evening deep-focus block
**Topic:** Building similarity search from scratch
**Phase:** Faza 2 -- Patterns · Week 4

---

## What You're Doing

Yesterday you turned text into vectors. Today you build the search engine. No libraries, no vector databases -- just pure math. You'll implement cosine similarity from scratch, build an in-memory index, and create a working mini search engine that takes a query and returns the most relevant documents with scores.

This matters because every vector database -- Pinecone, Weaviate, Chroma, pgvector -- does exactly what you'll build today at its core. The algorithms they use (HNSW, IVF) are optimizations for doing this at scale. But the fundamental operation is identical: compute similarity between a query vector and stored vectors, return the top K matches. If you understand today's code, you understand vector search.

## The Work

### Cosine Similarity: The Math

Two vectors are similar if they point in the same direction. Cosine similarity measures the angle between them:

```
                    A · B           Σ(aᵢ × bᵢ)
cos(θ) = ─────────────────── = ──────────────────────
              ||A|| × ||B||     √Σ(aᵢ²) × √Σ(bᵢ²)
```

- **Result = 1.0**: Vectors point in exactly the same direction (identical meaning)
- **Result = 0.0**: Vectors are perpendicular (unrelated)
- **Result = -1.0**: Vectors point in opposite directions (opposite meaning)

In practice, embedding vectors almost always fall between 0.0 and 1.0.

### Implementation: Cosine Similarity

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}
```

That's it. This function is the **entire foundation** of semantic search.

### Alternative: Dot Product and Euclidean Distance

```typescript
// Dot product -- faster, but only works with normalized vectors
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

// Euclidean distance -- lower = more similar (opposite of cosine)
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}
```

**When to use which:**
- **Cosine similarity** -- default choice. Works regardless of vector magnitude. Use this.
- **Dot product** -- faster when vectors are already normalized (Voyage AI normalizes by default).
- **Euclidean distance** -- useful when magnitude matters. Less common for text search.

### Build: Mini Search Engine

Now build a complete in-memory search engine:

```typescript
import { EmbeddingProvider } from "./embeddings"; // from yesterday

interface Document {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  document: Document;
  score: number;
}

class MiniSearchEngine {
  private documents: Document[] = [];
  private vectors: number[][] = [];
  private embedder: EmbeddingProvider;

  constructor(embedder: EmbeddingProvider) {
    this.embedder = embedder;
  }

  // INGEST: Add documents to the index
  async addDocuments(docs: Document[]): Promise<void> {
    const texts = docs.map((d) => d.text);
    const embeddings = await this.embedder.embedDocuments(texts);

    this.documents.push(...docs);
    this.vectors.push(...embeddings);

    console.log(`Indexed ${docs.length} documents. Total: ${this.documents.length}`);
  }

  // SEARCH: Find the top K most similar documents
  async search(query: string, topK: number = 3): Promise<SearchResult[]> {
    const queryVector = await this.embedder.embedQuery(query);

    // Score every document
    const scored: SearchResult[] = this.documents.map((doc, i) => ({
      document: doc,
      score: cosineSimilarity(queryVector, this.vectors[i]),
    }));

    // Sort by score descending, take top K
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
```

### Exercise: Build and Test

Create a corpus of 15-20 text snippets spanning 3-4 topics:

```typescript
const engine = new MiniSearchEngine(embedder);

await engine.addDocuments([
  // TypeScript / Programming
  { id: "1", text: "TypeScript adds static typing to JavaScript, catching errors at compile time rather than runtime." },
  { id: "2", text: "The async/await syntax in JavaScript makes asynchronous code read like synchronous code." },
  { id: "3", text: "React hooks like useState and useEffect replaced class-based component lifecycle methods." },
  { id: "4", text: "Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient." },

  // Machine Learning
  { id: "5", text: "Neural networks learn by adjusting weights through backpropagation and gradient descent." },
  { id: "6", text: "Transformers use self-attention mechanisms to process all tokens in parallel." },
  { id: "7", text: "Transfer learning allows models pre-trained on large datasets to be fine-tuned for specific tasks." },
  { id: "8", text: "Large language models predict the next token based on all previous tokens in the context." },

  // Cooking
  { id: "9", text: "Sourdough bread requires a starter culture that ferments for at least 12 hours before baking." },
  { id: "10", text: "The Maillard reaction occurs when proteins and sugars are heated, creating complex flavors." },
  { id: "11", text: "Risotto should be stirred constantly to release starch and create a creamy texture." },
  { id: "12", text: "Properly tempering chocolate requires precise temperature control through heating and cooling cycles." },

  // Finance
  { id: "13", text: "Compound interest means you earn interest on your interest, creating exponential growth over time." },
  { id: "14", text: "Dollar-cost averaging reduces risk by investing fixed amounts at regular intervals regardless of price." },
  { id: "15", text: "The P/E ratio compares a company's stock price to its earnings per share." },
]);

// Test queries
const queries = [
  "How do modern JavaScript frameworks manage state?",
  "What makes bread rise?",
  "How do AI models learn from data?",
  "Best strategy for long-term investing?",
  "How does TypeScript prevent bugs?",
];

for (const query of queries) {
  console.log(`\n🔍 Query: "${query}"`);
  const results = await engine.search(query, 3);
  for (const { document, score } of results) {
    console.log(`  [${score.toFixed(3)}] ${document.text.slice(0, 80)}...`);
  }
}
```

### What to Look For

Run this and examine the results:

1. **Topic clustering**: Do queries about programming find programming docs? (They should.)
2. **Score distribution**: What's the gap between result #1 and result #3? A large gap means clear relevance. A small gap means the query is ambiguous.
3. **Cross-topic matches**: "How do AI models learn from data?" -- does it also pull the compound interest doc (both mention "growth")? That's a false positive and shows the limits of pure semantic search.
4. **Score thresholds**: What score reliably indicates "relevant"? You'll likely find 0.4+ is a decent threshold, but this varies by embedding model.

### Performance Reality Check

Your search engine scans every vector for every query. That's O(n) per query. For 15 documents, instant. For 15 million documents:

```
15 documents    → < 1ms    ✓ Fine
15,000 docs     → ~50ms    ✓ Acceptable
150,000 docs    → ~500ms   ⚠ Slow
15,000,000 docs → ~50s     ✗ Unusable
```

This is why vector databases exist. They use approximate nearest neighbor algorithms (HNSW, IVF) that trade a tiny amount of accuracy for massive speed gains -- O(log n) instead of O(n). But the similarity computation itself is identical to what you wrote today.

## Key Insight

This IS the core of vector search. You just built it. Every vector database in production -- Pinecone serving billions of vectors, pgvector in Supabase, Weaviate, Qdrant, Chroma -- performs exactly this operation at its heart. They add indexing structures (HNSW graphs, IVF clusters) to avoid scanning every vector, but the fundamental "compute cosine similarity, sort, take top K" is unchanged. You now understand what's inside the black box.

## Resources

- [Understanding Cosine Similarity (Visual)](https://www.machinelearningplus.com/nlp/cosine-similarity/) -- visual explanation of the math behind similarity.
- [HNSW Algorithm Explained](https://www.pinecone.io/learn/series/faiss/hnsw/) -- how vector databases make search fast (what comes after today's brute-force approach).
- [Billion-scale Similarity Search](https://engineering.fb.com/2017/03/29/data-infrastructure/faiss-a-library-for-efficient-similarity-search/) -- Facebook's FAISS library and the algorithms behind it.

## Done When

- [ ] You've implemented cosine similarity from scratch and can explain the formula
- [ ] You've built a `MiniSearchEngine` class with `addDocuments` and `search` methods
- [ ] You've indexed 15-20 documents across multiple topics
- [ ] You've tested 5+ queries and examined the relevance of results and scores
- [ ] You can explain why this approach doesn't scale and what vector databases do differently

---

*Tomorrow: Your search engine works, but it assumes clean, well-sized chunks. In reality, documents are messy -- some paragraphs are 3 sentences, others are 3 pages. Chunking strategy determines whether your retrieval finds the right content or garbage.*
