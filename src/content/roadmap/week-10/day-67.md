---
title: "Day 67 -- Build Your Full Generative UI App"
week: 10
day: 67
phase: 3
phaseLabel: "Production"
order: 1067
type: "day"
---
# Day 67 -- Build Your Full Generative UI App

> *"Pick a theme. Build the skeleton. Get two tools rendering components. Everything else is polish."*

**Date:** Joi, 24 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** Project Setup and Core Implementation
**Phase:** Faza 3 -- Production · Week 10

---

## What You're Doing

Today you start building your fourth portfolio piece. This is not a demo or an exercise -- this is a deployable application that showcases Generative UI. You pick a theme, scaffold the project, and get the core functionality working.

Three theme options, pick the one that excites you most:

**Option A: Flight & Travel Assistant.** Users ask about flights, hotels, weather at destinations, currency conversion, packing lists. Tools render flight cards, hotel comparison tables, weather forecasts, and packing checklists.

**Option B: Dashboard Generator.** Users describe data they want to see, and the AI generates dashboard widgets: charts, KPI cards, data tables, trend indicators. "Show me this month's revenue" renders a revenue chart. "Compare Q1 vs Q2" renders a comparison table.

**Option C: Iron Pulse (Workout Planner).** Users describe fitness goals, and the AI generates workout plans, exercise cards with sets/reps/rest, progress charts, and nutrition calculators. This ties into your personal interest if you are into fitness.

Pick one. Commit. Do not overthink this.

## The Work

### Step 1: Project Setup (20 minutes)

```bash
npx create-next-app@latest gen-ui-app --typescript --tailwind --app --src-dir
cd gen-ui-app
npm install ai @ai-sdk/anthropic zod
```

Set up your project structure:

```
src/
├── app/
│   ├── page.tsx          # Main chat page
│   ├── layout.tsx        # Root layout with metadata
│   ├── actions.tsx       # Server actions with streamUI
│   └── globals.css       # Tailwind + custom styles
├── components/
│   ├── Chat.tsx          # Main chat interface
│   ├── MessageList.tsx   # Message rendering logic
│   └── ui/              # Tool-rendered components
│       ├── WeatherCard.tsx
│       ├── FlightCard.tsx
│       ├── ComparisonTable.tsx
│       ├── StatsCard.tsx
│       └── LoadingSkeletons.tsx
└── lib/
    ├── tools.ts          # Tool definitions
    └── types.ts          # Shared TypeScript types
```

### Step 2: Define Your Tools (30 minutes)

For whichever theme you chose, define at least 4 tools. Here is an example for the Travel Assistant:

```tsx
// src/lib/types.ts
export interface ToolConfig {
  name: string;
  description: string;
  category: string;
}

export const APP_CONFIG = {
  title: 'TravelAI',
  description: 'Your AI-powered travel assistant',
  systemPrompt: `You are TravelAI, an expert travel assistant.
You have tools to help users plan trips. Always use the appropriate tool:
- searchFlights: When users ask about flights between cities
- checkWeather: When users ask about weather at a destination
- compareDestinations: When users want to compare travel options
- createItinerary: When users want to plan their day/trip
For general travel advice, respond with text.
Be enthusiastic but concise. Use tools whenever possible.`,
  examplePrompts: [
    'Find flights from Bucharest to Barcelona',
    'What is the weather like in Tokyo right now?',
    'Compare Lisbon vs Porto for a weekend trip',
    'Plan a 3-day itinerary for Rome',
  ],
};
```

### Step 3: Build the Chat Shell (30 minutes)

```tsx
// src/components/Chat.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '@/app/actions';
import { APP_CONFIG } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: msgText,
    }]);
    setIsLoading(true);

    try {
      const response = await sendMessage(msgText);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
        <div>
          <h1 className="text-xl font-bold dark:text-white">{APP_CONFIG.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {APP_CONFIG.description}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            New chat
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Welcome state */}
          {messages.length === 0 && (
            <div className="mt-12 text-center">
              <h2 className="text-3xl font-bold dark:text-white mb-3">
                Welcome to {APP_CONFIG.title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {APP_CONFIG.description}. Try one of these to get started:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {APP_CONFIG.examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-sm p-4 border dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors dark:text-gray-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl px-4 py-2.5 max-w-[75%]">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-[90%]">{msg.content}</div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-1.5 px-2">
              <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t dark:border-gray-800 p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="max-w-4xl mx-auto flex gap-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${APP_CONFIG.title} anything...`}
            disabled={isLoading}
            className="flex-1 border dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Step 4: Implement At Least 2 Tools (40 minutes)

Get two tools rendering components. You can reuse and adapt components from yesterday. The key is having them work within your theme:

```tsx
// src/app/actions.tsx
'use server';

import { streamUI } from 'ai/rsc';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { APP_CONFIG } from '@/lib/types';
// Import your components...

export async function sendMessage(userMessage: string) {
  const result = await streamUI({
    model: anthropic('claude-sonnet-4-20250514'),
    system: APP_CONFIG.systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    text: ({ content }) => (
      <div className="prose dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    ),
    tools: {
      // Your themed tools here...
      // At minimum, get 2 working today
    },
  });

  return result.value;
}
```

### Step 5: Wire the Page

```tsx
// src/app/page.tsx
import Chat from '@/components/Chat';

export default function Home() {
  return <Chat />;
}
```

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TravelAI - Generative UI Travel Assistant',
  description: 'AI-powered travel planning with interactive UI components',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
```

## Key Insight

Do not try to build everything today. The goal is a working skeleton with two tools, not a finished product. Get the chat shell working, get two tools rendering components, and verify the end-to-end flow. Saturday is for polish. Sunday is for shipping. Today is for foundations. A working app with two tools is infinitely better than a broken app with six tools.

## Resources

- Everything from Days 64-66
- [Next.js project structure](https://nextjs.org/docs/getting-started/project-structure)
- [Tailwind UI Components](https://tailwindui.com/) -- design inspiration (free preview)
- [shadcn/ui](https://ui.shadcn.com/) -- component inspiration

## Done When

- [ ] You picked a theme and committed to it
- [ ] Project structure is set up and organized
- [ ] Chat shell works (send messages, see responses)
- [ ] At least 2 tools render actual components (not just text)
- [ ] Loading skeletons appear before components resolve
- [ ] Example prompts in the welcome screen work
- [ ] The app runs without errors

---

*Friday is REST. Saturday: polish everything -- smooth streaming, error states, consistent design. Sunday: ship it.*
