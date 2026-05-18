# Day 27 -- Vector Database (Supabase pgvector)

> *"PostgreSQL has been storing your data for 28 years. Now it stores your vectors too. pgvector means you don't need a separate database for AI."*

**Date:** Sambata, 14 Iunie 2026
**Hours:** 3h · Morning deep-work block
**Topic:** Supabase + pgvector -- persistent vector storage and search
**Phase:** Faza 2 -- Patterns · Week 4

---

## What You're Doing

Your mini search engine from Day 24 stores vectors in memory. Restart the process, and everything is gone. For 100 documents this is fine. For 10,000+, you need persistence, indexing, and the ability to filter by metadata. Today you set up a real vector database using **Supabase** and its **pgvector** extension -- PostgreSQL with vector superpowers.

Why Supabase and not Pinecone or Weaviate? Three reasons: (1) you already know SQL, (2) your vectors live alongside your regular data in one database, and (3) it's free to start and production-grade at scale. Supabase is what most startups and indie developers use for RAG in production.

## The Work

### Setup: Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key (Settings > API)
3. Open the SQL Editor (left sidebar)

### Step 1: Enable pgvector and Create the Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the documents table
CREATE TABLE documents (
  id          BIGSERIAL PRIMARY KEY,
  content     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  embedding   VECTOR(1024),          -- 1024 dimensions for Voyage AI
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for fast similarity search
-- IVF (Inverted File) index -- good for 10K-1M vectors
CREATE INDEX ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
  -- Rule of thumb: lists = sqrt(num_rows)
  -- 100 lists works well for up to ~100K documents

-- Create an index on metadata for filtered queries
CREATE INDEX idx_documents_metadata ON documents USING gin (metadata);
```

**Why VECTOR(1024)?** Voyage AI's `voyage-3` outputs 1024-dimensional vectors. If you use OpenAI's `text-embedding-3-small`, change this to `VECTOR(1536)`.

**Why IVF index?** Without an index, pgvector scans every row (exact search). The IVF index partitions vectors into clusters and only searches nearby clusters. Faster but approximate -- typically 95-99% recall.

### Step 2: Create the Search Function

Create an RPC (Remote Procedure Call) function that Supabase clients can call:

```sql
-- Similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE
    -- Apply metadata filter if provided
    CASE
      WHEN filter = '{}'::JSONB THEN TRUE
      ELSE d.metadata @> filter
    END
    -- Apply similarity threshold
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding  -- <=> is cosine distance
  LIMIT match_count;
END;
$$;
```

**Key detail:** The `<=>` operator computes cosine *distance* (lower = more similar). We convert to similarity with `1 - distance` so higher scores = more relevant.

### Step 3: TypeScript Client -- Insert Documents

```typescript
// Install: npm install @supabase/supabase-js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface DocumentRow {
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

async function insertDocuments(
  chunks: { text: string; metadata: Record<string, unknown> }[],
  embeddings: number[][]
): Promise<void> {
  // Prepare rows
  const rows: DocumentRow[] = chunks.map((chunk, i) => ({
    content: chunk.text,
    metadata: chunk.metadata,
    embedding: embeddings[i],
  }));

  // Insert in batches of 100 (Supabase has payload limits)
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from("documents")
      .insert(batch);

    if (error) {
      throw new Error(`Insert failed at batch ${i}: ${error.message}`);
    }

    console.log(`Inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
}
```

### Step 4: TypeScript Client -- Similarity Search

```typescript
interface SearchResult {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

async function searchDocuments(
  queryEmbedding: number[],
  options: {
    topK?: number;
    threshold?: number;
    filter?: Record<string, unknown>;
  } = {}
): Promise<SearchResult[]> {
  const { topK = 5, threshold = 0.5, filter = {} } = options;

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    filter: filter,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return data as SearchResult[];
}

// Usage
const queryVector = await embedder.embedQuery("What was Q3 revenue?");
const results = await searchDocuments(queryVector, {
  topK: 5,
  threshold: 0.4,
  filter: { source: "annual-report-2025.pdf" },  // Optional: filter by source
});

for (const result of results) {
  console.log(`[${result.similarity.toFixed(3)}] ${result.content.slice(0, 100)}...`);
  console.log(`  Source: ${result.metadata.source}, Page: ${result.metadata.page}`);
}
```

### Step 5: Putting It All Together

Build a complete VectorStore class that wraps everything:

```typescript
class SupabaseVectorStore {
  private supabase;
  private embedder: EmbeddingProvider;

  constructor(supabaseUrl: string, supabaseKey: string, embedder: EmbeddingProvider) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.embedder = embedder;
  }

  async ingest(
    chunks: { text: string; metadata: Record<string, unknown> }[]
  ): Promise<void> {
    console.log(`Embedding ${chunks.length} chunks...`);
    const embeddings = await this.embedder.embedDocuments(
      chunks.map((c) => c.text)
    );

    console.log(`Inserting into Supabase...`);
    await insertDocuments(chunks, embeddings);

    console.log(`Done. ${chunks.length} chunks stored.`);
  }

  async search(
    query: string,
    topK: number = 5,
    filter?: Record<string, unknown>
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.embedder.embedQuery(query);
    return searchDocuments(queryEmbedding, { topK, filter });
  }
}

// Usage
const store = new SupabaseVectorStore(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  new VoyageProvider(process.env.VOYAGE_API_KEY!)
);

// Ingest
await store.ingest([
  { text: "Q3 revenue was $4.2B, up 40% YoY", metadata: { source: "report.pdf", page: 5 } },
  { text: "The cloud division grew 67%", metadata: { source: "report.pdf", page: 5 } },
  // ... more chunks
]);

// Search
const results = await store.search("What was the revenue?");
```

### Alternative: Pinecone

If you prefer a managed vector database with simpler setup:

```typescript
// npm install @pinecone-database/pinecone
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pinecone.index("my-rag-index");

// Upsert
await index.upsert([
  { id: "doc-1", values: embedding, metadata: { source: "report.pdf" } },
]);

// Query
const results = await index.query({
  vector: queryEmbedding,
  topK: 5,
  includeMetadata: true,
});
```

Pinecone is simpler but gives you less control. Supabase lets you join vector search with regular SQL queries -- powerful when your app already uses a relational database.

### Exercise: Migrate Your Mini Search Engine

Take the 15-20 documents from Day 24 and move them to Supabase:

1. Create the table and function (SQL above)
2. Embed and insert all documents
3. Run the same 5 queries from Day 24
4. Compare results -- they should be nearly identical to the in-memory version
5. Try metadata filtering -- search only within a specific topic

## Key Insight

pgvector turns PostgreSQL into a vector database. This matters because in real applications, your AI data (embeddings, chunks) lives alongside your regular data (users, settings, billing). One database, one deployment, one backup strategy. You don't need a separate Pinecone cluster for vectors and a separate PostgreSQL instance for everything else. The simplest architecture is almost always the best architecture.

## Resources

- [Supabase AI & Vectors Guide](https://supabase.com/docs/guides/ai) -- official documentation for pgvector in Supabase.
- [pgvector GitHub](https://github.com/pgvector/pgvector) -- the extension itself. Read the README for supported distance functions and index types.
- [Supabase Vector Columns](https://supabase.com/docs/guides/ai/vector-columns) -- detailed guide on creating and querying vector columns.
- [IVFFlat vs HNSW Indexes](https://supabase.com/docs/guides/ai/vector-indexes) -- when to use which index type.

## Done When

- [ ] You have a Supabase project with pgvector enabled
- [ ] Your `documents` table is created with a vector column and IVF index
- [ ] The `match_documents` RPC function is deployed and working
- [ ] You can insert documents with embeddings from TypeScript
- [ ] You can perform similarity search via `supabase.rpc` and get ranked results
- [ ] You've tested metadata filtering (e.g., search only docs from a specific source)

---

*Tomorrow: The grand finale. You'll connect PDF loading, chunking, embedding, storage, retrieval, and generation into a complete RAG system. Everything you've built this week comes together.*
