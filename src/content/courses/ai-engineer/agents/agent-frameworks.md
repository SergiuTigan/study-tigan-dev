---
title: "Agent Frameworks"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "agents"
moduleTitle: "Agents & Tool Use"
moduleDescription: "Build AI agents that reason, plan, and take actions using tools."
lessonId: "ai-engineer/agents/agent-frameworks"
duration: "10 min"
order: 503
moduleOrder: 5
lessonOrder: 3
color: "purple"
---
# Agent Frameworks

Agent frameworks provide abstractions for building AI agents, handling the agent loop, tool management, memory, and orchestration.

## Vercel AI SDK

The Vercel AI SDK provides a lightweight, TypeScript-first approach:

```typescript
import { generateText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    weather: tool({
      description: 'Get the weather for a location',
      parameters: z.object({
        location: z.string().describe('City name'),
      }),
      execute: async ({ location }) => {
        const data = await fetchWeather(location);
        return `${data.temp}°C, ${data.condition}`;
      },
    }),
  },
  maxSteps: 5,
  prompt: 'What should I wear in Tokyo today?',
});

console.log(result.text);
```

## LangChain

LangChain provides a comprehensive framework with many integrations:

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { DynamicStructuredTool } from '@langchain/core/tools';

const model = new ChatAnthropic({ model: 'claude-sonnet-4-20250514' });

const tools = [
  new DynamicStructuredTool({
    name: 'search',
    description: 'Search the knowledge base',
    schema: z.object({ query: z.string() }),
    func: async ({ query }) => searchKnowledgeBase(query),
  }),
];

const agent = createToolCallingAgent({ llm: model, tools, prompt });
const executor = new AgentExecutor({ agent, tools });

const result = await executor.invoke({
  input: 'Find information about Angular signals',
});
```

## Choosing a Framework

```
Framework       | Best For                    | Complexity
────────────────|─────────────────────────────|──────────
Vercel AI SDK   | Simple agents, web apps     | Low
LangChain       | Complex chains, many tools  | Medium
Custom          | Full control, specific needs| High
```

## When to Go Custom

Build your own agent loop when:
- You need precise control over the reasoning process
- Framework abstractions add unnecessary overhead
- Your use case does not fit standard agent patterns
- You need specialized error handling or recovery

Most production systems end up with a mix: framework for prototyping, custom code for production.
