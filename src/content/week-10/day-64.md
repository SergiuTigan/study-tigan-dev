# Day 64 -- Generative UI: When AI Returns Components

> *"Text is the lowest-bandwidth interface between an AI and a human. Components are higher. Interactive components are highest."*

**Date:** Luni, 21 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** The Generative UI Concept and streamUI
**Phase:** Faza 3 -- Production · Week 10

---

## What You're Doing

Today you learn the concept behind Generative UI and the core API that powers it: `streamUI` from `ai/rsc`. This is a fundamentally different pattern from last week's `streamText`. With `streamText`, the AI generates text tokens that stream into a chat bubble. With `streamUI`, the AI generates React components that stream into the page.

Think about what this means. When a user asks "show me flights from Bucharest to London," the AI does not respond with a paragraph of text listing flight options. Instead, it triggers a flight search tool that first yields a loading skeleton (shimmer cards, animated placeholders), then resolves to a full `FlightResults` component with sortable columns, clickable booking buttons, and price comparisons. The component is interactive. The user can filter, sort, and take action without leaving the chat.

This is not science fiction. This is the `ai/rsc` module in the AI SDK, and you are going to build it today.

## The Work

### The Core Architecture

Traditional `streamText` flow:
```
User input → API route → streamText → text tokens → chat bubble
```

Generative UI `streamUI` flow:
```
User input → Server Action → streamUI → React components → chat stream
            ↓
            tool called? → yield Loading component
                         → execute tool
                         → return Result component
```

The key differences:
1. `streamUI` lives in a **Server Action**, not an API route
2. Tools have a `generate` function that returns **React components**
3. Components can yield an intermediate loading state, then return the final UI
4. The client receives a stream of **renderable React elements**, not text

### streamUI Basics

```tsx
// src/app/actions.tsx
'use server';

import { streamUI } from 'ai/rsc';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// A simple loading component
function FlightSearchLoading() {
  return (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-8 bg-gray-200 rounded w-full" />
      <div className="h-8 bg-gray-200 rounded w-full" />
      <div className="h-8 bg-gray-200 rounded w-full" />
    </div>
  );
}

// The actual flight results component
interface Flight {
  airline: string;
  departure: string;
  arrival: string;
  price: number;
  duration: string;
}

function FlightResults({ flights, from, to }: {
  flights: Flight[];
  from: string;
  to: string;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
        <h3 className="font-semibold">
          Flights: {from} → {to}
        </h3>
        <p className="text-sm text-gray-500">{flights.length} results</p>
      </div>
      <div className="divide-y">
        {flights.map((flight, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div>
              <p className="font-medium">{flight.airline}</p>
              <p className="text-sm text-gray-500">
                {flight.departure} → {flight.arrival} · {flight.duration}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">${flight.price}</p>
              <button className="text-sm text-blue-600 hover:underline">
                Book now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function chat(userMessage: string) {
  const result = await streamUI({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are a helpful travel assistant. When users ask about flights, use the searchFlights tool.`,
    messages: [{ role: 'user', content: userMessage }],
    text: ({ content }) => <p className="whitespace-pre-wrap">{content}</p>,
    tools: {
      searchFlights: {
        description: 'Search for flights between two cities',
        parameters: z.object({
          from: z.string().describe('Departure city'),
          to: z.string().describe('Arrival city'),
          date: z.string().optional().describe('Travel date'),
        }),
        generate: async function* ({ from, to, date }) {
          // Yield loading state immediately
          yield <FlightSearchLoading />;

          // Simulate API call (replace with real API)
          await new Promise(resolve => setTimeout(resolve, 1500));

          const flights: Flight[] = [
            { airline: 'TAROM', departure: '06:30', arrival: '08:45', price: 189, duration: '2h 15m' },
            { airline: 'Wizz Air', departure: '10:15', arrival: '12:30', price: 89, duration: '2h 15m' },
            { airline: 'Ryanair', departure: '14:00', arrival: '16:20', price: 69, duration: '2h 20m' },
            { airline: 'British Airways', departure: '18:45', arrival: '21:00', price: 249, duration: '2h 15m' },
          ];

          // Return the final component
          return <FlightResults flights={flights} from={from} to={to} />;
        },
      },
    },
  });

  return result.value;
}
```

Let's break down what is happening:

1. **`streamUI`** replaces `streamText`. It works with React components instead of text.

2. **`text`** is a render function for when the AI responds with plain text (prose, explanations, follow-up questions). It wraps the text in a React element.

3. **Tools have `generate` instead of `execute`.** The `generate` function is an async generator (`async function*`) that can `yield` intermediate states and `return` the final component.

4. **`yield <FlightSearchLoading />`** immediately sends the loading skeleton to the client. The user sees something happening instantly.

5. **`return <FlightResults ... />`** sends the final interactive component.

### Client-Side Consumption

```tsx
// src/app/page.tsx
'use client';

import { useState } from 'react';
import { chat } from './actions';

export default function ChatPage() {
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string | React.ReactNode }[]
  >([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // The server action returns a React element (streamable UI)
      const response = await chat(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Travel Assistant</h1>

      <div className="space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={message.role === 'user' ? 'text-right' : 'text-left'}
          >
            {typeof message.content === 'string' ? (
              <span className={`inline-block rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100'
              }`}>
                {message.content}
              </span>
            ) : (
              // This renders the streamed React component!
              <div className="max-w-lg">{message.content}</div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search flights, hotels, or ask anything..."
          className="flex-1 border rounded-lg px-4 py-2"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

Notice: `message.content` can be either a `string` (user messages) or a `React.ReactNode` (AI responses). When it is a ReactNode, you render it directly. The streamed component just works -- it shows the loading skeleton first, then swaps to the final flight results.

### Why This Is Powerful

1. **Interactive results.** The "Book now" button can trigger more server actions. The flight list can be sorted. Forms can be submitted. These are real React components with full interactivity.

2. **AI decides the UI.** The AI chooses which tool to call based on the conversation. "Search flights" renders FlightResults. "What's the weather?" renders a WeatherCard. "Compare hotels" renders a ComparisonTable. The AI is the router for your UI.

3. **Streaming loading states.** The `yield` keyword gives you instant visual feedback. No more staring at a spinner wondering if anything is happening.

4. **Type-safe.** The tool parameters use Zod schemas. The component props are typed. You get full TypeScript safety end to end.

## Key Insight

Generative UI is the bridge between chatbots and applications. A chatbot answers questions with text. An application provides interactive interfaces for completing tasks. Generative UI lets you build an application that creates its own interfaces based on what the user needs. The AI is not replacing your frontend -- it is dynamically assembling it from components you designed. You control the building blocks. The AI controls the composition.

## Resources

- [AI SDK RSC Documentation](https://sdk.vercel.ai/docs/ai-sdk-rsc) -- the streamUI reference
- [AI SDK - Generative UI](https://sdk.vercel.ai/docs/ai-sdk-rsc/generative-ui) -- concept guide
- [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) -- production example using these patterns
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

## Done When

- [ ] You understand the difference between `streamText` (text) and `streamUI` (components)
- [ ] You can explain the `yield` (loading) then `return` (result) pattern in tool generators
- [ ] You built a working example where a tool renders a React component
- [ ] The loading state streams before the final component appears
- [ ] You see the potential: the AI choosing what UI to render based on conversation context

---

*Tomorrow: Building real streaming components. Weather cards, not just flight lists. Making "What's the weather?" render a beautiful card instead of text.*
