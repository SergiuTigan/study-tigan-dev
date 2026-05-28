---
title: "Day 41 — Research Agent Full Build"
week: 6
day: 41
phase: 2
phaseLabel: "Deep Dive"
order: 641
type: "day"
---
# Day 41 — Research Agent Full Build

> *"A research agent isn't about replacing a researcher. It's about giving a researcher the ability to check 20 sources in 5 minutes."*

**Date:** Sambata, 28 Iunie 2026
**Hours:** 3h · Deep build session
**Topic:** Full research agent with real tools — Tavily search, web reading, working memory
**Phase:** Faza 2 — Patterns · Week 6

---

## What You're Doing

This is the build day you've been preparing for all week. Days 36-39 gave you the theory, the pattern, the error handling, and the comparison framework. Today you assemble all of that into a real, working research agent that can take a question, search the web, read actual webpages, take notes, and produce a cited research brief.

This isn't a toy. You're building something genuinely useful — a tool you'll actually use to research technical topics faster. It's also your third portfolio piece: a tangible demonstration that you can build autonomous AI systems.

The agent will have four real tools: web search via Tavily, webpage reading via Readability, a note-taking tool for working memory, and a finish tool for producing the final answer. The system prompt will encode your research methodology: search multiple formulations, read multiple sources, look for contradictions, cite everything.

Three hours. One agent. Let's go.

## The Work

### Step 1: Set Up Tavily API (20 min)

Tavily is a search API built specifically for AI agents. It returns clean, structured results without the noise of Google's SERPs.

```bash
# Get API key from https://tavily.com/
# Add to .env
echo "TAVILY_API_KEY=tvly-your-key-here" >> .env
```

```typescript
// src/tools/webSearch.ts
import { z } from 'zod';

const TavilyResponseSchema = z.object({
  results: z.array(z.object({
    title: z.string(),
    url: z.string(),
    content: z.string(),
    score: z.number(),
  })),
});

export async function tavilySearch(query: string): Promise<string> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: 5,
      include_answer: false,
      search_depth: 'advanced',
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
  }

  const data = TavilyResponseSchema.parse(await response.json());

  return data.results.map((r, i) =>
    `[${i + 1}] "${r.title}"\n    URL: ${r.url}\n    ${r.content.substring(0, 300)}...`
  ).join('\n\n');
}
```

### Step 2: Webpage Reader (20 min)

Use Mozilla's Readability algorithm (via a library) to extract clean text from webpages:

```typescript
// src/tools/readWebpage.ts
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export async function readWebpage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Research Agent)',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(10000), // 10s timeout
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    throw new Error(`Could not extract content from ${url}`);
  }

  // Truncate to avoid context window issues
  const maxChars = 3000;
  const content = article.textContent.substring(0, maxChars);

  return `Title: ${article.title}\nURL: ${url}\n\nContent:\n${content}`;
}
```

### Step 3: Working Memory — The Notes Tool (15 min)

This is the secret weapon. Agents forget between steps because their "memory" is just the message history. A notes tool gives them a persistent scratchpad:

```typescript
// src/tools/notes.ts
interface NotesStore {
  entries: Array<{
    key: string;
    content: string;
    source?: string;
    timestamp: number;
  }>;
}

export function createNotesStore(): NotesStore {
  return { entries: [] };
}

export function addNote(
  store: NotesStore,
  key: string,
  content: string,
  source?: string
): string {
  store.entries.push({
    key,
    content,
    source,
    timestamp: Date.now(),
  });
  return `Note saved: "${key}" (${store.entries.length} total notes)`;
}

export function getNotes(store: NotesStore): string {
  if (store.entries.length === 0) return 'No notes yet.';

  return store.entries.map((e, i) =>
    `[${i + 1}] ${e.key}: ${e.content}${e.source ? ` (Source: ${e.source})` : ''}`
  ).join('\n');
}
```

### Step 4: Assemble the Tools (15 min)

```typescript
// src/agent/tools.ts
import { Tool } from './types';
import { tavilySearch } from '../tools/webSearch';
import { readWebpage } from '../tools/readWebpage';
import { createNotesStore, addNote, getNotes } from '../tools/notes';

export function createResearchTools(): { tools: Tool[], notesStore: NotesStore } {
  const notesStore = createNotesStore();

  const tools: Tool[] = [
    {
      name: 'web_search',
      description: 'Search the web for current information. Use different search queries to find diverse sources. Returns titles, URLs, and snippets.',
      parameters: {
        query: { type: 'string', description: 'Search query — try specific, factual queries', required: true },
      },
      execute: async (args) => tavilySearch(args.query as string),
    },
    {
      name: 'read_webpage',
      description: 'Read the full content of a webpage. Use this after web_search to get detailed information from promising results.',
      parameters: {
        url: { type: 'string', description: 'URL to read', required: true },
      },
      execute: async (args) => readWebpage(args.url as string),
    },
    {
      name: 'take_notes',
      description: 'Save important findings to your working memory. Use this to track key facts, statistics, and quotes as you research.',
      parameters: {
        key: { type: 'string', description: 'Short label for this note (e.g., "market_size", "key_difference")', required: true },
        content: { type: 'string', description: 'The actual information to remember', required: true },
        source: { type: 'string', description: 'URL or source of this information', required: false },
      },
      execute: async (args) => addNote(notesStore, args.key as string, args.content as string, args.source as string | undefined),
    },
    {
      name: 'finish_research',
      description: 'Complete the research and provide your final answer. Use ONLY when you have gathered enough information from multiple sources. Your answer should cite sources.',
      parameters: {
        answer: { type: 'string', description: 'Your comprehensive research findings with citations', required: true },
      },
      execute: async (args) => args.answer as string,
    },
  ];

  return { tools, notesStore };
}
```

