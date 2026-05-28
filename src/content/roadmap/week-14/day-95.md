---
title: "Day 95 — Core AI Flow Integration"
week: 14
day: 95
phase: 4
phaseLabel: "Portfolio"
order: 1495
type: "day"
---
# Day 95 — Core AI Flow Integration

> *"The moment the AI responds to a real user input through your UI — that's when your project becomes real."*

**Date:** Thursday, 21 August 2025
**Hours:** 2h · Evening session
**Topic:** End-to-End AI Integration
**Phase:** Faza 4 — Portfolio + Job Hunt · Week 14

---

## What You're Doing

This is the critical day. The day that determines whether your project is a portfolio piece or an abandoned repo.

You're connecting everything: user types input → frontend sends request → API processes it → AI generates response → frontend displays it in real-time. The full loop.

By the end of today, someone should be able to use your app and have a meaningful AI interaction. Not polished. Not perfect. But *working*.

## The Work

### 1. Wire Frontend to API (30 min)

Connect your UI to the backend using the Vercel AI SDK's React hooks:

```typescript
'use client';
import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
          {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

Test immediately. Type something. See if the AI responds. If yes, everything else today is refinement.

### 2. Refine the System Prompt (30 min)

Now that you can see AI responses in context, iterate on your system prompt:

- Is the tone right for your app?
- Is it too verbose? Too terse?
- Does it stay in character/role?
- Does it handle edge cases (empty input, off-topic questions)?

Test with 10+ different inputs:
- Normal use case
- Edge case (very short input)
- Edge case (very long input)
- Off-topic input
- Adversarial input ("ignore your instructions")

### 3. Handle Streaming (20 min)

Make sure the response streams in real-time (not all-at-once):
- Token-by-token display
- Cursor/typing indicator while streaming
- Smooth scroll to latest message
- Disable input while AI is responding

### 4. Add Context/State Management (25 min)

Depending on your project:
- **Conversation history** — messages persist within session
- **User context** — AI knows relevant user info
- **Session management** — save/load conversations
- **Tool use** — if your AI calls external APIs or functions

### 5. Error Handling (15 min)

Handle the things that will break:
- API rate limits → show user-friendly message
- Network errors → retry button
- Empty responses → fallback message
- Timeout → loading indicator + timeout message

## Tips for Efficiency

- **If streaming doesn't work, try non-streaming first.** Get the data flowing, then add streaming.
- **Console.log everything.** Request payload, API response, parsed data. You need visibility.
- **Test in incognito.** Cached state causes weird bugs.
- **If stuck on CORS or API errors for 15+ min,** check the Vercel AI SDK docs. The answer is almost always there.

## Key Insight

This is where most portfolio projects die. Not because the code is hard, but because developers get stuck on a bug, lose momentum, and never come back. Set a timer. If something is broken for 20 minutes, take a different approach. The goal is a working flow, not perfect code.

## Done When

- [ ] User can type input and see AI response in the UI
- [ ] Responses stream in real-time
- [ ] System prompt produces appropriate responses
- [ ] Conversation context maintained across messages
- [ ] Error states handled gracefully
- [ ] You've tested with 10+ different inputs
- [ ] The core "magic moment" of your app works

---

*Tomorrow: Rest day. Let your subconscious debug. Saturday you polish and deploy.*
