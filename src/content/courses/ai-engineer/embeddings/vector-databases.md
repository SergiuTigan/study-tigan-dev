---
title: "Vector Databases"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "embeddings"
moduleTitle: "Embeddings & Vector Search"
moduleDescription: "Understand how embedding models and vector databases enable semantic search and retrieval."
lessonId: "ai-engineer/embeddings/vector-databases"
duration: "10 min"
order: 302
moduleOrder: 3
lessonOrder: 2
color: "purple"
---
# Vector Databases

Vector databases store embeddings and enable fast similarity search over millions or billions of vectors. They are the backbone of RAG systems and semantic search.

## What Vector Databases Do

A vector database:
1. Stores high-dimensional vectors alongside metadata
2. Indexes vectors for fast approximate nearest neighbor (ANN) search
3. Returns the most similar vectors to a query vector

## Popular Vector Databases

```
Database    | Type       | Hosting
────────────|────────────|──────────────
Pinecone    | Managed    | Cloud only
Weaviate    | Open source| Cloud or self-hosted
Qdrant      | Open source| Cloud or self-hosted
Chroma      | Open source| Local or cloud
pgvector    | Extension  | Any PostgreSQL
```

## Using Pinecone

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pinecone.index('my-documents');

// Upsert vectors
await index.upsert([
  {
    id: 'doc-1',
    values: embedding1,
    metadata: { title: 'Angular Signals', source: 'docs' },
  },
  {
    id: 'doc-2',
    values: embedding2,
    metadata: { title: 'React Hooks', source: 'blog' },
  },
]);

// Query for similar vectors
const results = await index.query({
  vector: queryEmbedding,
  topK: 5,
  includeMetadata: true,
});

for (const match of results.matches) {
  console.log(`${match.id}: ${match.score} - ${match.metadata?.title}`);
}
```

## Using pgvector (PostgreSQL)

If you already use PostgreSQL, pgvector is an excellent option:

```sql
-- Enable the extension
CREATE EXTENSION vector;

-- Create a table with a vector column
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536)
);

-- Create an index for fast search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);

-- Query for similar documents
SELECT content, 1 - (embedding <=> query_embedding) AS similarity
FROM documents
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

## Choosing a Vector Database

- **Small scale (<100K vectors):** Chroma (in-memory) or pgvector
- **Medium scale (100K-10M):** Qdrant, Weaviate, or Pinecone
- **Large scale (10M+):** Pinecone or Weaviate with sharding
- **Already using PostgreSQL:** pgvector
