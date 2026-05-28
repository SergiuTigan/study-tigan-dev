---
title: "Day 80 -- Reimplement RAG with LangChain: The Honest Comparison"
week: 12
day: 80
phase: 3
phaseLabel: "Production"
order: 1280
type: "day"
---
# Day 80 -- Reimplement RAG with LangChain: The Honest Comparison

> *"The only way to evaluate a framework is to build the same thing with it and without it. Then count the lines, the bugs, and the 'wait, how do I do this simple thing?' moments."*

**Date:** Miercuri, 6 August 2025
**Hours:** 2h · Evening session
**Topic:** LangChain RAG Implementation + Comparison
**Phase:** Faza 3 -- Production · Week 12

---

## What You're Doing

Today you take your existing RAG system -- the one you built manually with the Anthropic SDK, Voyage embeddings, and Supabase vector store -- and reimplement it using LangChain.js. Then you compare the two implementations honestly. Not "LangChain is great" or "LangChain is terrible," but a nuanced assessment of what improved, what got worse, and what stayed the same.

This is the exercise that transforms you from "I heard LangChain is good/bad" to "I have built the same system both ways and here is my informed opinion." That specificity is valuable in interviews and architectural discussions.

## The Work

### Your Manual RAG (What You Built in Weeks 5-6)

Recall the architecture:

```typescript
// Manual RAG -- simplified version of what you built
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function manualRAG(question: string) {
  // Step 1: Embed the query
  const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: [question], model: 'voyage-3' }),
  });
  const { data } = await embeddingResponse.json();
  const queryEmbedding = data[0].embedding;

  // Step 2: Search vector store
  const { data: results } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 5,
  });

  // Step 3: Build context
  const context = results.map((r: any) => r.content).join('\n\n---\n\n');

  // Step 4: Generate answer
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `Answer based on this context:\n\n${context}`,
    messages: [{ role: 'user', content: question }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

### The LangChain RAG Reimplementation

```typescript
// LangChain RAG -- same functionality, framework approach
import { ChatAnthropic } from '@langchain/anthropic';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { VoyageEmbeddings } from '@langchain/community/embeddings/voyage';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createClient } from '@supabase/supabase-js';

// Initialize components
const embeddings = new VoyageEmbeddings({
  modelName: 'voyage-3',
  apiKey: process.env.VOYAGE_API_KEY,
});

const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: 'documents',
  queryName: 'match_documents',
});

const model = new ChatAnthropic({
  modelName: 'claude-sonnet-4-20250514',
  maxTokens: 1024,
});

// Build the chain
const prompt = ChatPromptTemplate.fromMessages([
  ['system', `Answer the question based only on the following context:

{context}

If you cannot answer from the context, say so.`],
  ['human', '{input}'],
]);

const documentChain = await createStuffDocumentsChain({
  llm: model,
  prompt,
});

const retrievalChain = await createRetrievalChain({
  combineDocsChain: documentChain,
  retriever: vectorStore.asRetriever({
    k: 5,
    filter: undefined,
  }),
});

// Use it
async function langchainRAG(question: string) {
  const result = await retrievalChain.invoke({
    input: question,
  });

  return {
    answer: result.answer,
    sources: result.context.map((doc: any) => ({
      content: doc.pageContent.slice(0, 100),
      metadata: doc.metadata,
    })),
  };
}
```

### Document Ingestion: Where LangChain Shines

```typescript
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';

// Load an entire directory of mixed documents
const loader = new DirectoryLoader('./documents', {
  '.pdf': (path) => new PDFLoader(path),
  '.txt': (path) => new TextLoader(path),
  '.md': (path) => new TextLoader(path),
});

const docs = await loader.load();

// Split into chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' ', ''],
});

const chunks = await splitter.splitDocuments(docs);

// Ingest into vector store (embeds + stores in one call)
await SupabaseVectorStore.fromDocuments(
  chunks,
  embeddings,
  {
    client: supabaseClient,
    tableName: 'documents',
  }
);

