---
title: "RAG Architecture"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "rag"
moduleTitle: "RAG"
moduleDescription: "Build Retrieval-Augmented Generation systems that ground LLM responses in your data."
lessonId: "ai-engineer/rag/architecture"
duration: "12 min"
order: 401
moduleOrder: 4
lessonOrder: 1
color: "purple"
---
# RAG Architecture

Retrieval-Augmented Generation (RAG) is a pattern that combines information retrieval with LLM generation. Instead of relying solely on the model's training data, RAG fetches relevant documents and includes them in the prompt.

## Why RAG?

LLMs have limitations:
- **Knowledge cutoff:** They do not know about events after their training date.
- **Hallucination:** They can generate plausible-sounding but incorrect information.
- **No access to private data:** They cannot access your company's internal documents.

RAG solves all three by grounding the model's responses in retrieved documents.

## The RAG Pipeline

```
User Query
    ↓
[1. Embed Query]
    ↓
[2. Retrieve Documents] ← Vector Database
    ↓
[3. Augment Prompt] ← Combine query + retrieved docs
    ↓
[4. Generate Response] ← LLM
    ↓
Answer (grounded in sources)
```

## Basic Implementation

```typescript
async function ragQuery(userQuery: string): Promise<string> {
  // Step 1 & 2: Retrieve relevant documents
  const documents = await search(userQuery, 5);

  // Step 3: Build the augmented prompt
  const context = documents
    .map((doc, i) => `[Source ${i + 1}]: ${doc.text}`)
    .join('\\n\\n');

  // Step 4: Generate with context
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `You are a helpful assistant. Answer the user's question based ONLY on the provided sources. If the sources don't contain the answer, say so. Cite your sources.`,
    messages: [{
      role: 'user',
      content: `Sources:\\n${context}\\n\\nQuestion: ${userQuery}`,
    }],
  });

  return response.content[0].text;
}
```

## Key Design Decisions

1. **Chunk size:** How large should each document chunk be? (256-1024 tokens)
2. **Top-K:** How many chunks to retrieve? (3-10 typically)
3. **Retrieval strategy:** Vector search, hybrid, or multi-step?
4. **Context window management:** How to fit retrieved content into the LLM's context?
5. **Source attribution:** How to cite sources in the response?

RAG is the most common pattern in production AI applications. Most enterprise AI features are RAG systems under the hood.
