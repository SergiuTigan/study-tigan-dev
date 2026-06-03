---
title: "Document Chunking"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "rag"
moduleTitle: "RAG"
moduleDescription: "Build Retrieval-Augmented Generation systems that ground LLM responses in your data."
lessonId: "ai-engineer/rag/chunking"
duration: "10 min"
order: 402
moduleOrder: 4
lessonOrder: 2
color: "purple"
---
# Document Chunking

Chunking is the process of splitting documents into smaller pieces for embedding and retrieval. The quality of your chunking strategy directly impacts RAG performance.

## Why Chunk?

- Embedding models have maximum input lengths (typically 512-8192 tokens).
- Smaller chunks are more precise for retrieval.
- Larger chunks provide more context but may dilute relevance.

## Fixed-Size Chunking

```typescript
function fixedSizeChunk(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

const chunks = fixedSizeChunk(document, 1000, 200);
// Each chunk is ~1000 chars with 200 chars overlap
```

## Semantic Chunking

Split on natural boundaries (paragraphs, sections, sentences):

```typescript
function semanticChunk(text: string, maxChunkSize: number): string[] {
  const paragraphs = text.split(/\\n\\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += paragraph + '\\n\\n';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
```

## Markdown-Aware Chunking

For documentation and technical content, split on heading boundaries:

```typescript
function markdownChunk(markdown: string): string[] {
  const sections = markdown.split(/(?=^#{1,3} )/m);
  return sections.filter(s => s.trim().length > 0);
}
```

## Chunking Strategies Compared

```
Strategy          | Pros                     | Cons
──────────────────|──────────────────────────|──────────────────────
Fixed-size        | Simple, predictable      | Cuts mid-sentence
Sentence-based    | Natural boundaries       | Sentences vary in size
Paragraph-based   | Semantic coherence       | Paragraphs vary in size
Section-based     | Topic coherence          | Sections can be very large
Recursive         | Adapts to structure      | More complex logic
```

## Best Practices

- Use overlap (10-20% of chunk size) to preserve context at boundaries.
- Store chunk metadata: source document, position, section title.
- Experiment with chunk sizes on your specific data and queries.
- Consider hierarchical chunking: store both summaries and details.
