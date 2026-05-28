---
title: "Day 29 -- Contextual Retrieval Deep Dive"
week: 5
day: 29
phase: 2
phaseLabel: "Deep Dive"
order: 529
type: "day"
---
# Day 29 -- Contextual Retrieval Deep Dive

> *"A chunk that says 'revenue grew 40%' is useless. A chunk that says 'Acme Corp's Q3 2025 revenue grew 40% year-over-year' is gold. Contextual retrieval adds the gold."*

**Date:** Luni, 16 Iunie 2026
**Hours:** 2h · Evening deep-focus block
**Topic:** Contextual retrieval -- prepending document-level context to chunks
**Phase:** Faza 2 -- Patterns · Week 5

---

## What You're Doing

Last week you built a working RAG system. This week you make it *good*. The single biggest quality improvement you can make to a RAG pipeline isn't a better embedding model or a fancier database -- it's **contextual retrieval**. This technique, published by Anthropic, addresses the fundamental flaw of chunking: when you split a document into pieces, each piece loses the context of the whole.

Today you'll understand the problem deeply, implement the solution, and see why this one change improves retrieval quality by 20-35% in Anthropic's benchmarks.

## The Work

### The Problem: Chunks Are Orphans

Consider a 50-page annual report for Acme Corp. After chunking, you have this chunk:

> "Revenue grew 40% year-over-year to $4.2 billion. The growth was primarily driven by strong performance in the enterprise segment, which expanded to 15 new markets."

This chunk is missing critical context:
- **Which company?** The report covers Acme Corp, but this chunk doesn't say so.
- **Which time period?** This is from Q3 2025, but the chunk doesn't specify.
- **Which section?** This is from the Financial Results section, providing important framing.

When a user asks "What was Acme Corp's Q3 2025 revenue?", the embedding of their question mentions "Acme Corp" and "Q3 2025." The embedding of the chunk mentions neither. The similarity score is lower than it should be. The chunk might not make it into the top-K results. **Your system has the answer but can't find it.**

### The Solution: Prepend Context Before Embedding

Before you embed each chunk, send it to a fast, cheap model (Claude Haiku) along with the full document. Ask the model to generate 2-3 sentences of context. Prepend that context to the chunk. Then embed the enriched version.

**Before contextual retrieval:**
```
Stored chunk: "Revenue grew 40% year-over-year to $4.2 billion. The growth
was primarily driven by strong performance in the enterprise segment..."
```

**After contextual retrieval:**
```
Stored chunk: "This chunk is from Acme Corp's 2025 Annual Report, specifically
the Q3 Financial Results section discussing revenue performance. The document
covers Acme Corp's fiscal year 2025 financial metrics and strategic initiatives.

Revenue grew 40% year-over-year to $4.2 billion. The growth was primarily
driven by strong performance in the enterprise segment..."
```

Now when the user asks about "Acme Corp's Q3 2025 revenue," the enriched chunk's embedding captures both the specific data AND the context. Similarity scores improve dramatically.

### Implementation: The addContext Function

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function addContext(
  chunk: string,
  fullDocument: string,
  documentTitle: string
): Promise<string> {
  const prompt = `<document title="${documentTitle}">
${fullDocument}
</document>

Here is a chunk from this document:
<chunk>
${chunk}
</chunk>

Please provide a short, succinct context (2-3 sentences) to situate this chunk within the overall document. The context should:
1. Identify the document source and relevant section
2. Add any missing referents (company names, time periods, topics)
3. Help a search engine understand what this chunk is about

Respond with ONLY the context, nothing else.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-20250414",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const context =
    response.content[0].type === "text" ? response.content[0].text : "";

  return `${context}\n\n${chunk}`;
}
```

### Processing Chunks in Batches

Full documents can have 50-200 chunks. You need to process them efficiently:

```typescript
async function addContextToChunks(
  chunks: string[],
  fullDocument: string,
  documentTitle: string,
  concurrency: number = 5
): Promise<string[]> {
  const results: string[] = new Array(chunks.length);

  // Process in batches for rate limiting
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);
    const promises = batch.map((chunk, j) =>
      addContext(chunk, fullDocument, documentTitle)
    );

    const batchResults = await Promise.all(promises);
    batchResults.forEach((result, j) => {
      results[i + j] = result;
    });

    console.log(`Contextualized ${Math.min(i + concurrency, chunks.length)}/${chunks.length} chunks`);
  }

  return results;
}
```

### Handling Large Documents

Claude Haiku has a context window, and some documents are very long. For documents that exceed the window, use a summarized version:

```typescript
async function getDocumentSummary(
  fullDocument: string,
  documentTitle: string
): Promise<string> {
  // If the document fits in context, use it directly
  // Rough estimate: 4 chars per token, Haiku has ~200K token context
  if (fullDocument.length < 400000) {
    return fullDocument;
  }

  // For very large documents, create a summary first
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-20250414",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Provide a detailed summary of this document, including all key entities, dates, sections, and topics:\n\n${fullDocument.slice(0, 400000)}`,
    }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
