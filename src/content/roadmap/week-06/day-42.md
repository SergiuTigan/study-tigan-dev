---
title: "Day 42 — Memory + Polish + Ship"
week: 6
day: 42
phase: 2
phaseLabel: "Deep Dive"
order: 642
type: "day"
---
# Day 42 — Memory + Polish + Ship

> *"A project isn't done when it works. It's done when someone else can understand it, use it, and trust it."*

**Date:** Duminica, 29 Iunie 2026
**Hours:** 5h · Full build day
**Topic:** Conversation memory, polishing, documentation, shipping portfolio piece #3
**Phase:** Faza 2 — Patterns · Week 6

---

## What You're Doing

Five hours. One mission. Ship your research agent.

Yesterday you got it working. Today you make it production-worthy. That means adding conversation memory so the agent can reference past research sessions, polishing the error handling and output formatting, writing documentation that a stranger can follow, and pushing it to GitHub.

This is the discipline that separates hobbyists from professionals. Anyone can build a demo. Shipping requires you to care about the parts nobody sees — the error messages, the edge cases, the README that explains how to actually run the thing.

By the end of today, you'll have three portfolio pieces on GitHub. You're building a real body of work.

## The Work

### Hour 1-2: Conversation Memory

Your agent currently has *working memory* (the notes tool) but no *long-term memory*. Each research session starts from scratch. Let's fix that.

The pattern: summarize past conversations and include the summary in the system prompt.

```typescript
// src/memory/conversationMemory.ts
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ConversationRecord {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  sources: string[];
}

interface MemoryStore {
  conversations: ConversationRecord[];
  summary: string;
}

const MEMORY_PATH = './data/memory.json';

export async function loadMemory(): Promise<MemoryStore> {
  try {
    const data = await fs.readFile(MEMORY_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { conversations: [], summary: '' };
  }
}

export async function saveConversation(
  question: string,
  answer: string,
  sources: string[]
): Promise<void> {
  const memory = await loadMemory();

  memory.conversations.push({
    id: crypto.randomUUID(),
    question,
    answer: answer.substring(0, 500), // Keep summaries, not full answers
    timestamp: Date.now(),
    sources,
  });

  // Re-summarize if we have more than 5 conversations
  if (memory.conversations.length > 5) {
    memory.summary = await summarizeHistory(memory.conversations);
    // Keep only last 3 full conversations, rest is in summary
    memory.conversations = memory.conversations.slice(-3);
  }

  await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
  await fs.writeFile(MEMORY_PATH, JSON.stringify(memory, null, 2));
}
```

The summarization uses a cheap, fast model — Haiku — because it's a simple task:

```typescript
const anthropic = new Anthropic();

async function summarizeHistory(
  conversations: ConversationRecord[]
): Promise<string> {
  const historyText = conversations.map(c =>
    `Q: ${c.question}\nA: ${c.answer.substring(0, 200)}\nSources: ${c.sources.join(', ')}`
  ).join('\n---\n');

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Summarize these past research conversations in 3-5 bullet points.
Focus on: topics covered, key findings, and useful sources found.

${historyText}`,
    }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

Inject memory into the system prompt:

```typescript
function buildSystemPromptWithMemory(memory: MemoryStore): string {
  let memorySection = '';

  if (memory.summary) {
    memorySection += `\n## Past Research Summary\n${memory.summary}\n`;
  }

  if (memory.conversations.length > 0) {
    memorySection += `\n## Recent Conversations\n`;
    for (const conv of memory.conversations) {
      memorySection += `- "${conv.question}" → Key finding: ${conv.answer.substring(0, 150)}...\n`;
    }
  }

  return RESEARCH_AGENT_SYSTEM_PROMPT + memorySection;
}
```

### Hour 3: Polish

**Error handling sweep:**

```typescript
// Validate environment on startup
function validateEnvironment(): void {
  const required = ['ANTHROPIC_API_KEY', 'TAVILY_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in your API keys.');
    process.exit(1);
  }
}
```

**Progress output — show the user what's happening:**

```typescript
function logStep(step: number, maxSteps: number, action: string, detail: string): void {
  const progress = `[${step}/${maxSteps}]`;
  const bar = '='.repeat(Math.round((step / maxSteps) * 20)).padEnd(20, '-');
  console.log(`${progress} [${bar}] ${action}: ${detail}`);
}

