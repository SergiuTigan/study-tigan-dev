---
title: "Day 63 -- AI SDK Deep: Multi-Provider + Rich Tools"
week: 9
day: 63
phase: 3
phaseLabel: "Production"
order: 963
type: "day"
---
# Day 63 -- AI SDK Deep: Multi-Provider + Rich Tools

> *"One line change to switch from Claude to GPT-4. Four tools that make your chatbot actually useful. A polished UI that looks like you spent a week on it."*

**Date:** Duminica, 20 Iulie 2025
**Hours:** 5h · Full session
**Topic:** Multi-Provider Architecture + Rich Tool Implementation + UI Polish
**Phase:** Faza 3 -- Production · Week 9

---

## What You're Doing

Today is the capstone of your React/Next.js/AI SDK week. You take yesterday's chat app and elevate it from a demo to a portfolio-worthy piece. Three objectives: multi-provider support (switch between Anthropic and OpenAI with one line), rich tools that do genuinely useful things, and a polished UI that handles every edge case.

By the end of today, you will have a chat application that rivals commercial products in architecture -- if not in polish. More importantly, you will have the complete AI SDK mental model that carries you into next week's Generative UI work.

## The Work

### Hour 1: Multi-Provider Support

The AI SDK's killer feature is provider abstraction. Install the OpenAI provider:

```bash
npm install @ai-sdk/openai
```

Add the API key to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

Now, the magic. Your API route supports both providers:

```tsx
// src/app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Provider registry -- add more as needed
const models: Record<string, ReturnType<typeof anthropic | typeof openai>> = {
  'claude-sonnet': anthropic('claude-sonnet-4-20250514'),
  'claude-haiku': anthropic('claude-haiku-4-20250514'),
  'gpt-4o': openai('gpt-4o'),
  'gpt-4o-mini': openai('gpt-4o-mini'),
};

export async function POST(req: Request) {
  const { messages, model: modelId = 'claude-sonnet' } = await req.json();

  const model = models[modelId];
  if (!model) {
    return new Response(`Unknown model: ${modelId}`, { status: 400 });
  }

  const result = streamText({
    model,
    system: `You are a helpful AI assistant with access to tools.
Use tools when they would help answer the user's question.
Always be clear about what tool you used and what the result means.`,
    messages,
    maxSteps: 5,
    tools: {
      // Tools defined below...
    },
  });

  return result.toDataStreamResponse();
}
```

On the client, add a model selector:

```tsx
// In your Chat component
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

const MODELS = [
  { id: 'claude-sonnet', label: 'Claude Sonnet', provider: 'Anthropic' },
  { id: 'claude-haiku', label: 'Claude Haiku', provider: 'Anthropic' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
];

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState('claude-sonnet');

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
  } = useChat({
    body: { model: selectedModel }, // Sent with every request
  });

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white dark:bg-gray-900">
      {/* Header with model selector */}
      <header className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h1 className="text-xl font-bold dark:text-white">AI Chat</h1>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="border rounded px-3 py-1 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} ({m.provider})
            </option>
          ))}
        </select>
      </header>

      {/* ...rest of chat UI */}
    </div>
  );
}
```

One dropdown. Same chat. Different provider. The tool definitions work identically across providers -- the AI SDK normalizes the tool calling format.

### Hours 2-3: Rich Tool Implementation

Now let's build tools that are genuinely useful, not just demos.