```

### Cost Analysis

This is the question everyone asks: "Isn't it expensive to call Haiku for every chunk?"

```
Example: 50-page document
- ~100 chunks after splitting
- Each Haiku call: ~500 input tokens (chunk) + ~100K tokens (document) + ~100 output tokens
- Total: ~100 calls x ~100K tokens = ~10M input tokens + ~10K output tokens
- Haiku pricing: $0.25/M input, $1.25/M output
- Cost: (10M x $0.25/M) + (10K x $1.25/M) = $2.50 + $0.0125 = ~$2.51

For 10 documents: ~$25
For 1000 documents: ~$250 (still very reasonable for production)
```

**Key insight:** This is a one-time cost per document. You pay it during ingestion, not per query. And the quality improvement (20-35% better retrieval) pays for itself immediately in user satisfaction and reduced support load.

### Updated Ingestion Pipeline

```typescript
async function ingestWithContext(
  filePath: string,
  store: SupabaseVectorStore
): Promise<void> {
  // Extract text
  const rawText = await extractTextFromPDF(filePath);
  const fileName = filePath.split("/").pop() || filePath;

  // Chunk the raw text
  const textChunks = recursiveChunk(rawText, 1000, 200);
  console.log(`Created ${textChunks.length} chunks`);

  // Get document context (full doc or summary for large docs)
  const docContext = await getDocumentSummary(rawText, fileName);

  // Add context to each chunk
  console.log("Adding contextual information to chunks...");
  const contextualChunks = await addContextToChunks(
    textChunks,
    docContext,
    fileName,
    5 // concurrency
  );

  // Prepare for storage
  const chunks = contextualChunks.map((text, index) => ({
    text,
    metadata: {
      source: fileName,
      chunkIndex: index,
      totalChunks: textChunks.length,
      hasContext: true,
      originalChunk: textChunks[index], // Keep original for debugging
    },
  }));

  // Embed and store the contextual chunks
  await store.ingest(chunks);
  console.log(`Done. ${chunks.length} contextual chunks stored.`);
}
```

## Key Insight

Contextual retrieval is the highest-ROI improvement you can make to a RAG system. It costs pennies per document (one-time), requires no infrastructure changes, and improves retrieval quality by 20-35%. The reason it works so well is architectural: it fixes the problem at the source (chunking destroys context) rather than trying to compensate downstream (fancier search algorithms). Always fix the data before fixing the algorithm.

## Resources

- [Contextual Retrieval (Anthropic)](https://www.anthropic.com/news/contextual-retrieval) -- the original blog post. Read this again with today's implementation context in mind.
- [Claude Haiku Pricing](https://docs.anthropic.com/en/docs/about-claude/models) -- verify current pricing for cost calculations.
- [Prompt Caching for Context](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) -- use prompt caching to reduce costs when processing many chunks from the same document.

## Done When

- [ ] You can explain why standard chunks lose context and how this hurts retrieval
- [ ] You've implemented the `addContext` function using Claude Haiku
- [ ] You've processed chunks in batches with concurrency control
- [ ] You understand the cost model ($2-3 per 50-page document, one-time)
- [ ] You've updated your ingestion pipeline to produce contextual chunks

---

*Tomorrow: Contextual retrieval fixes semantic search. But what about exact matches -- error codes, version numbers, names? Hybrid search combines vector similarity with keyword matching to catch what embeddings miss.*
