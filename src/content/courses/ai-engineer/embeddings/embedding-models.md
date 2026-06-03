---
title: "Embedding Models"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "embeddings"
moduleTitle: "Embeddings & Vector Search"
moduleDescription: "Understand how embedding models and vector databases enable semantic search and retrieval."
lessonId: "ai-engineer/embeddings/embedding-models"
duration: "10 min"
order: 301
moduleOrder: 3
lessonOrder: 1
color: "purple"
---
# Embedding Models

Embedding models convert text (or other data) into dense numerical vectors. These vectors capture semantic meaning, enabling similarity search, clustering, and classification.

## What Are Embeddings?

An embedding is a fixed-size array of floating-point numbers that represents the meaning of a piece of text:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Angular is a web framework',
});

const vector = response.data[0].embedding;
// [0.0123, -0.0456, 0.0789, ...] -- 1536 dimensions
```

## Semantic Similarity

Texts with similar meanings produce vectors that are close together in the embedding space:

```
"Angular is a web framework"     → [0.12, -0.45, 0.78, ...]
"React is a UI library"          → [0.11, -0.42, 0.75, ...]  ← Similar!
"The weather is sunny today"     → [-0.89, 0.23, -0.15, ...]  ← Different!
```

## Available Embedding Models

```
Model                      | Dimensions | Cost (per 1M tokens)
───────────────────────────|────────────|────────────────────
OpenAI text-embedding-3-small | 1536    | $0.02
OpenAI text-embedding-3-large | 3072    | $0.13
Cohere embed-v4            | 1024       | $0.10
Voyage voyage-3            | 1024       | $0.06
```

## Batching Embeddings

```typescript
// Embed multiple texts in a single API call
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: [
    'First document text',
    'Second document text',
    'Third document text',
  ],
});

const vectors = response.data.map(d => d.embedding);
```

## Key Concepts

- **Dimensions:** The length of the vector. More dimensions capture more nuance but use more storage and compute.
- **Normalization:** Most models produce normalized vectors (length 1), enabling cosine similarity via dot product.
- **Chunking:** Long documents must be split into chunks before embedding. Typical chunk sizes range from 256 to 1024 tokens.
- **Model choice matters:** The embedding model determines the quality of your search. Choose one and stick with it -- you cannot mix embeddings from different models.
