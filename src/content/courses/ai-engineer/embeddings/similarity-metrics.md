---
title: "Similarity & Distance Metrics"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "embeddings"
moduleTitle: "Embeddings & Vector Search"
moduleDescription: "Understand how embedding models and vector databases enable semantic search and retrieval."
lessonId: "ai-engineer/embeddings/similarity-metrics"
duration: "8 min"
order: 304
moduleOrder: 3
lessonOrder: 4
color: "purple"
---
# Similarity & Distance Metrics

Choosing the right similarity metric affects search quality and performance. This lesson covers the three main metrics and when to use each.

## Cosine Similarity

Measures the angle between two vectors, ignoring magnitude. Most commonly used for text embeddings.

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// For normalized vectors (length = 1), cosine similarity = dot product
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}
```

**Range:** -1 (opposite) to 1 (identical). For most embedding models, values are between 0 and 1.

## Euclidean Distance (L2)

Measures the straight-line distance between two points. Smaller values mean more similar.

```typescript
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}
```

**Range:** 0 (identical) to infinity. Use when magnitude matters.

## Manhattan Distance (L1)

Sum of absolute differences. More robust to outliers than Euclidean.

```typescript
function manhattanDistance(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
}
```

## Which Metric to Use?

```
Use Case                      | Metric
──────────────────────────────|────────────────
Text embeddings (normalized)  | Cosine similarity (or dot product)
Image embeddings              | Cosine similarity
Geospatial data               | Euclidean distance
Sparse features               | Manhattan distance
```

## Performance Tip

Most embedding models produce normalized vectors. When vectors are normalized, cosine similarity equals the dot product, which is computationally cheaper (no square root needed). Always check if your embedding model normalizes its output.

```typescript
// Check if a vector is normalized
function isNormalized(v: number[], tolerance = 1e-6): boolean {
  const magnitude = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
  return Math.abs(magnitude - 1.0) < tolerance;
}
```
