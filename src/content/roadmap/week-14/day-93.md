---
title: "Day 93 — Backend Scaffold + AI Core"
week: 14
day: 93
phase: 4
phaseLabel: "Portfolio"
order: 1493
type: "day"
---
# Day 93 — Backend Scaffold + AI Core

> *"Get the AI talking first. Everything else is UI."*

**Date:** Tuesday, 19 August 2025
**Hours:** 2h · Evening session
**Topic:** Backend Setup & AI Integration
**Phase:** Faza 4 — Portfolio + Job Hunt · Week 14

---

## What You're Doing

Today you go from blank folder to working backend. By the end of this session, you should be able to hit an API endpoint and get an AI response back. That's the goal. Everything else is secondary.

The temptation will be to set up perfect folder structures, configure linters, add auth. Resist. You need a working AI endpoint. Period.

## The Work

### 1. Project Scaffold (20 min)

```bash
npx create-next-app@latest project-name --typescript --tailwind --eslint --app --src-dir
cd project-name
```

Install core dependencies:
```bash
npm install ai @ai-sdk/openai  # or @ai-sdk/anthropic
npm install zod               # for input validation
npm install prisma @prisma/client  # if using database
```

Set up environment:
```
# .env.local
OPENAI_API_KEY=sk-...
# or ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=...
```

Add `.env.local` to `.gitignore` (it should already be there).

### 2. AI Endpoint (40 min)

This is the core. Create your main API route:

```typescript
// src/app/api/chat/route.ts (or whatever your core endpoint is)
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `Your system prompt here — this is where your app's personality lives`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

Test it immediately:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

If you get an AI response back, you've won the day. Everything else is bonus.

### 3. Database Schema (30 min)

If your project needs persistence:

```bash
npx prisma init
```

Define your schema based on yesterday's data model. Keep it minimal:

```prisma
model Conversation {
  id        String   @id @default(cuid())
  title     String?
  messages  Message[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Message {
  id             String       @id @default(cuid())
  role           String
  content        String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  conversationId String
  createdAt      DateTime     @default(now())
}
```

Push to database:
```bash
npx prisma db push
```

### 4. Verify Everything Works (30 min)

- [ ] `npm run dev` starts without errors
- [ ] AI endpoint returns a response
- [ ] Database connects (if applicable)
- [ ] Environment variables load correctly

## Tips for Efficiency

- **Use GPT-4o-mini for development.** It's fast and cheap. Switch to GPT-4o or Claude for production prompts later.
- **Don't write the perfect system prompt today.** Get a working one. You'll iterate on Thursday.
- **Skip auth.** Unless auth IS the feature, add it last (or never for a portfolio project).
- **Copy patterns from your Faza 3 work.** You've built this before. Reuse what works.

## Key Insight

The backend scaffold should take 20 minutes if you've done Faza 2-3 properly. The AI endpoint is where you spend real time. This is your product's engine — make sure it runs before you build the car around it.

## Done When

- [ ] Next.js project created and running locally
- [ ] AI endpoint created and returning responses
- [ ] System prompt drafted (first version)
- [ ] Database schema defined and connected (if needed)
- [ ] Environment variables configured
- [ ] You can hit the API and get an AI response

---

*Tomorrow: Frontend scaffold. You'll build the UI that wraps around today's backend.*
