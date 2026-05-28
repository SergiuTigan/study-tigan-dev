---
title: "Day 35 -- Polish RAG + UI + Ship"
week: 5
day: 35
phase: 2
phaseLabel: "Deep Dive"
order: 535
type: "day"
---
# Day 35 -- Polish RAG + UI + Ship

> *"A project on your laptop is a hobby. A project on GitHub with a README, eval results, and a working demo is a portfolio piece. Ship it."*

**Date:** Duminica, 22 Iunie 2026
**Hours:** 5h · Full morning block
**Topic:** UI, cleanup, documentation, and shipping portfolio piece #2
**Phase:** Faza 2 -- Patterns · Week 5

---

## What You're Doing

Two weeks of work come together today. You have a production-quality RAG system with contextual retrieval, hybrid search, reranking, and a proper evaluation framework. Now you make it presentable: a simple UI for interaction, a clean codebase with clear structure, a README that explains the architecture and shows your eval results, and a GitHub repository that someone can actually clone and run. By the end of today, portfolio piece #2 is live.

This is a 5-hour build session. Each hour has a specific deliverable. The goal is not perfection -- it's *shipped*.

## The Work

### Hour 1-2: Build a Simple UI

You have two options. Pick whichever fits your skills and time:

**Option A: CLI with chalk (faster, simpler)**

```typescript
// ui/cli.ts
// npm install chalk readline

import * as readline from "readline";
import chalk from "chalk";

async function startCLI(store: SupabaseVectorStore, embedder: EmbeddingProvider): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.bold.blue("\n================================="));
  console.log(chalk.bold.blue("  RAG Document Q&A System"));
  console.log(chalk.bold.blue("=================================\n"));

  console.log(chalk.gray("Ask questions about your ingested documents."));
  console.log(chalk.gray('Type "quit" to exit, "sources" to list ingested docs.\n'));

  const askQuestion = (): void => {
    rl.question(chalk.green("? "), async (query) => {
      if (query.toLowerCase() === "quit") {
        console.log(chalk.gray("\nGoodbye!"));
        rl.close();
        return;
      }

      if (query.toLowerCase() === "sources") {
        // List ingested documents
        const { data } = await supabase
          .from("documents")
          .select("metadata->>source")
          .limit(100);
        const sources = [...new Set((data || []).map((d: any) => d.source))];
        console.log(chalk.yellow("\nIngested documents:"));
        sources.forEach((s) => console.log(chalk.yellow(`  - ${s}`)));
        console.log();
        askQuestion();
        return;
      }

      console.log(chalk.gray("\nSearching..."));
      const start = Date.now();

      try {
        // Full pipeline
        const context = await retrieveV2(query, embedder);
        const response = await generateAnswer(query, context);
        const elapsed = Date.now() - start;

        // Display answer
        console.log(chalk.white(`\n${response.answer}\n`));

        // Display sources
        console.log(chalk.gray(`Sources (${elapsed}ms):`));
        response.sources.forEach((s) => {
          const bar = chalk.cyan("█".repeat(Math.round(s.similarity * 20)));
          console.log(chalk.gray(`  ${bar} ${s.source} (${s.similarity.toFixed(2)})`));
        });
        console.log();
      } catch (err) {
        console.log(chalk.red(`Error: ${(err as Error).message}\n`));
      }

      askQuestion();
    });
  };

  askQuestion();
}
```

**Option B: Express + HTML (more visual, takes longer)**

```typescript
// ui/server.ts
// npm install express
import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("ui/public"));

app.post("/api/ask", async (req, res) => {
  const { question } = req.body;

  try {
    const context = await retrieveV2(question, embedder);
    const response = await generateAnswer(question, context);

    res.json({
      answer: response.answer,
      sources: response.sources,
      chunksUsed: response.chunksUsed,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/ingest", async (req, res) => {
  const { filePath } = req.body;

  try {
    const result = await ingestDocumentV2(filePath, store);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(3000, () => {
  console.log("RAG server running at http://localhost:3000");
});
```

With a simple HTML front end:

```html
<!-- ui/public/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>RAG Document Q&A</title>
  <style>
    body { font-family: system-ui; max-width: 700px; margin: 40px auto; padding: 0 20px; }
    .answer { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .source { font-size: 0.85em; color: #666; }
    input { width: 100%; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; }
    button { padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 8px; }
    .loading { color: #999; font-style: italic; }
  </style>
</head>
<body>
  <h1>RAG Document Q&A</h1>
  <p>Ask questions about the ingested documents.</p>
  <input id="question" placeholder="Type your question..." onkeypress="if(event.key==='Enter')ask()">
  <button onclick="ask()">Ask</button>
  <div id="result"></div>

  <script>
    async function ask() {
      const q = document.getElementById('question').value;
      const div = document.getElementById('result');
      div.innerHTML = '<p class="loading">Thinking...</p>';

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();

      div.innerHTML = `
        <div class="answer">${data.answer}</div>
        <div class="source">
          Sources: ${data.sources.map(s => `${s.source} (${s.similarity.toFixed(2)})`).join(', ')}
        </div>`;
    }
  </script>
</body>
</html>
```

### Hour 3: Clean the Codebase

Organize your project into a clear structure:

