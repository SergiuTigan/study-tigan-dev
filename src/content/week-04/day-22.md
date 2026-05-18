# Day 22 -- RAG Mental Model

> *"RAG isn't a technology. It's a pattern: find relevant stuff, show it to the AI, let the AI answer. Everything else is optimization."*

**Date:** Luni, 9 Iunie 2026
**Hours:** 2h · Evening deep-focus block
**Topic:** Retrieval-Augmented Generation -- the mental model
**Phase:** Faza 2 -- Patterns · Week 4

---

## What You're Doing

Today you stop building and start understanding. RAG (Retrieval-Augmented Generation) is the most deployed AI pattern in production, and before you write a single line of retrieval code, you need a crystal-clear mental model of what it does, why it exists, and when to use something else instead.

The core idea fits in one sentence: **find relevant documents, stuff them into the prompt, let Claude answer using YOUR data.** That's it. No fine-tuning, no model modification, no retraining. You're just being very strategic about what goes into the context window. The complexity comes from doing this reliably at scale -- which is what the rest of this week and next week are about.

## The Work

### Why RAG Exists

Claude's knowledge has a cutoff date. It doesn't know about your company's internal docs, last month's board meeting, or the API spec you wrote yesterday. You have three options:

1. **Paste it into the prompt** -- works for small, static content. Doesn't scale.
2. **Fine-tune the model** -- changes behavior/style, but doesn't reliably add factual knowledge. Expensive.
3. **RAG** -- dynamically retrieves relevant documents at query time and includes them in the prompt.

RAG wins for most knowledge-grounding use cases because it's dynamic (new docs = immediate availability), auditable (you can see what was retrieved), and doesn't require model changes.

### When NOT to Use RAG

RAG isn't always the answer. Here's your decision framework:

```
Decision Tree:

  How much data?
  ├── Small (< 50 pages) → Just paste it in the prompt (long context)
  ├── Static & behavioral → Fine-tuning (style/format changes)
  └── Large, dynamic, factual → RAG ✓

  Is exact retrieval critical?
  ├── Yes (legal, medical, compliance) → RAG + citations + human review
  └── Approximate is fine → RAG with simpler pipeline
```

Read the Contextual Retrieval paper from Anthropic -- it's the single best resource for understanding production RAG: https://www.anthropic.com/news/contextual-retrieval

### The RAG Pipeline

Every RAG system has two phases. Memorize this diagram:

```
PHASE 1: INGESTION (offline, runs once per document)
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Load    │ →  │  Chunk   │ →  │  Embed   │ →  │  Store   │
│ Document │    │  Text    │    │ Chunks   │    │ Vectors  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
   PDF/HTML        Split into      Convert to      Save in
   → raw text      ~500 token      1024-dim        vector DB
                   pieces          vectors

PHASE 2: RETRIEVAL + GENERATION (online, runs per query)
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Query   │ →  │  Embed   │ →  │  Search  │ →  │ Generate │
│  Input   │    │  Query   │    │  Top K   │    │  Answer  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
   User's         Same model      Find similar    Stuff chunks
   question        as ingestion    vectors         into prompt
                                                   → Claude answers
```

### Key Concepts (Definitions You'll Build On)

**Embeddings:** A function that converts text into a fixed-length vector of floating-point numbers (e.g., 1024 floats). Texts with similar meanings produce similar vectors. This is how "search by meaning" works.

**Vector Similarity:** A mathematical measure of how "close" two vectors are. Cosine similarity is the standard -- it measures the angle between two vectors, ignoring magnitude. Score of 1.0 = identical direction, 0.0 = orthogonal, -1.0 = opposite.

**Chunking:** Splitting a long document into smaller pieces. Why? Because embedding models have token limits, and smaller chunks are more precise for retrieval. But chunk too small and you lose context. This tradeoff is the art of RAG.

**Top-K:** After computing similarity between the query vector and all stored vectors, you take the K most similar chunks. K=5 is a common starting point. Too few = miss relevant info. Too many = dilute the answer with noise.

### The Simplest Possible RAG (Pseudocode)

```typescript
// INGESTION
const document = loadPDF("report.pdf");
const chunks = splitIntoChunks(document, { size: 500, overlap: 50 });
const embeddings = await embedAll(chunks);  // chunks → vectors
await vectorDB.insert(chunks, embeddings);  // store

// RETRIEVAL + GENERATION
const query = "What was Q3 revenue?";
const queryEmbedding = await embed(query);
const topChunks = await vectorDB.search(queryEmbedding, { topK: 5 });

const answer = await claude.messages.create({
  model: "claude-sonnet-4-20250514",
  system: `Answer based on the following documents:\n\n${topChunks.join("\n\n")}`,
  messages: [{ role: "user", content: query }]
});
```

That's 12 lines. Everything this week builds toward making each of those lines robust.

### Read: Anthropic's RAG Documentation

Go through the official RAG guide. Pay attention to the recommended architecture and best practices:

https://docs.anthropic.com/en/docs/build-with-claude/retrieval-augmented-generation

Take notes on:
- What chunk sizes does Anthropic recommend?
- What embedding models do they suggest?
- How do they handle citations?

## Key Insight

RAG is not magic and not complicated. It's a **search problem** followed by a **prompting problem**. If your retrieval finds the right chunks, the generation almost always works. If your retrieval fails, no amount of prompt engineering saves you. This week, 80% of your effort should go into retrieval quality. The generation step is the easy part.

## Resources

- [Contextual Retrieval (Anthropic)](https://www.anthropic.com/news/contextual-retrieval) -- the paper that defines production RAG best practices. Read this today.
- [RAG Guide (Anthropic Docs)](https://docs.anthropic.com/en/docs/build-with-claude/retrieval-augmented-generation) -- official documentation on building RAG with Claude.
- [RAG is more than just Vector Search (blog)](https://www.anthropic.com/news/contextual-retrieval) -- understanding the full pipeline beyond embeddings.

## Done When

- [ ] You can draw the RAG pipeline (ingest + retrieve + generate) from memory
- [ ] You can explain when to use RAG vs. long context vs. fine-tuning
- [ ] You've read the Contextual Retrieval paper and noted 3 key takeaways
- [ ] You've read the Anthropic RAG docs and understand the recommended architecture
- [ ] You can define: embedding, vector similarity, chunking, top-K

---

*Tomorrow: You'll turn text into vectors. Embeddings are the foundation of everything retrieval -- time to understand them deeply and write real code against Voyage AI and OpenAI.*
