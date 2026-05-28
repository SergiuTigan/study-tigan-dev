---
title: "Day 25 -- Chunking Strategies"
week: 4
day: 25
phase: 2
phaseLabel: "Deep Dive"
order: 425
type: "day"
---
# Day 25 -- Chunking Strategies

> *"The best embedding model in the world can't save you from bad chunks. Garbage in, garbage out -- and chunking is where the garbage gets made."*

**Date:** Joi, 12 Iunie 2026
**Hours:** 2h · Evening deep-focus block
**Topic:** Document chunking -- strategies, tradeoffs, and implementation
**Phase:** Faza 2 -- Patterns · Week 4

---

## What You're Doing

You can embed text and search it. But what text, exactly? A real document -- a PDF, an article, a knowledge base entry -- can be anywhere from 500 to 500,000 tokens. You can't embed the whole thing as one vector (too coarse, you'd retrieve a 200-page document when you need one paragraph). You can't embed each word individually (too fine, no context). You need to **chunk**: split the document into pieces that are small enough for precise retrieval but large enough to carry meaning.

Today you'll implement three chunking strategies from scratch, understand when each one wins, and learn why overlap and metadata are non-negotiable in production. Bad chunking is the #1 reason RAG systems fail in practice -- not bad models, not bad databases.

## The Work

### Why Chunking Matters

Consider this scenario. Your document says:

> "In Q3 2025, Acme Corp reported revenue of $4.2 billion, representing a 40% year-over-year increase. This growth was primarily driven by the enterprise cloud division, which saw 67% growth. The consumer segment remained flat at $800 million."

If your chunker splits this mid-sentence:

```
Chunk 1: "In Q3 2025, Acme Corp reported revenue of $4.2 billion, representing a 40%"
Chunk 2: "year-over-year increase. This growth was primarily driven by the enterprise"
Chunk 3: "cloud division, which saw 67% growth. The consumer segment remained flat"
```

Now when someone asks "What was Acme's revenue?", Chunk 1 has the number but the sentence is broken. Chunk 2 mentions "this growth" but has no referent. Chunk 3 talks about segments with no company context. **Your embeddings will be noisy, your retrieval will be unreliable, and your answers will be wrong.**

### Strategy 1: Fixed-Size Chunking

The simplest approach. Split every N characters (or tokens) with overlap.

```typescript
interface ChunkOptions {
  chunkSize: number;    // target size in characters
  chunkOverlap: number; // overlap between chunks
}

function fixedSizeChunk(text: string, options: ChunkOptions): string[] {
  const { chunkSize, chunkOverlap } = options;
  const chunks: string[] = [];

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - chunkOverlap;
  }

  return chunks;
}

// Usage
const chunks = fixedSizeChunk(documentText, {
  chunkSize: 1000,   // ~250 tokens
  chunkOverlap: 200, // 20% overlap
});
```

**Pros:** Simple, predictable chunk sizes, easy to reason about.
**Cons:** Splits mid-sentence, mid-word, mid-thought. The dumbest possible approach.
**Use when:** You need a quick baseline or your documents have no natural structure.

### Strategy 2: Recursive Character Splitting

Split on natural boundaries, progressively falling back to smaller separators:

```typescript
function recursiveChunk(
  text: string,
  maxSize: number,
  overlap: number,
  separators: string[] = ["\n\n", "\n", ". ", ", ", " "]
): string[] {
  // If text fits in one chunk, return it
  if (text.length <= maxSize) {
    return [text.trim()].filter((t) => t.length > 0);
  }

  // Try each separator, from coarsest to finest
  for (const separator of separators) {
    const parts = text.split(separator);

    if (parts.length === 1) continue; // This separator didn't split anything

    const chunks: string[] = [];
    let currentChunk = "";

    for (const part of parts) {
      const candidate = currentChunk
        ? currentChunk + separator + part
        : part;

      if (candidate.length > maxSize && currentChunk) {
        chunks.push(currentChunk.trim());

        // Start new chunk with overlap from end of previous
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + separator + part;
      } else {
        currentChunk = candidate;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // If we got reasonable chunks, return them
    if (chunks.length > 1) {
      return chunks;
    }
  }

  // Fallback: fixed-size split
  return fixedSizeChunk(text, { chunkSize: maxSize, chunkOverlap: overlap });
}
```

**How it works:**
1. Try splitting on `\n\n` (paragraph breaks) -- ideal, preserves complete paragraphs
2. If paragraphs are too long, try `\n` (line breaks)
3. Then `. ` (sentence boundaries)
4. Then `, ` (clause boundaries)
5. Last resort: split on spaces (word boundaries)

**Pros:** Respects natural document structure. Sentences stay intact.
**Cons:** Inconsistent chunk sizes. Some chunks might be tiny.
**Use when:** Most production use cases. This is your default strategy.

### Strategy 3: Semantic Chunking

Split when the *meaning* changes, not just when the text is long enough:

