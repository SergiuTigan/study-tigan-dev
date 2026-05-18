# Day 58 -- Next.js App Router: Server-First Changes Everything

> *"Imagine Angular Universal was the default and you had to opt-IN to client-side rendering. That's Next.js App Router."*

**Date:** Marti, 15 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** Next.js App Router for AI Applications
**Phase:** Faza 3 -- Production · Week 9

---

## What You're Doing

Today you encounter the single biggest mental shift since you started this roadmap. Not because Next.js is complicated -- it is actually simpler than Angular in many ways -- but because it inverts a fundamental assumption you have held for eight years: **components run on the server by default.**

In Angular, everything is client-side. Your components ship JavaScript to the browser. The browser executes them. If you want server rendering, you bolt on Angular Universal and fight with it. Next.js flips this. Every component is a Server Component unless you explicitly mark it otherwise. Server Components run on the server, render HTML, and send zero JavaScript to the client.

This is not SSR in the Angular Universal sense. Server Components never hydrate. They never run on the client at all. They can directly access your database, read files, use environment secrets -- things that would be insane in an Angular component. Client Components (marked with `'use client'`) behave like the Angular components you know: they ship JS, they manage state, they handle events.

For AI applications, this is transformative. Your LLM calls, your RAG retrieval, your vector search -- all of that happens in Server Components. Only the chat input and streaming display need to be Client Components.

## The Work

### Setting Up

```bash
npx create-next-app@latest my-ai-app --typescript --tailwind --app --src-dir
cd my-ai-app
npm run dev
```

That is it. No `ng generate module`, no `angular.json` to configure, no environment files to set up. You get TypeScript, Tailwind, and the App Router out of the box.

### File-Based Routing (The Angular Router Comparison)

Forget `RouterModule.forRoot([...])`. In Next.js, your folder structure IS your routes:

```
app/
├── page.tsx              → /
├── layout.tsx            → wraps all pages (like app.component.html)
├── loading.tsx           → loading state (like a route resolver spinner)
├── error.tsx             → error boundary
├── about/
│   └── page.tsx          → /about
├── blog/
│   ├── page.tsx          → /blog
│   └── [slug]/
│       └── page.tsx      → /blog/my-post (dynamic route)
├── dashboard/
│   ├── layout.tsx        → nested layout for dashboard/*
│   ├── page.tsx          → /dashboard
│   └── settings/
│       └── page.tsx      → /dashboard/settings
└── api/
    └── chat/
        └── route.ts      → /api/chat (API endpoint)
```

**Angular equivalent mapping:**

```
Angular                          → Next.js
──────────────────────────────────────────────
app-routing.module.ts            → folder structure
{ path: '', component: Home }    → app/page.tsx
{ path: 'about', ... }          → app/about/page.tsx
{ path: ':id', ... }            → app/[id]/page.tsx
<router-outlet>                  → {children} in layout.tsx
Route guards                     → middleware.ts
Lazy-loaded modules              → automatic (every page is lazy)
```

### Server Components vs Client Components

This is the core concept. Understand this and everything else follows.

```tsx
// app/dashboard/page.tsx
// This is a SERVER COMPONENT (default, no directive needed)

import { db } from '@/lib/database';  // Direct DB access!

async function DashboardPage() {
  // This runs on the SERVER. Not in the browser. Ever.
  const stats = await db.query('SELECT count(*) FROM users');
  const secretKey = process.env.API_SECRET; // Safe! Never sent to client.

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Total users: {stats.count}</p>
      {/* This component CAN be async. Angular components cannot. */}
    </div>
  );
}

export default DashboardPage;
```

```tsx
// components/Counter.tsx
'use client'; // THIS DIRECTIVE makes it a Client Component

import { useState } from 'react';

// This ships JavaScript to the browser.
// It can use hooks, event handlers, browser APIs.
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}

export default Counter;
```

**The rule is simple:** Server by default. Add `'use client'` only when you need interactivity (useState, useEffect, onClick, onChange, etc.).

### Composing Server + Client Components

Here is where it gets powerful. You can nest Client Components inside Server Components:

```tsx
// app/page.tsx (Server Component)
import { db } from '@/lib/db';
import ChatInterface from '@/components/ChatInterface'; // Client Component

async function HomePage() {
  // Fetch data on the server
  const recentChats = await db.getRecentChats();

  return (
    <main>
      <h1>AI Chat</h1>
      {/* Server-rendered list, zero JS */}
      <aside>
        <h2>Recent Chats</h2>
        <ul>
          {recentChats.map(chat => (
            <li key={chat.id}>{chat.title}</li>
          ))}
        </ul>
      </aside>

      {/* Client component for interactivity */}
      <ChatInterface initialChats={recentChats} />
    </main>
  );
}
```

```tsx
// components/ChatInterface.tsx
'use client';

import { useState } from 'react';

interface Chat { id: string; title: string; }

function ChatInterface({ initialChats }: { initialChats: Chat[] }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    setMessages([...messages, input]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setMessages(prev => [...prev, data.reply]);
  };

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatInterface;
```

### Layouts: The app.component.html Equivalent

```tsx
// app/layout.tsx -- ROOT layout, like your index.html + app.component combined
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
        <main>{children}</main>  {/* This is <router-outlet> */}
        <footer>Built with AI</footer>
      </body>
    </html>
  );
}
```

### Special Files

```tsx
// app/loading.tsx -- shown while page is loading (Suspense boundary)
export default function Loading() {
  return <div className="animate-pulse">Loading...</div>;
}

// app/error.tsx -- shown when page throws
'use client'; // Error boundaries must be client components

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/not-found.tsx -- 404 page
export default function NotFound() {
  return <h1>Page not found</h1>;
}
```

### API Routes (Your Express/NestJS Replacement)

```tsx
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  // Call your LLM here
  const reply = `You said: ${message}`;

  return NextResponse.json({ reply });
}

// GET, PUT, DELETE also work
export async function GET() {
  return NextResponse.json({ status: 'healthy' });
}
```

This is where your AI API calls will live. No separate Express server needed.

## Key Insight

The Server Component / Client Component split maps perfectly to AI application architecture. Server Components handle the heavy lifting: database queries, API key management, LLM calls, RAG retrieval. Client Components handle the thin interactive layer: chat input, streaming display, button clicks. This is not an accident. Next.js App Router was designed with this exact pattern in mind. The framework's architecture matches your application's architecture.

## Resources

- [Next.js Documentation - App Router](https://nextjs.org/docs/app) -- the canonical reference
- [Next.js Learn Course](https://nextjs.org/learn) -- interactive tutorial, very good
- [Server Components explained](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [When to use Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

## Done When

- [ ] You have a running Next.js app with the App Router
- [ ] You can explain the difference between Server and Client Components without hesitation
- [ ] You created at least 3 routes using file-based routing
- [ ] You have a layout.tsx wrapping your pages
- [ ] You built an API route at `/api/chat` that returns a JSON response
- [ ] You can explain when to use `'use client'` and when not to

---

*Tomorrow: Server Actions -- where Next.js makes your HttpClient.post() calls feel ancient.*