// In the agent loop:
logStep(state.steps, state.maxSteps, 'SEARCH', `"${query}"`);
logStep(state.steps, state.maxSteps, 'READ', url);
logStep(state.steps, state.maxSteps, 'NOTE', key);
logStep(state.steps, state.maxSteps, 'DONE', 'Composing final answer');
```

**Streaming the final answer:**

```typescript
async function streamFinalAnswer(answer: string): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('RESEARCH FINDINGS');
  console.log('='.repeat(60) + '\n');

  // Simulate streaming for readability
  const words = answer.split(' ');
  for (let i = 0; i < words.length; i += 3) {
    const chunk = words.slice(i, i + 3).join(' ');
    process.stdout.write(chunk + ' ');
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  console.log('\n');
}
```

**Clean CLI interface:**

```typescript
// src/index.ts
import { research } from './agent/researchAgent';
import { saveConversation, loadMemory } from './memory/conversationMemory';

async function main(): Promise<void> {
  validateEnvironment();

  const question = process.argv.slice(2).join(' ');

  if (!question) {
    console.log('Usage: npx tsx src/index.ts "Your research question here"');
    console.log('Example: npx tsx src/index.ts "What are the best practices for RAG in 2026?"');
    process.exit(0);
  }

  console.log(`\nResearching: "${question}"\n`);

  const startTime = Date.now();
  const answer = await research(question);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  await streamFinalAnswer(answer);

  console.log(`\nCompleted in ${duration}s`);

  // Save to memory
  const sources = extractUrls(answer);
  await saveConversation(question, answer, sources);
}

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s\]]+/g;
  return [...new Set(text.match(urlRegex) || [])];
}

main().catch(console.error);
```

### Hour 4: README + Documentation

Write a README that passes the "stranger test" — could someone who's never seen your code run it in 5 minutes?

```markdown
# Research Agent

An autonomous AI research agent that searches the web, reads sources,
takes structured notes, and produces cited research briefs.

Built with Claude Sonnet, Tavily Search API, and Mozilla Readability.

## Features

- **ReAct Architecture**: Think → Act → Observe → Repeat
- **Multi-source research**: Searches multiple formulations, reads 3+ sources
- **Working memory**: Takes notes as it researches
- **Conversation memory**: Remembers past research sessions
- **Error recovery**: Handles API failures, timeouts, and stuck states
- **Cited answers**: Every claim references a source

## Quick Start

    git clone <your-repo-url>
    cd research-agent
    npm install
    cp .env.example .env
    # Add your ANTHROPIC_API_KEY and TAVILY_API_KEY to .env
    npx tsx src/index.ts "Your research question"

## Architecture

    [Question] → [Agent Loop] → [Tool Selection] → [Search/Read/Note] → [Final Answer]
                      ↑                                    |
                      └────────────────────────────────────┘

## Example

    $ npx tsx src/index.ts "How does Bun compare to Node.js for production use?"

    [1/12] SEARCH: "Bun vs Node.js production 2026"
    [2/12] READ: https://...
    [3/12] NOTE: "bun_performance" — 3x faster startup...
    ...

## Configuration

| Variable | Description |
|----------|-------------|
| ANTHROPIC_API_KEY | Claude API key |
| TAVILY_API_KEY | Tavily search API key |

## Lessons Learned

(Write 3-5 sentences about what you learned building this)
```

### Hour 5: Ship It

```bash
# Final checks
npm run typecheck    # No TypeScript errors
npm run lint         # Clean code
npm test             # Tests pass (if you wrote any)

# Git
git add -A
git commit -m "feat: research agent with ReAct loop, memory, and error recovery"
git push origin main
```

Verify on GitHub:
- README renders properly
- .env.example exists (not .env!)
- No API keys committed
- Code is readable

## Key Insight

Conversation memory through summarization is a pattern you'll use everywhere. The trick is using a cheap model (Haiku) for the summarization — it's a simple task that doesn't need Opus. This layered approach to model selection (cheap for simple tasks, expensive for complex ones) is how you keep AI projects economically viable. Your research agent uses Sonnet for reasoning and Haiku for memory management — each model doing what it does best.

## Resources

- [Tavily API Documentation](https://tavily.com/)
- [Mozilla Readability](https://github.com/mozilla/readability)
- [GitHub README Best Practices](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)

## Done When

- [ ] Conversation memory saves and loads past research sessions
- [ ] Summaries are generated with Haiku to keep costs low
- [ ] Memory is injected into the system prompt
- [ ] Error messages are helpful and actionable
- [ ] Progress output shows what the agent is doing at each step
- [ ] CLI accepts a question as argument and outputs the answer
- [ ] README passes the "stranger test"
- [ ] .env.example exists, .env is in .gitignore
- [ ] Code is pushed to GitHub
- [ ] You have three portfolio pieces shipped

---

*Next week: MCP (Model Context Protocol) and advanced agent orchestration. You'll build servers that any AI client can talk to, and agents that delegate to other agents.*
