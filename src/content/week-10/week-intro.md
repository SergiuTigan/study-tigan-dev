# Week 10: Generative UI

> *"What if the AI didn't just tell you the weather -- it showed you a weather card with an interactive forecast graph?"*

**Dates:** 21-27 Iulie 2025
**Phase:** Faza 3 -- Production
**Hours this week:** ~19h
**Theme:** When AI Returns Components, Not Text

---

## Why This Week Exists

Last week you built a chat app where the AI returns text. Sometimes that text describes data -- weather conditions, calculation results, URL summaries. Your tools fetch real data, but the AI still communicates through prose. "The weather in Bucharest is 28 degrees Celsius with partly cloudy skies and 45% humidity."

This week, the AI stops returning text for tool results and starts returning React components. An interactive weather card. A chart that you can hover over. A comparison table with sortable columns. A booking form with live validation. The AI decides what component to render based on the conversation context. The component streams in with a loading state, then resolves to a fully interactive element.

This is Generative UI, and it is the most visually impressive capability in the AI SDK ecosystem. It is also your fourth portfolio piece -- and it will be the biggest one yet.

## The Paradigm Shift

Traditional AI chat:
```
User: "What's the weather in Bucharest?"
AI: "The weather in Bucharest is currently 28°C with partly cloudy skies..."
```

Generative UI:
```
User: "What's the weather in Bucharest?"
AI: [streams a loading skeleton → renders a WeatherCard component
     with temperature, forecast graph, humidity gauge, and a
     "See 5-day forecast" button that actually works]
```

The difference is not cosmetic. It is functional. The rendered component can have buttons, forms, animations, and state. The AI is not just answering questions -- it is building interfaces on the fly.

## The Week Arc

**Monday:** Understand the concept. Learn `streamUI` from `ai/rsc`. See how tools can render React components instead of returning data.

**Tuesday:** Build your first streaming component. A weather card that loads with a skeleton, then fills in with real data.

**Wednesday:** Multiple tools, multiple components. The AI dynamically chooses which component to render based on what the user asks.

**Thursday:** Start building your full Generative UI application. Pick a theme, set up the project, get the core tools working.

**Saturday:** Polish everything. Smooth streaming, error recovery, consistent design, dark mode.

**Sunday:** Ship portfolio piece #4. Deploy to Vercel. Write the README. Record the demo. This is your showpiece.

## What Success Looks Like

By Sunday night, you will have deployed an application to Vercel where users can have a natural conversation and receive interactive UI components as responses. The application will have a clear theme, multiple tool-driven components, polished design, and a demo video. This is the project that makes people say "wait, the AI built that interface?"

## Technical Prerequisites

You need everything from Week 9:
- React fundamentals (hooks, JSX, components)
- Next.js App Router (Server/Client Components, API routes)
- AI SDK basics (streamText, useChat, tool definitions)

This week builds directly on that foundation with `streamUI` and React Server Components for AI-driven interfaces.

---

**Friday (Day 68) is REST. You will need it -- Saturday and Sunday are intense.**

*Let's make AI visual.*
