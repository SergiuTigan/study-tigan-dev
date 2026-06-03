---
title: "Development Environment Setup"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "foundations"
moduleTitle: "Foundations"
moduleDescription: "Understand the AI engineering landscape, LLM fundamentals, pricing models, and development tooling."
lessonId: "ai-engineer/foundations/dev-environment"
duration: "10 min"
order: 104
moduleOrder: 1
lessonOrder: 4
color: "purple"
---
# Development Environment Setup

A well-configured development environment accelerates your AI engineering work. This lesson covers the essential tools, SDKs, and patterns for building AI applications.

## Essential Tools

```bash
# Node.js / TypeScript stack
npm install openai @anthropic-ai/sdk ai

# Python stack (for some ML tooling)
pip install openai anthropic langchain

# Vector database client
npm install @pinecone-database/pinecone
```

## API Key Management

Never hardcode API keys. Use environment variables:

```bash
# .env (add to .gitignore!)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PINECONE_API_KEY=...
```

```typescript
// Load environment variables
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

## Your First LLM Call

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Explain what an AI engineer does in 2 sentences.' },
  ],
});

console.log(message.content[0].text);
```

## Project Structure

A typical AI application project:

```
my-ai-app/
├── src/
│   ├── prompts/          # Prompt templates
│   │   ├── summarize.ts
│   │   └── classify.ts
│   ├── chains/           # Multi-step workflows
│   ├── tools/            # Tool definitions for agents
│   ├── retrieval/        # RAG pipeline components
│   ├── evaluation/       # Eval scripts and metrics
│   └── index.ts
├── data/                 # Test data, documents
├── evals/                # Evaluation datasets
├── .env                  # API keys (gitignored)
└── package.json
```

## Development Workflow

1. **Prototype** in a playground or notebook to test prompts.
2. **Extract** prompts into template files.
3. **Test** with evaluation datasets.
4. **Iterate** on prompts and retrieval strategies.
5. **Deploy** with monitoring and guardrails.

Start simple. The simplest approach that meets your requirements is the best approach.