```
rag-system/
├── src/
│   ├── ingest/
│   │   ├── extract.ts        # PDF text extraction
│   │   ├── chunk.ts          # Chunking strategies
│   │   ├── contextualize.ts  # Contextual retrieval (Haiku)
│   │   └── index.ts          # Ingestion pipeline orchestrator
│   ├── retrieve/
│   │   ├── embeddings.ts     # Embedding provider interface
│   │   ├── hybrid-search.ts  # Vector + BM25 hybrid search
│   │   ├── rerank.ts         # Cohere/Voyage reranking
│   │   └── index.ts          # Retrieval pipeline orchestrator
│   ├── generate/
│   │   ├── prompt.ts         # System prompt construction
│   │   └── index.ts          # Claude answer generation
│   ├── eval/
│   │   ├── golden-dataset.ts # Question-answer pairs
│   │   ├── retrieval-metrics.ts # Hit rate, MRR, precision
│   │   ├── llm-judge.ts      # LLM-as-judge scoring
│   │   └── run-eval.ts       # Full evaluation runner
│   └── ui/
│       ├── cli.ts            # CLI interface
│       └── server.ts         # Express server (optional)
├── pdfs/                     # Sample documents for demo
│   └── .gitkeep
├── .env.example              # Required environment variables
├── package.json
├── tsconfig.json
└── README.md
```

Go through each file and:
1. Remove dead code and console.log debugging
2. Add TypeScript types to all function signatures
3. Add a one-line JSDoc comment to each exported function
4. Make sure imports are clean (no unused imports)

```typescript
// Example: clean exports from retrieve/index.ts

/**
 * Full retrieval pipeline: hybrid search → rerank → return top chunks.
 */
export async function retrieve(
  query: string,
  options?: Partial<RetrievalOptions>
): Promise<RetrievedChunk[]> {
  // ...
}
```

### Hour 4: README with Architecture and Eval Results

Your README is your portfolio's front page. It needs to communicate competence in 30 seconds.

Write a README with these sections:

```markdown
# RAG Document Q&A System

A production-quality Retrieval-Augmented Generation system that ingests PDFs
and answers questions using Claude, with contextual retrieval, hybrid search,
and cross-encoder reranking.

## Architecture

[Describe the pipeline with an ASCII diagram]

Query → Embed → Hybrid Search (Vector + BM25, top 20) → Rerank (top 5) → Claude → Answer

### Ingestion Pipeline
- PDF extraction (pdf-parse)
- Recursive chunking (1000 chars, 200 overlap)
- Contextual enrichment (Claude Haiku prepends document context)
- Voyage AI embeddings (1024d)
- Storage in Supabase pgvector

### Retrieval Pipeline
- Hybrid search: cosine similarity + BM25 full-text search
- Reciprocal Rank Fusion to merge results
- Cohere cross-encoder reranking
- Top 5 chunks passed to Claude for generation

## Evaluation Results

| Metric | Score |
|--------|-------|
| Hit Rate | X% |
| MRR | X.XX |
| Correctness | X.X/5 |
| Faithfulness | X.X/5 |
| Overall | X.X/5 |

Evaluated on a golden dataset of 20 question-answer pairs across 5 documents.

### V1 (Naive) vs V2 (Production) Comparison

[Include your comparison results from Day 32]

## Quick Start

[3-step setup: clone, install, configure env vars, run]

## Tech Stack

- Claude Sonnet (generation) + Haiku (contextual retrieval + judge)
- Voyage AI voyage-3 (embeddings)
- Supabase + pgvector (vector storage)
- Cohere rerank-english-v3.0 (reranking)
- TypeScript + Node.js

## What I Learned

[2-3 paragraphs about the engineering decisions and tradeoffs]
```

### Hour 5: Push to GitHub

Final steps:

```bash
# Initialize and push
cd rag-system
git init
echo "node_modules/\n.env\ndist/\npdfs/*.pdf" > .gitignore

# Create .env.example (no real keys!)
cat > .env.example << 'EOF'
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
COHERE_API_KEY=...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
EOF

git add .
git commit -m "RAG system with contextual retrieval, hybrid search, and eval"
git remote add origin https://github.com/YOUR_USERNAME/rag-document-qa.git
git branch -M main
git push -u origin main
```

Before pushing, verify:
- [ ] No API keys in the code (check with `grep -r "sk-ant\|pa-\|eyJ" src/`)
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` shows what's needed without real values
- [ ] README explains how to set up from scratch
- [ ] The eval results are real (from your actual run, not made up)

## Key Insight

Shipping is a skill. Most developers can build a working system. Far fewer can package it so that someone else can understand it, set it up, and trust it. The README, the clean folder structure, the eval results, the .env.example -- these aren't polish, they're **communication**. They say: "I don't just write code. I build systems that other engineers can work with." That's the difference between a junior and a senior, and it's visible in a 30-second GitHub browse.

## Resources

- [pdf-parse (npm)](https://www.npmjs.com/package/pdf-parse) -- the PDF extraction library used in the ingestion pipeline.
- [chalk (npm)](https://www.npmjs.com/package/chalk) -- terminal string styling for the CLI interface.
- [Make a README](https://www.makeareadme.com/) -- guidance on writing a good README.
- [GitHub Profile Tips](https://docs.github.com/en/account-and-profile) -- make sure your GitHub profile is set up to showcase this.

## Done When

- [ ] Your project has a working UI (CLI or web)
- [ ] The codebase is organized into ingest/, retrieve/, generate/, eval/ folders
- [ ] Your README has an architecture diagram, eval results, and setup instructions
- [ ] The repo is on GitHub with no exposed API keys
- [ ] You can clone it fresh, follow the README, and get it running
- [ ] **Portfolio piece #2 is live**

---

*Next week: Week 6 starts Faza 3 -- Production. You'll take everything you've built (tools, agents, RAG) and learn to deploy, monitor, and scale it. The systems you build from here on are the systems you'll show in interviews.*
