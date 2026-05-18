# Day 32 -- Implement Contextual Retrieval

> *"Theory is what you know. Practice is what you build. Today you rebuild your entire RAG pipeline with everything you've learned, then prove it's better."*

**Date:** Joi, 19 Iunie 2026
**Hours:** 2h · Evening deep-focus block
**Topic:** Full pipeline upgrade -- contextual chunks, hybrid search, reranking
**Phase:** Faza 2 -- Patterns · Week 5

---

## What You're Doing

You've learned three techniques this week: contextual retrieval (Day 29), hybrid search (Day 30), and reranking (Day 31). Each one improves quality independently. Together, according to Anthropic's benchmarks, they improve retrieval by **49%** over naive RAG. Today you integrate all three into your existing pipeline, re-ingest your 5 PDFs from last week, and run a head-to-head comparison: same questions, old pipeline vs new pipeline, documented results.

This is where theory becomes engineering. You're not learning a new concept -- you're integrating three concepts into a working system and proving the improvement with evidence.

## The Work

### Step 1: Update the Ingestion Pipeline

Your new ingestion pipeline adds contextual information to each chunk before embedding:

```typescript
// ingest-v2.ts

async function ingestDocumentV2(
  filePath: string,
  store: SupabaseVectorStore,
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
    addContext?: boolean;
    concurrency?: number;
  } = {}
): Promise<{ chunksStored: number; timeMs: number }> {
  const start = Date.now();
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    addContext = true,
    concurrency = 5,
  } = options;

  const fileName = filePath.split("/").pop() || filePath;
  console.log(`\n=== Ingesting: ${fileName} ===`);

  // Step 1: Extract text
  const rawText = await extractTextFromPDF(filePath);
  console.log(`  Extracted ${rawText.length} chars`);

  // Step 2: Chunk with recursive splitting
  const textChunks = recursiveChunk(rawText, chunkSize, chunkOverlap);
  console.log(`  Split into ${textChunks.length} chunks`);

  // Step 3: Add contextual information (NEW)
  let finalChunks: string[];
  if (addContext) {
    console.log(`  Adding context with Haiku (concurrency: ${concurrency})...`);
    const docSummary = await getDocumentSummary(rawText, fileName);
    finalChunks = await addContextToChunks(
      textChunks,
      docSummary,
      fileName,
      concurrency
    );
    console.log(`  Context added to all ${finalChunks.length} chunks`);
  } else {
    finalChunks = textChunks;
  }

  // Step 4: Prepare with metadata
  const chunks = finalChunks.map((text, index) => ({
    text,
    metadata: {
      source: fileName,
      chunkIndex: index,
      totalChunks: textChunks.length,
      hasContext: addContext,
      pipeline: addContext ? "v2-contextual" : "v1-naive",
      ingestedAt: new Date().toISOString(),
    },
  }));

  // Step 5: Embed and store
  console.log(`  Embedding and storing...`);
  await store.ingest(chunks);

  const timeMs = Date.now() - start;
  console.log(`  Done. ${chunks.length} chunks in ${(timeMs / 1000).toFixed(1)}s`);

  return { chunksStored: chunks.length, timeMs };
}
```

### Step 2: Update the Retrieval Pipeline

Your new retrieval uses hybrid search + reranking:

```typescript
// retrieve-v2.ts

interface RetrievalPipelineOptions {
  hybridCandidates: number;  // How many from hybrid search
  rerankTopK: number;        // How many to keep after reranking
  vectorWeight: number;
  textWeight: number;
  useReranker: boolean;
}

const DEFAULT_OPTIONS: RetrievalPipelineOptions = {
  hybridCandidates: 20,
  rerankTopK: 5,
  vectorWeight: 0.6,
  textWeight: 0.4,
  useReranker: true,
};

async function retrieveV2(
  query: string,
  embedder: EmbeddingProvider,
  options: Partial<RetrievalPipelineOptions> = {}
): Promise<RetrievedChunk[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Stage 1: Hybrid search
  const queryEmbedding = await embedder.embedQuery(query);
  const candidates = await hybridSearch(query, queryEmbedding, {
    topK: opts.hybridCandidates,
    vectorWeight: opts.vectorWeight,
    textWeight: opts.textWeight,
  });

  if (candidates.length === 0) return [];

  // Stage 2: Rerank (optional)
  if (opts.useReranker && candidates.length > opts.rerankTopK) {
    const reranked = await rerankDocuments(
      query,
      candidates.map((c) => ({ content: c.content, metadata: c.metadata })),
      opts.rerankTopK
    );

    return reranked.map((r) => ({
      content: r.content,
      source: (r.metadata as any).source || "unknown",
      similarity: r.relevanceScore,
      metadata: r.metadata,
    }));
  }

  // Without reranker, just return top K from hybrid search
  return candidates.slice(0, opts.rerankTopK).map((c) => ({
    content: c.content,
    source: (c.metadata as any).source || "unknown",
    similarity: c.combinedScore,
    metadata: c.metadata,
  }));
}
```

### Step 3: Re-Ingest Your 5 PDFs

Clear the old data and re-ingest with contextual retrieval:

```typescript
async function reIngestAll(): Promise<void> {
  // Clear existing documents (or use a separate table/pipeline flag)
  const { error } = await supabase
    .from("documents")
    .delete()
    .neq("id", 0); // Delete all rows

  if (error) console.error("Clear failed:", error.message);
  console.log("Cleared existing documents.\n");

  const pdfs = [
    "./pdfs/anthropic-contextual-retrieval.pdf",
    "./pdfs/company-annual-report.pdf",
    "./pdfs/react-docs-overview.pdf",
    "./pdfs/climate-change-summary.pdf",
    "./pdfs/startup-pitch-deck.pdf",
  ];

  let totalChunks = 0;
  let totalTime = 0;

  for (const pdf of pdfs) {
    const { chunksStored, timeMs } = await ingestDocumentV2(pdf, store, {
      addContext: true,
      concurrency: 5,
    });
    totalChunks += chunksStored;
    totalTime += timeMs;
  }

  console.log(`\n=== Ingestion Complete ===`);
  console.log(`Total chunks: ${totalChunks}`);
  console.log(`Total time: ${(totalTime / 1000).toFixed(1)}s`);
}
```

### Step 4: Head-to-Head Comparison

This is the critical step. Run the exact same questions through both pipelines and document the results:

```typescript
interface ComparisonResult {
  query: string;
  v1Answer: string;
  v2Answer: string;
  v1Sources: string[];
  v2Sources: string[];
  v1ChunkScores: number[];
  v2ChunkScores: number[];
  improvement: "better" | "same" | "worse";
  notes: string;
}

async function compareOldVsNew(
  questions: string[]
): Promise<ComparisonResult[]> {
  const results: ComparisonResult[] = [];

  for (const query of questions) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`QUERY: ${query}`);
    console.log("=".repeat(60));

    // V1: Naive pipeline (vector-only search, no context, no reranking)
    const v1Context = await retrieveV2(query, embedder, {
      hybridCandidates: 5,
      rerankTopK: 5,
      vectorWeight: 1.0,  // Vector only
      textWeight: 0.0,
      useReranker: false,
    });
    const v1Response = await generateAnswer(query, v1Context);

    // V2: Full pipeline (contextual + hybrid + reranking)
    const v2Context = await retrieveV2(query, embedder, {
      hybridCandidates: 20,
      rerankTopK: 5,
      vectorWeight: 0.6,
      textWeight: 0.4,
      useReranker: true,
    });
    const v2Response = await generateAnswer(query, v2Context);

    console.log(`\nV1 (naive): ${v1Response.answer.slice(0, 150)}...`);
    console.log(`V2 (full):  ${v2Response.answer.slice(0, 150)}...`);

    results.push({
      query,
      v1Answer: v1Response.answer,
      v2Answer: v2Response.answer,
      v1Sources: v1Response.sources.map((s) => s.source),
      v2Sources: v2Response.sources.map((s) => s.source),
      v1ChunkScores: v1Context.map((c) => c.similarity),
      v2ChunkScores: v2Context.map((c) => c.similarity),
      improvement: "same", // You'll assess manually
      notes: "",
    });
  }

  return results;
}

// Run comparison
const questions = [
  "What is contextual retrieval and how does it improve RAG?",
  "What was the company's total revenue?",
  "What are React hooks?",
  "What are the main causes of climate change?",
  "What is the startup's business model?",
  "error ERR_CONN_REFUSED troubleshooting",
  "Compare the financial metrics across documents",
];

const comparison = await compareOldVsNew(questions);
```

### Step 5: Document the Results

Create a simple results log:

```typescript
function printComparisonReport(results: ComparisonResult[]): void {
  console.log("\n\n" + "=".repeat(70));
  console.log("COMPARISON REPORT: V1 (Naive) vs V2 (Contextual + Hybrid + Rerank)");
  console.log("=".repeat(70));

  for (const result of results) {
    console.log(`\nQuery: "${result.query}"`);
    console.log(`  V1 sources: ${result.v1Sources.join(", ")}`);
    console.log(`  V2 sources: ${result.v2Sources.join(", ")}`);
    console.log(`  V1 avg score: ${(result.v1ChunkScores.reduce((a, b) => a + b, 0) / result.v1ChunkScores.length).toFixed(3)}`);
    console.log(`  V2 avg score: ${(result.v2ChunkScores.reduce((a, b) => a + b, 0) / result.v2ChunkScores.length).toFixed(3)}`);
    console.log(`  Result: ${result.improvement}`);
    if (result.notes) console.log(`  Notes: ${result.notes}`);
  }

  const better = results.filter((r) => r.improvement === "better").length;
  const same = results.filter((r) => r.improvement === "same").length;
  const worse = results.filter((r) => r.improvement === "worse").length;

  console.log(`\nSummary: ${better} better, ${same} same, ${worse} worse`);
}
```

## Key Insight

The value of today's work isn't just a better pipeline -- it's the **comparison**. Showing that V2 outperforms V1 on specific queries, with specific evidence, is how engineering works. Anyone can claim their system is good. Engineers prove it. Save this comparison -- you'll reference it in your portfolio README, and it's exactly the kind of evidence hiring managers look for.

## Resources

- [Contextual Retrieval Benchmarks (Anthropic)](https://www.anthropic.com/news/contextual-retrieval) -- reference numbers for your own comparison.
- [Evaluation Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/retrieval-augmented-generation) -- Anthropic's guidance on evaluating RAG systems.

## Done When

- [ ] Your ingestion pipeline adds contextual information to every chunk via Haiku
- [ ] Your retrieval pipeline uses hybrid search (vector + BM25) followed by reranking
- [ ] You've re-ingested all 5 PDFs with the new contextual pipeline
- [ ] You've run the same questions through V1 and V2 and documented the results
- [ ] You can point to specific queries where V2 produced better answers and explain why

---

*Saturday: You have a working production pipeline. But how do you know it's actually good? Day 34 builds an evaluation framework -- golden datasets, retrieval metrics, and LLM-as-judge scoring. Numbers, not vibes.*
