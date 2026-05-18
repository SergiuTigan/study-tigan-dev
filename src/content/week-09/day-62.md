# Day 62 -- AI SDK: The Framework Your Chat App Was Missing

> *"You spent Thursday writing 150 lines of state management. Today you replace it with 10. And gain streaming, tool use, and multi-provider support for free."*

**Date:** Sambata, 19 Iulie 2025
**Hours:** 4h · Deep work session
**Topic:** Vercel AI SDK -- streamText, useChat, Tool Use
**Phase:** Faza 3 -- Production · Week 9

---

## What You're Doing

Today you install the Vercel AI SDK and systematically eliminate every pain point you identified on Thursday. No streaming? Gone. Manual state management? Gone. Provider lock-in? Gone. No tool use? Gone.

The AI SDK is an open-source TypeScript library built by Vercel specifically for AI-powered applications. It provides three layers: a core library for LLM interaction (streaming, tool calling, structured output), React hooks for UI state management (useChat, useCompletion), and provider adapters for switching between Anthropic, OpenAI, Google, and others with a single line change.

This is not just a convenience library. It is the standard toolkit for building AI UIs in the React/Next.js ecosystem. Learning it is as important as learning the Anthropic API itself.

## The Work

### Hour 1: Setup and Replace Manual Chat

Install the packages:

```bash
npm install ai @ai-sdk/anthropic
```

Now, look at the transformation. Here is what you are replacing:

**Thursday's API route (manual):**
```tsx
// Old: ~30 lines, no streaming, Anthropic-specific
export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: messages,
  });
  return NextResponse.json({
    content: response.content[0].text,
  });
}
```

**AI SDK API route:**

```tsx
// src/app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are a helpful AI assistant. Be concise and clear.',
    messages,
  });

  return result.toDataStreamResponse();
}
```

That is the entire API route. `streamText` calls the LLM with streaming enabled. `toDataStreamResponse()` converts the stream into a format the client hooks understand. Streaming, error handling, and proper HTTP response formatting -- all handled.

**Thursday's client component (manual):**
```tsx
// Old: ~100 lines of state management, loading, errors, scrolling
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
// ... sendMessage function, error handling, manual updates
```

**AI SDK client component:**

```tsx
// src/components/Chat.tsx
'use client';

import { useChat } from 'ai/react';
import { useRef, useEffect } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, stop } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">AI Chat</h1>
      </header>

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
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-500">
              Thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm">
            {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
```

Run it. Send a message. Watch the response stream in token by token. Click "Stop" to abort mid-response. All of Thursday's pain points -- solved.

What `useChat` gives you for free:
- `messages` -- full conversation history with proper types
- `input` and `handleInputChange` -- controlled input state
- `handleSubmit` -- form submission that sends messages to `/api/chat`
- `isLoading` -- whether a response is being generated
- `error` -- any errors that occurred
- `stop` -- abort the current streaming response
- `reload` -- retry the last message
- `append` -- programmatically add messages

### Hour 2: Understanding streamText In Depth

`streamText` is the core function. Let's explore its full capabilities:

```tsx
// src/app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are a helpful AI assistant. Be concise and clear.',
    messages,

    // Temperature (0-1, lower = more deterministic)
    temperature: 0.7,

    // Max tokens for the response
    maxTokens: 2048,

    // Callback when streaming starts
    onStart: () => {
      console.log('Stream started');
    },

    // Callback for each token
    onToken: (token) => {
      // Useful for logging or real-time processing
    },

    // Callback when streaming finishes
    onFinish: (result) => {
      console.log('Finished. Tokens used:', result.usage);
      // Save to database, log to analytics, etc.
    },
  });

  return result.toDataStreamResponse();
}
```

### Hour 3: Adding Tool Use

This is where the AI SDK truly shines. Remember how complex tool use was with the raw API? The multi-turn loop, the response parsing, the result formatting? Watch this:

```tsx
// src/app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are a helpful AI assistant with access to tools. Use them when appropriate.',
    messages,
    maxSteps: 5, // Allow up to 5 tool calls per response
    tools: {
      getWeather: tool({
        description: 'Get the current weather for a location',
        parameters: z.object({
          location: z.string().describe('The city name'),
          unit: z.enum(['celsius', 'fahrenheit']).default('celsius'),
        }),
        execute: async ({ location, unit }) => {
          // In production, call a real weather API
          const mockWeather = {
            location,
            temperature: unit === 'celsius' ? 22 : 72,
            unit,
            condition: 'Partly cloudy',
            humidity: 65,
          };
          return mockWeather;
        },
      }),

      calculate: tool({
        description: 'Perform a mathematical calculation',
        parameters: z.object({
          expression: z.string().describe('The math expression to evaluate'),
        }),
        execute: async ({ expression }) => {
          try {
            // Simple and safe evaluation
            const result = Function(`'use strict'; return (${expression})`)();
            return { expression, result: Number(result) };
          } catch {
            return { expression, error: 'Invalid expression' };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
```

On the client side, you can render tool calls and results:

```tsx
// Updated Chat component -- tool call rendering
{messages.map((message) => (
  <div key={message.id}>
    {/* Regular text content */}
    {message.content && (
      <div
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
    )}

    {/* Tool invocations */}
    {message.toolInvocations?.map((toolInvocation) => (
      <div key={toolInvocation.toolCallId} className="flex justify-start my-2">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm">
          <p className="font-mono text-amber-700">
            Tool: {toolInvocation.toolName}
          </p>
          {'result' in toolInvocation && (
            <pre className="mt-1 text-gray-600">
              {JSON.stringify(toolInvocation.result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    ))}
  </div>
))}
```

Try it: "What is the weather in Bucharest?" or "Calculate 15% of 2450." The AI will call the appropriate tool, get the result, and incorporate it into its response. The `maxSteps: 5` parameter allows the AI to chain multiple tool calls if needed.

### Hour 4: Understanding the Architecture

Here is how all the pieces fit together:

```
Client (Browser)                    Server (Next.js)
──────────────────                  ─────────────────────
useChat() hook                      API Route (/api/chat)
  ├── manages messages state        ├── streamText()
  ├── handles input                 │   ├── calls LLM
  ├── sends POST to /api/chat       │   ├── handles tool calls
  ├── reads SSE stream              │   ├── streams response
  ├── updates messages as           │   └── returns DataStream
  │   tokens arrive                 └── toDataStreamResponse()
  ├── handles errors
  └── provides stop/reload

Data flow:
  User types → handleSubmit → POST /api/chat
  → streamText calls Anthropic → tokens stream back
  → useChat reads stream → updates messages → UI re-renders
```

The AI SDK uses Server-Sent Events (SSE) under the hood. The server streams tokens as they arrive from the LLM. The client reads this stream and updates the UI in real time. This is why the response appears word by word instead of all at once.

## Key Insight

The AI SDK is not just a convenience wrapper. It is an architectural pattern. It separates concerns perfectly: the server route handles AI logic (model selection, system prompts, tools, streaming), while the client hook handles UI state (messages, input, loading, errors). This separation maps cleanly onto Next.js's Server/Client Component model. The API route is server-only code. The chat component is client-only code. The AI SDK bridges them with a streaming protocol. This is the architecture you will use for every AI application going forward.

## Resources

- [AI SDK Documentation](https://sdk.vercel.ai/docs) -- the complete reference
- [AI SDK - streamText](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text)
- [AI SDK - useChat](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat)
- [AI SDK - Tool Calling](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [AI SDK - Anthropic Provider](https://sdk.vercel.ai/providers/ai-sdk-providers/anthropic)

## Done When

- [ ] You replaced the manual chat with AI SDK (streamText + useChat)
- [ ] Responses stream in token by token
- [ ] The stop button works to abort mid-response
- [ ] You added at least one tool (weather or calculator)
- [ ] Tool calls appear in the chat UI with their results
- [ ] You can explain the data flow: useChat -> API route -> streamText -> LLM -> stream back
- [ ] You feel the difference between Thursday's manual approach and today's SDK approach

---

*Tomorrow: Multi-provider support and rich tool use. Your chat app becomes a powerhouse.*