```tsx
// src/lib/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: 'Get current weather for any city. Use when the user asks about weather, temperature, or outdoor conditions.',
  parameters: z.object({
    city: z.string().describe('City name, e.g., "Bucharest" or "New York"'),
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius')
      .describe('Temperature unit preference'),
  }),
  execute: async ({ city, unit }) => {
    // Using Open-Meteo (free, no API key needed)
    try {
      // First, geocode the city
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );
      const geoData = await geoRes.json();

      if (!geoData.results?.length) {
        return { error: `City "${city}" not found` };
      }

      const { latitude, longitude, name, country } = geoData.results[0];
      const tempUnit = unit === 'celsius' ? 'celsius' : 'fahrenheit';

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=${tempUnit}`
      );
      const weatherData = await weatherRes.json();
      const current = weatherData.current;

      return {
        city: name,
        country,
        temperature: current.temperature_2m,
        unit: unit === 'celsius' ? 'C' : 'F',
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
      };
    } catch (e) {
      return { error: 'Failed to fetch weather data' };
    }
  },
});

export const calculatorTool = tool({
  description: 'Perform mathematical calculations. Supports basic arithmetic, percentages, and common math functions.',
  parameters: z.object({
    expression: z.string().describe('Math expression, e.g., "15% of 2450" or "sqrt(144) + 3^2"'),
    description: z.string().optional().describe('What this calculation represents'),
  }),
  execute: async ({ expression, description }) => {
    try {
      // Normalize common patterns
      let normalized = expression
        .replace(/(\d+)%\s*of\s*(\d+)/gi, '($1/100)*$2')
        .replace(/sqrt\(([^)]+)\)/gi, 'Math.sqrt($1)')
        .replace(/(\d+)\^(\d+)/g, 'Math.pow($1,$2)')
        .replace(/pi/gi, 'Math.PI');

      const result = Function(`'use strict'; return (${normalized})`)();

      return {
        expression,
        result: Number(result.toFixed(6)),
        description: description || undefined,
      };
    } catch {
      return { expression, error: 'Could not evaluate expression' };
    }
  },
});

export const urlSummarizerTool = tool({
  description: 'Fetch and summarize the content of a URL. Use when the user shares a link and wants to know what it contains.',
  parameters: z.object({
    url: z.string().url().describe('The URL to fetch and summarize'),
  }),
  execute: async ({ url }) => {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AI-Chat-Bot/1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { url, error: `HTTP ${response.status}` };
      }

      const html = await response.text();

      // Basic HTML to text extraction
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000); // First 3000 chars

      // Extract title
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'No title';

      return {
        url,
        title,
        contentPreview: textContent.slice(0, 500) + '...',
        fullContent: textContent,
        contentLength: textContent.length,
      };
    } catch (e) {
      return {
        url,
        error: e instanceof Error ? e.message : 'Failed to fetch URL',
      };
    }
  },
});

export const dateTimeTool = tool({
  description: 'Get current date, time, timezone information, or calculate date differences. Use for any time-related questions.',
  parameters: z.object({
    query: z.enum([
      'current',
      'difference',
      'add',
    ]).describe('Type of date operation'),
    timezone: z.string().default('Europe/Bucharest')
      .describe('IANA timezone, e.g., "Europe/Bucharest", "America/New_York"'),
    fromDate: z.string().optional().describe('Start date for difference calc (ISO format)'),
    toDate: z.string().optional().describe('End date for difference calc (ISO format)'),
    addDays: z.number().optional().describe('Number of days to add to current date'),
  }),
  execute: async ({ query, timezone, fromDate, toDate, addDays }) => {
    const now = new Date();

    if (query === 'current') {
      return {
        datetime: now.toLocaleString('en-US', { timeZone: timezone }),
        timezone,
        iso: now.toISOString(),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone }),
      };
    }

    if (query === 'difference' && fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const diffMs = to.getTime() - from.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return {
        from: fromDate,
        to: toDate,
        days: diffDays,
        weeks: Math.round(diffDays / 7 * 10) / 10,
        months: Math.round(diffDays / 30.44 * 10) / 10,
      };
    }

    if (query === 'add' && addDays) {
      const future = new Date(now.getTime() + addDays * 24 * 60 * 60 * 1000);
      return {
        from: now.toISOString().split('T')[0],
        addedDays: addDays,
        result: future.toLocaleDateString('en-US', { timeZone: timezone }),
        dayOfWeek: future.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone }),
      };
    }

    return { error: 'Invalid query parameters' };
  },
});
```

Wire them into the API route:

```tsx
// src/app/api/chat/route.ts
import { weatherTool, calculatorTool, urlSummarizerTool, dateTimeTool } from '@/lib/tools';

