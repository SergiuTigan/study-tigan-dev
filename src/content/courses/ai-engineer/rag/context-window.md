---
title: "Context Window Management"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "rag"
moduleTitle: "RAG"
moduleDescription: "Build Retrieval-Augmented Generation systems that ground LLM responses in your data."
lessonId: "ai-engineer/rag/context-window"
duration: "10 min"
order: 404
moduleOrder: 4
lessonOrder: 4
color: "purple"
---
# Context Window Management

Every LLM has a maximum context window. Managing what goes into that window is critical for RAG performance. You need to fit the system prompt, retrieved documents, conversation history, and the user's query into the available space.

## Context Budget

```typescript
interface ContextBudget {
  totalTokens: number;      // Model's context window
  systemPrompt: number;     // Reserved for system instructions
  conversationHistory: number; // Reserved for chat history
  retrievedContext: number;  // Available for RAG documents
  outputReserve: number;    // Reserved for the model's response
}

function calculateBudget(modelContextWindow: number): ContextBudget {
  return {
    totalTokens: modelContextWindow,
    systemPrompt: 500,
    conversationHistory: 2000,
    retrievedContext: modelContextWindow - 500 - 2000 - 4096,
    outputReserve: 4096,
  };
}

// For Claude Sonnet (200K context):
// retrievedContext = 200000 - 500 - 2000 - 4096 = ~193K tokens
```

## Fitting Documents into Context

```typescript
function selectDocuments(
  candidates: SearchResult[],
  maxTokens: number,
  tokenCounter: (text: string) => number,
): SearchResult[] {
  const selected: SearchResult[] = [];
  let usedTokens = 0;

  for (const doc of candidates) {
    const docTokens = tokenCounter(doc.text);
    if (usedTokens + docTokens > maxTokens) break;
    selected.push(doc);
    usedTokens += docTokens;
  }

  return selected;
}
```

## Summarization for Long Contexts

When documents are too large, summarize them:

```typescript
async function summarizeForContext(
  documents: SearchResult[],
  query: string,
): Promise<string> {
  const summaries = await Promise.all(
    documents.map(async (doc) => {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-3-5-20241022',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `Summarize the following text, focusing on information relevant to: "${query}"\\n\\n${doc.text}`,
        }],
      });
      return response.content[0].text;
    })
  );

  return summaries.join('\\n\\n');
}
```

## Conversation History Management

For multi-turn conversations, keep relevant history and trim old messages:

```typescript
function trimHistory(
  messages: Message[],
  maxTokens: number,
  tokenCounter: (text: string) => number,
): Message[] {
  // Always keep the system message and the latest user message
  const trimmed: Message[] = [];
  let tokens = 0;

  // Work backward from most recent
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = tokenCounter(messages[i].content);
    if (tokens + msgTokens > maxTokens) break;
    trimmed.unshift(messages[i]);
    tokens += msgTokens;
  }

  return trimmed;
}
```

Plan your context budget carefully. More retrieved context is not always better -- irrelevant context can actually degrade response quality.
