# Day 60 -- Build a Next.js Chat App (Raw API Calls)

> *"Before you use the library, build the thing the library replaces. Then you'll actually understand why the library exists."*

**Date:** Joi, 17 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** Chat Application with Anthropic SDK (No AI SDK)
**Phase:** Faza 3 -- Production · Week 9

---

## What You're Doing

Today you build a working chat application using Next.js and the raw Anthropic SDK. No AI SDK. No useChat hook. No streaming helpers. Just you, an API route, fetch calls, and state management.

Why build it the hard way first? Because on Saturday when you switch to the AI SDK and watch it handle all of this in 10 lines of code, you will understand exactly what those 10 lines are doing. You will know where the streaming happens, why the message format matters, and what error states the library handles for you. You earn the abstraction.

This is also a completeness check. You have been calling the Anthropic API from Node.js CLI tools. Now you are calling it from a Next.js API route, consumed by a React client component. The full stack is assembled.

## The Work

### Step 1: Create the Project

```bash
npx create-next-app@latest ai-chat --typescript --tailwind --app --src-dir
cd ai-chat
npm install @anthropic-ai/sdk
```

Create your environment file:

```bash
# .env.local (Next.js reads this automatically)
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 2: The API Route

```tsx
// src/app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: 'You are a helpful AI assistant. Be concise and clear.',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const assistantMessage =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'I could not generate a response.';

    return NextResponse.json({
      role: 'assistant',
      content: assistantMessage,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API Error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 3: The Chat Component

```tsx
// src/components/Chat.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">AI Chat</h1>
        <button
          onClick={clearChat}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear chat
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg">Send a message to start chatting</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Wire It Into the Page

```tsx
// src/app/page.tsx
import Chat from '@/components/Chat';

export default function Home() {
  return <Chat />;
}
```

### Step 5: Run and Test

```bash
npm run dev
```

Open `http://localhost:3000`. Send a message. Wait. See the response appear all at once (no streaming yet). Send follow-up messages and watch the conversation context work correctly.

### What This Lacks (And Why It Matters)

Test the app and notice these pain points:

1. **No streaming.** You wait 2-5 seconds staring at bouncing dots. The LLM is generating tokens incrementally, but you get them all at once.

2. **Full response blocking.** The UI is frozen during the API call. If the response is long, you wait longer.

3. **No abort.** If you change your mind, you cannot cancel the request.

4. **Manual state management.** You are managing messages, loading, errors, input -- all by hand. For a simple chat this is fine. For a complex AI app with tools, it becomes unmanageable.

5. **No tool use.** If you wanted the AI to call functions, you would need to handle the tool_use response type, call your function, send the result back, and manage the multi-turn loop manually.

6. **Provider lock-in.** Switching from Anthropic to OpenAI means rewriting the API route.

Write these pain points down. On Saturday, the AI SDK solves every single one.

## Key Insight

You just built the thing that the AI SDK replaces. Every line of state management, every loading state check, every message serialization step -- the AI SDK handles all of it. But now you understand the problem space. When useChat gives you `messages`, `input`, `handleInputChange`, `handleSubmit`, and `isLoading` for free, you will know exactly what work it is doing under the hood. This is the difference between using a library and understanding a library.

## Resources

- [Anthropic SDK for TypeScript](https://github.com/anthropics/anthropic-sdk-typescript)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React useState patterns](https://react.dev/reference/react/useState)

## Done When

- [ ] Your chat app runs locally and can hold a multi-turn conversation
- [ ] You send messages, see a loading state, and receive responses
- [ ] Conversation context works (the AI remembers previous messages)
- [ ] Error states display when something goes wrong
- [ ] You have written down specifically what the app lacks (streaming, abort, tools, etc.)
- [ ] You understand exactly what the AI SDK will need to solve

---

*Friday is REST. Saturday: AI SDK introduction -- where all of today's pain points disappear.*
