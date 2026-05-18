# Day 23 -- Embeddings

> *"An embedding is a lie that tells the truth. It compresses infinite meaning into a fixed-size vector -- and somehow, similar meanings end up near each other."*

**Date:** Marti, 10 Iunie 2026
**Hours:** 2h · Evening deep-focus block
**Topic:** Text embeddings -- theory, providers, and hands-on code
**Phase:** Faza 2 -- Patterns · Week 4

---

## What You're Doing

Yesterday you learned the RAG pipeline. Today you zoom into the most fundamental piece: **embeddings**. An embedding model takes a string of text -- a sentence, a paragraph, a chunk of a document -- and converts it into a fixed-length array of floating-point numbers. These numbers encode *meaning* in a way that similar texts produce similar arrays. This is the magic that makes semantic search possible.

You'll understand how embeddings work conceptually, then write real code using two providers: **Voyage AI** (Anthropic-recommended, purpose-built for retrieval) and **OpenAI** (widely used, good baseline). By the end of the session, you'll have a working function that turns any text into a vector, and you'll understand both the power and the limitations of that transformation.

## The Work

### What Is an Embedding?

Think of it this way. You have two sentences:

- "The cat sat on the mat"
- "A feline rested on the rug"

These share almost no words, but they mean nearly the same thing. An embedding model captures this:

```
"The cat sat on the mat"       → [0.023, -0.451, 0.892, ..., 0.114]   // 1024 numbers
"A feline rested on the rug"   → [0.019, -0.447, 0.889, ..., 0.121]   // very similar!
"Stock prices fell sharply"    → [-0.891, 0.234, -0.012, ..., 0.773]  // very different
```

Each number represents some learned dimension of meaning. We don't pick what each dimension means -- the model learns them during training on massive text corpora. But the result is that **semantic similarity becomes geometric proximity**.

### Embedding Providers

Two providers you should know:

| Provider | Model | Dimensions | Best For | Cost |
|----------|-------|------------|----------|------|
| Voyage AI | `voyage-3` | 1024 | Retrieval, RAG (Anthropic-recommended) | ~$0.06 / 1M tokens |
| OpenAI | `text-embedding-3-small` | 1536 | General purpose, wide ecosystem | ~$0.02 / 1M tokens |

Voyage AI is specifically optimized for retrieval tasks and is the model Anthropic recommends for RAG. OpenAI's model is cheaper and has broader ecosystem support. Both work well.

### Code: Voyage AI Embeddings

```typescript
// Install: npm install voyageai
import VoyageAI from "voyageai";

const voyage = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY });

async function embedWithVoyage(texts: string[]): Promise<number[][]> {
  const response = await voyage.embed({
    input: texts,
    model: "voyage-3",
    inputType: "document",  // Use "query" for search queries
  });

  return response.data.map((item) => item.embedding);
}

// Usage
const documentEmbeddings = await embedWithVoyage([
  "The quarterly revenue exceeded expectations at $4.2B",
  "Machine learning models require significant computational resources",
]);

const queryEmbedding = await voyage.embed({
  input: ["What was the revenue?"],
  model: "voyage-3",
  inputType: "query",  // Different input type for queries!
});

console.log(`Vector dimensions: ${documentEmbeddings[0].length}`); // 1024
```

Note the `inputType` parameter. Voyage AI uses different encodings for documents vs queries. Always use `"document"` during ingestion and `"query"` during search. This asymmetry improves retrieval quality.

### Code: OpenAI Embeddings

```typescript
// Install: npm install openai
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embedWithOpenAI(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    input: texts,
    model: "text-embedding-3-small",
  });

  return response.data.map((item) => item.embedding);
}

// Usage
const embeddings = await embedWithOpenAI([
  "The quarterly revenue exceeded expectations at $4.2B",
  "Machine learning models require significant computational resources",
]);

console.log(`Vector dimensions: ${embeddings[0].length}`); // 1536
```

### Building a Reusable Embedding Module

In practice, you want a provider-agnostic interface:

```typescript
// embeddings.ts
interface EmbeddingProvider {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(query: string): Promise<number[]>;
  dimensions: number;
}

class VoyageProvider implements EmbeddingProvider {
  dimensions = 1024;
  private client: VoyageAI;

  constructor(apiKey: string) {
    this.client = new VoyageAI({ apiKey });
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    // Voyage has a batch limit -- process in chunks of 128
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += 128) {
      const batch = texts.slice(i, i + 128);
      const response = await this.client.embed({
        input: batch,
        model: "voyage-3",
        inputType: "document",
      });
      results.push(...response.data.map((d) => d.embedding));
    }
    return results;
  }

  async embedQuery(query: string): Promise<number[]> {
    const response = await this.client.embed({
      input: [query],
      model: "voyage-3",
      inputType: "query",
    });
    return response.data[0].embedding;
  }
}

// Swap providers without changing any other code
const embedder: EmbeddingProvider = new VoyageProvider(process.env.VOYAGE_API_KEY!);
```

### Exercise: Explore Embedding Behavior

Write a small script that embeds 6-8 sentences and prints pairwise similarity (you'll build cosine similarity tomorrow, but here's a quick version):

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const sentences = [
  "The cat sat on the mat",
  "A feline rested on the rug",
  "Stock prices fell sharply today",
  "The market experienced a significant decline",
  "I went to the bank to deposit money",
  "The river bank was covered in wildflowers",
];

const vectors = await embedder.embedDocuments(sentences);

// Print similarity matrix
for (let i = 0; i < sentences.length; i++) {
  for (let j = i + 1; j < sentences.length; j++) {
    const sim = cosineSimilarity(vectors[i], vectors[j]);
    console.log(`${sim.toFixed(3)} | "${sentences[i]}" ↔ "${sentences[j]}"`);
  }
}
```

Run this. Look at the scores. The cat/feline pair should score high (~0.85+). The stock/market pair too. But "bank" (financial) vs "bank" (river) -- what happens?

## Key Insight

Embeddings are powerful but **not perfect**. They encode semantic similarity based on training data patterns, which means they struggle with: (1) **polysemy** -- "bank" the institution vs "bank" the riverbank produce similar vectors because the word is the same, (2) **negation** -- "the system is reliable" and "the system is not reliable" can be closer than you'd expect, and (3) **specificity** -- exact terms like error codes, version numbers, and proper nouns aren't well-captured semantically. These limitations are exactly why Week 5 introduces hybrid search (combining semantic search with keyword matching).

## Resources

- [Voyage AI Embeddings Docs](https://docs.voyageai.com/docs/embeddings) -- API reference for the Anthropic-recommended embedding model.
- [What Are Embeddings? (Vicki Boykis)](https://vickiboykis.com/what_are_embeddings/) -- the best long-form explanation of embeddings from first principles. Bookmark this.
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings) -- reference for OpenAI's embedding models and best practices.

## Done When

- [ ] You can explain what an embedding is and why similar texts produce similar vectors
- [ ] You've written working code that calls Voyage AI or OpenAI embeddings API
- [ ] You've embedded 6+ sentences and examined the pairwise similarity scores
- [ ] You've observed the "bank" polysemy problem and can explain why it happens
- [ ] You have a reusable `EmbeddingProvider` interface you'll use all week

---

*Tomorrow: Now that you can turn text into vectors, you'll build a complete similarity search from scratch. No libraries -- just math. Cosine similarity, dot products, and your first mini search engine.*
