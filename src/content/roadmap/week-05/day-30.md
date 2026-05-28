---
title: "Day 30 -- Hybrid Search (Vector + BM25)"
week: 5
day: 30
phase: 2
phaseLabel: "Deep Dive"
order: 530
type: "day"
---
# Day 30 -- Hybrid Search (Vector + BM25)

> *"Vector search finds meaning. Keyword search finds words. Production systems need both, because users search with both."*

**Date:** Marti, 17 Iunie 2026
**Hours:** 2h · Evening deep-focus block
**Topic:** Hybrid search -- combining semantic and lexical retrieval
**Phase:** Faza 2 -- Patterns · Week 5

---

## What You're Doing

Yesterday you improved chunk quality with contextual retrieval. Today you improve *search* quality by combining two fundamentally different approaches: **vector search** (what you've been building) and **keyword search** (BM25, the algorithm behind every search engine since the 1990s).

Here's the problem: a user asks "What does error ERR_CONN_REFUSED mean?" Your vector search looks for semantically similar text about connection errors. But the most relevant chunk might just contain the exact string "ERR_CONN_REFUSED" with no semantic overlap to "connection errors." Vector search misses it. Keyword search finds it instantly. The reverse happens too -- "How do I handle network failures?" has no keyword overlap with a chunk about "retry logic for dropped connections." Vector search nails it. Keyword search misses it. Hybrid search catches both.

## The Work

### Why Vector Search Alone Isn't Enough

Vector search excels at:
- Semantic similarity ("car" matches "automobile")
- Paraphrased questions
- Conceptual queries ("How does authentication work?")

Vector search struggles with:
- **Exact terms**: error codes (ERR_CONN_REFUSED), version numbers (v3.2.1), UUIDs
- **Proper nouns**: specific product names, person names, acronyms
- **Rare technical terms**: terms the embedding model hasn't seen enough of
- **Short, keyword-heavy queries**: "python pandas groupby" (the user knows what they want)

### BM25: The Other Half

BM25 (Best Match 25) is a probabilistic ranking function. It's what Google, Elasticsearch, and every traditional search engine uses. The core idea: a document is relevant if it contains the query terms, with bonus points for:

1. **Term frequency**: More occurrences of the query term = more relevant
2. **Inverse document frequency**: Rare terms matter more than common ones ("ERR_CONN_REFUSED" is more informative than "the")
3. **Document length normalization**: Short documents with the term are more focused than long ones

### Hybrid Search Formula

```
Score_final = alpha * Score_vector + (1 - alpha) * Score_BM25
```

Where `alpha` is typically 0.5-0.7 (vector search usually gets slightly more weight because it handles the more common case of semantic queries).

### Option A: Supabase Full-Text Search (Recommended)

Supabase's PostgreSQL already has powerful full-text search built in. Add it alongside your vector search:

```sql
-- Add a tsvector column for full-text search
ALTER TABLE documents ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create a GIN index for fast full-text queries
CREATE INDEX idx_documents_fts ON documents USING gin (fts);
```

Now create a hybrid search function:

```sql
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding VECTOR(1024),
  match_count INT DEFAULT 10,
  vector_weight FLOAT DEFAULT 0.6,
  text_weight FLOAT DEFAULT 0.4,
  rrf_k INT DEFAULT 60  -- RRF constant
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  vector_score FLOAT,
  text_score FLOAT,
  combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      d.id,
      d.content,
      d.metadata,
      1 - (d.embedding <=> query_embedding) AS score,
      ROW_NUMBER() OVER (ORDER BY d.embedding <=> query_embedding) AS rank
    FROM documents d
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count * 2  -- Get extra candidates for merging
  ),
  text_results AS (
    SELECT
      d.id,
      d.content,
      d.metadata,
      ts_rank_cd(d.fts, websearch_to_tsquery('english', query_text)) AS score,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(d.fts, websearch_to_tsquery('english', query_text)) DESC
      ) AS rank
    FROM documents d
    WHERE d.fts @@ websearch_to_tsquery('english', query_text)
    LIMIT match_count * 2
  ),
  -- Reciprocal Rank Fusion (RRF) to combine rankings
  combined AS (
    SELECT
      COALESCE(v.id, t.id) AS id,
      COALESCE(v.content, t.content) AS content,
      COALESCE(v.metadata, t.metadata) AS metadata,
      COALESCE(v.score, 0) AS vector_score,
      COALESCE(t.score, 0) AS text_score,
      -- RRF formula: sum of 1/(k + rank) for each ranking
      COALESCE(vector_weight / (rrf_k + v.rank), 0) +
      COALESCE(text_weight / (rrf_k + t.rank), 0) AS combined_score
    FROM vector_results v
    FULL OUTER JOIN text_results t ON v.id = t.id
  )
  SELECT
    c.id,
    c.content,
    c.metadata,
    c.vector_score,
    c.text_score,
    c.combined_score
  FROM combined c
  ORDER BY c.combined_score DESC
  LIMIT match_count;
END;
$$;
```

### Understanding Reciprocal Rank Fusion (RRF)

RRF is the standard way to merge two ranked lists. Instead of trying to normalize raw scores (which have different scales), it uses rank positions:

```
RRF_score(doc) = weight_1 / (k + rank_in_list_1) + weight_2 / (k + rank_in_list_2)
```

Where `k` is a constant (typically 60) that prevents any single high rank from dominating. A document ranked #1 in both lists gets the highest combined score. A document ranked #1 in vector but absent from keyword still gets a decent score.

### TypeScript: Calling Hybrid Search

```typescript
interface HybridSearchResult {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  vectorScore: number;
  textScore: number;
  combinedScore: number;
}

async function hybridSearch(
  query: string,
  queryEmbedding: number[],
  options: {
    topK?: number;
    vectorWeight?: number;
    textWeight?: number;
  } = {}
): Promise<HybridSearchResult[]> {
  const { topK = 10, vectorWeight = 0.6, textWeight = 0.4 } = options;

  const { data, error } = await supabase.rpc("hybrid_search", {
    query_text: query,
    query_embedding: queryEmbedding,
    match_count: topK,
    vector_weight: vectorWeight,
    text_weight: textWeight,
  });

  if (error) throw new Error(`Hybrid search failed: ${error.message}`);

  return (data as any[]).map((row) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata,
    vectorScore: row.vector_score,
    textScore: row.text_score,
    combinedScore: row.combined_score,
  }));
}

// Usage
const queryEmb = await embedder.embedQuery("error ERR_CONN_REFUSED");
const results = await hybridSearch("error ERR_CONN_REFUSED", queryEmb, {
  topK: 10,
  vectorWeight: 0.6,
  textWeight: 0.4,
});
```

### Option B: In-Memory BM25 with wink

If you want BM25 without relying on PostgreSQL full-text search:

```typescript
// npm install wink-bm25-text-search wink-nlp-utils
import bm25 from "wink-bm25-text-search";
import nlp from "wink-nlp-utils";

class BM25Search {
  private engine = bm25();

  constructor() {
    // Configure text processing pipeline
    this.engine.defineConfig({
      fldWeights: { content: 1 },
      bm25Params: { k1: 1.2, b: 0.75 },
    });

    this.engine.definePrepTasks([
      nlp.string.lowerCase,
      nlp.string.tokenize0,
      nlp.tokens.removeWords,
      nlp.tokens.stem,
    ]);
  }

  addDocuments(docs: { id: string; content: string }[]): void {
    docs.forEach((doc) => {
      this.engine.addDoc({ content: doc.content }, doc.id);
    });
    this.engine.consolidate(); // Build the index
  }

  search(query: string, topK: number = 10): { id: string; score: number }[] {
    const results = this.engine.search(query, topK);
    return results.map(([id, score]: [string, number]) => ({ id, score }));
  }
}
```

### Merge Strategies Comparison

Three ways to combine vector and keyword results:

| Strategy | How | When |
|----------|-----|------|
| **RRF (Reciprocal Rank Fusion)** | Combine rank positions | Default choice. Robust, no score normalization needed. |
| **Linear Combination** | `alpha * vec + (1-alpha) * bm25` | When you can normalize scores to the same scale. |
| **Cascading** | BM25 first to filter, then vector to rank | When you have millions of docs and need to reduce the candidate set. |

### Testing: Where Hybrid Beats Vector-Only

Create test cases that specifically stress each approach:

```typescript
const testCases = [
  // Keyword-heavy: BM25 wins
  { query: "ERR_CONN_REFUSED", expectKeywordHelp: true },
  { query: "version 3.2.1 changelog", expectKeywordHelp: true },

  // Semantic: vector wins
  { query: "how to handle network failures gracefully", expectVectorHelp: true },
  { query: "best practices for error handling", expectVectorHelp: true },

  // Both help
  { query: "Python pandas groupby aggregation examples", expectBothHelp: true },
];

for (const test of testCases) {
  const vectorOnly = await store.search(test.query, 5);
  const hybrid = await hybridSearch(test.query, await embedder.embedQuery(test.query));

  console.log(`Query: "${test.query}"`);
  console.log(`Vector-only top result: ${vectorOnly[0]?.content.slice(0, 60)}...`);
  console.log(`Hybrid top result: ${hybrid[0]?.content.slice(0, 60)}...`);
  console.log("---");
}
```

## Key Insight

Hybrid search isn't about one approach being better than the other. It's about the failure modes being **different**. Vector search fails on exact terms; keyword search fails on paraphrases. By combining them, you cover each other's blind spots. In Anthropic's benchmarks, adding BM25 to vector search improved retrieval by 13% -- and when combined with contextual retrieval, the total improvement was 49% over naive RAG. Those aren't marginal gains; they're the difference between a demo and a product.

## Resources

- [Supabase Full-Text Search](https://supabase.com/docs/guides/database/full-text-search) -- PostgreSQL full-text search documentation for Supabase.
- [wink-bm25-text-search (npm)](https://www.npmjs.com/package/wink-bm25-text-search) -- in-memory BM25 implementation for Node.js.
- [Reciprocal Rank Fusion Explained](https://www.elastic.co/guide/en/elasticsearch/reference/current/rrf.html) -- Elasticsearch's explanation of RRF.
- [Contextual Retrieval (Anthropic)](https://www.anthropic.com/news/contextual-retrieval) -- revisit for the hybrid search benchmarks.

## Done When

- [ ] You can explain why vector search alone misses exact-match queries
- [ ] You've added a tsvector column and GIN index to your Supabase table
- [ ] Your `hybrid_search` SQL function uses RRF to combine vector and text results
- [ ] You can call hybrid search from TypeScript and get combined scores
- [ ] You've tested queries where hybrid beats vector-only and can explain why

---

*Tomorrow: You have 20 candidates from hybrid search. But stuffing all 20 into the prompt wastes tokens and dilutes the answer. Reranking picks the best 5 using a model that sees query and document TOGETHER.*