console.log(`Ingested ${chunks.length} chunks from ${docs.length} documents`);
```

Compare this to your manual ingestion code. LangChain's document loaders and text splitters handle dozens of formats (PDF, CSV, JSON, HTML, Notion, Confluence, etc.) with one line each. This is where the framework saves real time.

### The Honest Comparison

Now, the evaluation. Be specific:

```
Category              Manual                      LangChain
──────────────────────────────────────────────────────────────
Lines of code (RAG)   ~30 lines                   ~35 lines (more setup)
Lines of code (ingest) ~50 lines                  ~15 lines (big win)
Setup complexity       Low (direct APIs)           Medium (wrappers + configs)
Debugging              Easy (direct API calls)     Harder (abstraction layers)
Error messages         Clear (from API)            Sometimes cryptic
Flexibility            Full control                Constrained by chain API
Type safety            Full                        Good but some 'any' types
Streaming              Manual setup                Built-in via chain.stream()
Switching providers    Rewrite API call            Change class name
Adding new doc types   Write loader from scratch   One-liner import
Test & mock            Easy (mock fetch)           Harder (mock chain internals)
Community examples     Many for raw APIs           Many for LangChain patterns
Breaking changes       Rare (API versioned)        Frequent (library evolves fast)
```

### Where LangChain Is Clearly Better

1. **Document loading.** PDFLoader, CSVLoader, NotionLoader, WebLoader -- dozens of integrations. Writing these from scratch is tedious.

2. **Text splitting.** RecursiveCharacterTextSplitter with overlap handling is well-tested. Your manual chunking might have edge cases.

3. **Provider switching.** Changing from `ChatAnthropic` to `ChatOpenAI` is a class swap. Your manual code needs a rewrite.

4. **Structured output.** `model.withStructuredOutput(zodSchema)` is cleaner than manual JSON prompting.

### Where Manual Is Clearly Better

1. **Debugging.** When something breaks in your manual code, the stack trace points to your code. In LangChain, it points to framework internals.

2. **Prompt control.** You have exact control over every token sent to the API. LangChain may add tokens you do not expect.

3. **Performance.** No abstraction overhead. Direct API calls are marginally faster.

4. **Understanding.** When you write it manually, you understand every piece. With LangChain, some magic happens inside the chain.

### Where It Is Neutral

1. **RAG quality.** Same embeddings + same model + same context = same quality. The framework does not change the output.

2. **Cost.** Same API calls = same cost (LangChain adds minimal overhead).

3. **Maintenance.** Both need updates when APIs change. LangChain updates might be more frequent.

## Key Insight

The honest answer is: "It depends." LangChain is better for prototyping, document ingestion, and multi-provider workflows. Manual code is better for production systems where you need full control, debuggability, and predictability. The best approach is often hybrid: use LangChain's document loaders and text splitters (they are genuinely better), but write your own chain logic for the core RAG/agent loop. This gives you the best of both worlds -- convenience where it matters, control where it counts.

## Resources

- [LangChain.js RAG Tutorial](https://js.langchain.com/docs/tutorials/rag/)
- [LangChain.js Document Loaders](https://js.langchain.com/docs/integrations/document_loaders/)
- [LangChain.js Vector Stores](https://js.langchain.com/docs/integrations/vectorstores/)
- [createRetrievalChain Reference](https://api.js.langchain.com/functions/langchain_chains_retrieval.createRetrievalChain.html)

## Done When

- [ ] You reimplemented your RAG system using LangChain
- [ ] Both versions produce similar quality answers
- [ ] You wrote your honest comparison (better/worse/neutral)
- [ ] You used LangChain document loaders (PDF, text, etc.)
- [ ] You can explain to someone when to use LangChain and when to go manual
- [ ] You have a nuanced opinion, not a dogmatic one

---

*Tomorrow: Advanced LangChain patterns -- custom chains, output parsers, and callbacks. The power tools for when you do choose to use the framework.*