// In the streamText call:
tools: {
  getWeather: weatherTool,
  calculate: calculatorTool,
  summarizeUrl: urlSummarizerTool,
  dateTime: dateTimeTool,
},
```

### Hours 4-5: Polish the UI

Now make it look professional. Create a complete, polished chat component:

```tsx
// src/components/Chat.tsx
'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';

const MODELS = [
  { id: 'claude-sonnet', label: 'Claude Sonnet', provider: 'Anthropic' },
  { id: 'claude-haiku', label: 'Claude Haiku', provider: 'Anthropic' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
];

const EXAMPLE_PROMPTS = [
  'What is the weather in Bucharest right now?',
  'Calculate 15% of 2,450 RON',
  'What day is it 100 days from now?',
  'Summarize the content of https://react.dev',
];

function ToolResult({ invocation }: { invocation: any }) {
  if (!('result' in invocation)) {
    return (
      <div className="text-sm text-amber-600 dark:text-amber-400 animate-pulse">
        Running {invocation.toolName}...
      </div>
    );
  }

  const result = invocation.result;

  if (result.error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
        <span className="text-red-600 dark:text-red-400">Error: {result.error}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-mono">
        {invocation.toolName}
      </div>
      <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState('claude-sonnet');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setInput,
  } = useChat({
    body: { model: selectedModel },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">AI Chat</h1>
          <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
            4 tools
          </span>
        </div>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          {/* Welcome state */}
          {messages.length === 0 && (
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to AI Chat</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Ask anything. I have tools for weather, math, URLs, and dates.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="text-left text-sm p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.content && (
                <div
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              )}

              {message.toolInvocations?.map((invocation) => (
                <div key={invocation.toolCallId} className="ml-2">
                  <ToolResult invocation={invocation} />
                </div>
              ))}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 text-sm">{error.message}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex gap-2 items-end"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 disabled:opacity-50"
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          )}
        </form>
        <p className="text-center text-xs text-gray-400 mt-2">
          Using {MODELS.find(m => m.id === selectedModel)?.label} -- AI can make mistakes
        </p>
      </div>
    </div>
  );
}
```

### Dark Mode Setup

Add dark mode support in your layout:

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-white dark:bg-gray-900">{children}</body>
    </html>
  );
}
```

## Key Insight

The multi-provider pattern is not just a nice-to-have. It is an architectural decision that protects your application. When Anthropic has an outage, you switch to OpenAI. When OpenAI raises prices, you route to Claude Haiku. When a new model launches on Google, you add one line. The AI SDK's provider abstraction makes your application provider-agnostic at the framework level. Build every AI application this way.

## Resources

- [AI SDK - Providers](https://sdk.vercel.ai/providers) -- full list of supported providers
- [AI SDK - Tools](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [AI SDK - Multi-step Tool Calls](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling#multi-step-calls)
- [Open-Meteo API](https://open-meteo.com/en/docs) -- free weather API used in the weather tool
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)

## Done When

- [ ] Model selector works -- you can switch between Anthropic and OpenAI mid-conversation
- [ ] All 4 tools work: weather (real API), calculator, URL summarizer, date/time
- [ ] Tool calls display nicely in the chat UI with loading states
- [ ] Dark mode works
- [ ] Example prompts in the welcome screen
- [ ] Mobile responsive
- [ ] Error states handled gracefully
- [ ] You can demo this app to someone and they would be impressed

---

*Week 9 complete. You went from zero React to a production-quality AI chat app with multi-provider support and tool use. Next week: Generative UI -- where the AI returns actual React components instead of text.*