### Step 5: The Research Agent System Prompt (15 min)

This is where your research methodology gets encoded:

```typescript
export const RESEARCH_AGENT_SYSTEM_PROMPT = `You are an expert research agent. Your job is to thoroughly research
a question and provide a comprehensive, well-sourced answer.

## Your Research Methodology

1. **Search broadly first**: Search 2-3 different formulations of the question
   to find diverse sources. Don't just search once.

2. **Read deeply**: After searching, read at least 3 full articles.
   Don't rely on search snippets alone — they can be misleading.

3. **Take notes as you go**: Use take_notes to record key findings.
   This is your working memory. Note contradictions between sources.

4. **Look for contradictions**: If sources disagree, note both perspectives.
   Don't just pick the first answer you find.

5. **Cite everything**: Your final answer must reference specific sources.
   Use [Source: URL] format for citations.

6. **Know when to stop**: Aim for 5-8 research steps. If after 8 steps
   you haven't found clear answers, synthesize what you have.

## Rules
- NEVER make up information. If you can't find it, say so.
- ALWAYS use take_notes to save important findings before finishing.
- ALWAYS cite sources in your final answer.
- If a tool fails, try a different approach — different search query, different URL.
- Your final answer should be 300-500 words, well-structured with headers.`;
```

### Step 6: Wire It All Together (30 min)

```typescript
// src/agent/researchAgent.ts
import Anthropic from '@anthropic-ai/sdk';
import { createResearchTools } from './tools';
import { executeToolSafely, isAgentStuck, createEnhancedState } from './resilience';
import { RESEARCH_AGENT_SYSTEM_PROMPT } from './prompts';

const anthropic = new Anthropic();

export async function research(question: string): Promise<string> {
  const { tools, notesStore } = createResearchTools();
  const state = createEnhancedState(question, 12, 180000); // 12 steps, 3 min max

  console.log(`\nResearch Question: ${question}\n${'='.repeat(50)}\n`);

  while (!state.isComplete && state.steps < state.maxSteps) {
    if (isAgentStuck(state)) {
      const notes = getNotes(notesStore);
      return `[Research stopped — agent was not making progress]\n\nPartial findings:\n${notes}`;
    }

    state.steps++;
    console.log(`\n--- Step ${state.steps}/${state.maxSteps} ---`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: RESEARCH_AGENT_SYSTEM_PROMPT,
      messages: buildMessages(state),
      tools: formatToolsForAPI(tools),
    });

    for (const block of response.content) {
      if (block.type === 'text') {
        console.log(`Thinking: ${block.text.substring(0, 150)}...`);
        state.history.push({ role: 'thought', content: block.text });
      }

      if (block.type === 'tool_use') {
        console.log(`Action: ${block.name}(${JSON.stringify(block.input).substring(0, 100)})`);

        const tool = tools.find(t => t.name === block.name);
        if (!tool) {
          state.history.push({
            role: 'observation',
            content: `Unknown tool: ${block.name}`,
          });
          continue;
        }

        const result = await executeToolSafely(tool, block.input as Record<string, unknown>);

        if (result.success) {
          state.history.push({ role: 'observation', content: result.data! });

          if (block.name === 'finish_research') {
            state.isComplete = true;
            state.finalAnswer = (block.input as { answer: string }).answer;
          }
        } else {
          state.history.push({
            role: 'observation',
            content: `Tool failed: ${result.error}. Try a different approach.`,
          });
          state.errors.push({
            step: state.steps,
            toolName: block.name,
            error: result.error!,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  if (!state.isComplete) {
    const notes = getNotes(notesStore);
    return `[Research incomplete — reached step limit]\n\nGathered information:\n${notes}`;
  }

  console.log(`\nResearch complete in ${state.steps} steps.`);
  return state.finalAnswer!;
}
```

### Step 7: Test with Real Questions (45 min)

Test with progressively harder queries:

```typescript
// Easy: factual, well-documented
await research('What is the difference between Bun and Node.js runtime performance?');

// Medium: requires synthesis from multiple sources
await research('How does the AI agent market compare between 2025 and 2026?');

// Hard: requires finding contradictions
await research('Is TypeScript slower than JavaScript at runtime? What do benchmarks say?');

// Edge case: might not have a clear answer
await research('What are the security implications of MCP servers?');
```

For each test, observe:
- How many steps did the agent take?
- Did it search multiple formulations?
- Did it read enough sources?
- Did it take useful notes?
- Are the citations accurate?
- Did any tools fail? How did it recover?

## Key Insight

The notes tool transforms agent capability. Without it, the agent's "memory" is just the raw message history — a mess of search results, full articles, and thinking traces. With notes, the agent can distill information as it goes, building a structured understanding of the topic. It's the difference between reading a book and reading a book while taking notes. The notes become the foundation for the final answer.

## Resources

- [Tavily — Search API for AI Agents](https://tavily.com/)
- [Mozilla Readability — Content Extraction](https://github.com/mozilla/readability)
- [JSDOM — Server-side DOM](https://github.com/jsdom/jsdom)
- [Anthropic Tool Use — Official Docs](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)

## Done When

- [ ] Tavily search is working with real API calls
- [ ] Webpage reading extracts clean text from real URLs
- [ ] The notes tool accumulates findings across steps
- [ ] The agent searches 2-3 different query formulations
- [ ] The agent reads 3+ full webpages per research session
- [ ] Error recovery handles failed searches and unreadable pages
- [ ] You've tested with 3+ real research questions
- [ ] The final answers include citations to actual sources

---

*Tomorrow: Memory, polish, and ship. Your research agent gets conversation memory, streaming output, and a README. Then it goes to GitHub as portfolio piece #3.*