```typescript
async function semanticChunk(
  text: string,
  embedder: EmbeddingProvider,
  similarityThreshold: number = 0.75,
  maxChunkSize: number = 1500
): Promise<string[]> {
  // Step 1: Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  // Step 2: Embed each sentence
  const embeddings = await embedder.embedDocuments(sentences);

  // Step 3: Find topic boundaries (where similarity drops)
  const chunks: string[] = [];
  let currentChunk = sentences[0];

  for (let i = 1; i < sentences.length; i++) {
    const similarity = cosineSimilarity(embeddings[i - 1], embeddings[i]);

    const wouldExceedSize = (currentChunk + sentences[i]).length > maxChunkSize;
    const topicChanged = similarity < similarityThreshold;

    if (topicChanged || wouldExceedSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentences[i];
    } else {
      currentChunk += " " + sentences[i];
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
```

**How it works:** Embed each sentence, then compare consecutive sentences. When similarity drops below a threshold, that's a topic boundary -- start a new chunk.

**Pros:** Chunks align with actual topic boundaries. Highest quality retrieval.
**Cons:** Requires embedding every sentence (expensive for large documents). Slower. More complex.
**Use when:** High-value documents where retrieval quality is critical. Not for bulk ingestion of thousands of docs.

### Overlap: The Non-Negotiable

Always include overlap between chunks. Without it, information at chunk boundaries is lost:

```
Without overlap:
[........chunk 1........][........chunk 2........]
                         ^ Information here gets split

With 20% overlap:
[........chunk 1........]
                [........chunk 2........]
                ^^^^^^^^^ This text appears in BOTH chunks
```

**Rule of thumb:** 10-20% overlap. For a 1000-character chunk, use 100-200 characters of overlap.

### Metadata: What Your Chunks Need to Carry

A chunk without metadata is a homeless paragraph. Always attach:

```typescript
interface Chunk {
  text: string;         // The chunk content
  metadata: {
    source: string;     // "annual-report-2025.pdf"
    page?: number;      // Page 14
    section?: string;   // "Financial Results > Q3 Revenue"
    chunkIndex: number; // 7 of 42
    totalChunks: number;
    charStart: number;  // Character offset in original
    charEnd: number;
  };
}
```

This metadata powers:
- **Citations** -- "According to page 14 of the annual report..."
- **Filtering** -- "Only search in the Financial Results section"
- **Context reconstruction** -- retrieve surrounding chunks when needed
- **Debugging** -- when retrieval fails, trace back to the source

### Comparison Exercise

Take a 2-3 page document (any Wikipedia article works) and chunk it with all three strategies. Compare:

```typescript
const doc = fs.readFileSync("sample-article.txt", "utf-8");

console.log("=== Fixed Size ===");
const fixed = fixedSizeChunk(doc, { chunkSize: 800, chunkOverlap: 100 });
fixed.forEach((c, i) => console.log(`Chunk ${i} (${c.length} chars): ${c.slice(0, 60)}...`));

console.log("\n=== Recursive ===");
const recursive = recursiveChunk(doc, 800, 100);
recursive.forEach((c, i) => console.log(`Chunk ${i} (${c.length} chars): ${c.slice(0, 60)}...`));

console.log("\n=== Semantic ===");
const semantic = await semanticChunk(doc, embedder, 0.75, 800);
semantic.forEach((c, i) => console.log(`Chunk ${i} (${c.length} chars): ${c.slice(0, 60)}...`));
```

Look at the chunk boundaries. Which strategy produces the most coherent, self-contained chunks?

## Key Insight

Chunking is the most underappreciated step in RAG. Most tutorials skip over it with "just use LangChain's text splitter" and then wonder why retrieval is bad. The truth is: **the quality ceiling of your RAG system is set by your chunking strategy**. The best embedding model and the fanciest vector database cannot retrieve information that was destroyed during chunking. Spend more time on chunking than on any other component.

## Resources

- [Chunking Strategies for LLM Applications (Pinecone)](https://www.pinecone.io/learn/chunking-strategies/) -- comprehensive overview with visual examples.
- [LangChain Text Splitters Source Code](https://github.com/langchain-ai/langchainjs/tree/main/langchain/src/text_splitter.ts) -- see how the most popular framework implements splitting.
- [Five Levels of Chunking (Greg Kamradt)](https://www.youtube.com/watch?v=8OJC21T2SL4) -- excellent video walking through progressive chunking sophistication.

## Done When

- [ ] You've implemented all three chunking strategies (fixed, recursive, semantic)
- [ ] You've chunked a real document with each and compared the results
- [ ] You understand why overlap is necessary and can explain the tradeoff
- [ ] You're attaching metadata (source, page, section, index) to every chunk
- [ ] You've chosen recursive splitting as your default and can explain why

---

*Saturday: Your chunks need a permanent home. You'll set up Supabase with pgvector -- a real vector database that handles similarity search at scale with SQL you already know.*
