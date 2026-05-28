---
title: "Day 99 — Plan + Architecture + Wireframe (Project #2)"
week: 15
day: 99
phase: 4
phaseLabel: "Portfolio"
order: 1599
type: "day"
---
# Day 99 — Plan + Architecture + Wireframe (Project #2)

> *"The best plans are written by people who've already shipped something."*

**Date:** Monday, 25 August 2025
**Hours:** 2h · Evening session
**Topic:** Project #2 Architecture & Planning
**Phase:** Faza 4 — Portfolio + Job Hunt · Week 15

---

## What You're Doing

Same drill as Day 92, but faster. You've done this before. The architecture doc, user flows, component breakdown, wireframes — all of it. The difference is you now know what actually matters and what was wasted effort last week.

Spend less time on the wireframe. Spend more time on the AI integration design. That's where the complexity lives.

## The Work

### 1. Architecture Doc (30 min)

Same template as last week, but focus on what's *different* about this project:

- **What AI pattern are you using?** (If Project #1 was chat completion, this should be RAG, tool use, or agentic.)
- **What data does the AI need access to?** (Documents, APIs, user history, structured data?)
- **What makes this technically interesting?** (This is what you'll talk about in interviews.)

Write the architecture doc in 30 min. You already know the tech stack. Don't re-debate Next.js vs. everything else.

### 2. User Flows (20 min)

Map 2-3 flows. Prioritize the demo flow — the one you'll record on Sunday. Make it compelling:

- What's the "before" state? (User has a problem.)
- What's the "after" state? (AI solved it.)
- What's the "wow" moment? (The thing that makes someone pause.)

### 3. Component Breakdown (15 min)

List components. Reuse from Project #1 where possible:
- Layout components → probably identical
- UI primitives → already installed (shadcn/ui)
- AI-specific components → these are new

### 4. Wireframe (15 min)

Sketch the main screens. Paper is fine. Focus on the main interaction screen — that's 80% of the app.

### 5. AI Integration Design (40 min)

This is where you spend the extra time this week:

**If using RAG:**
- What documents/data are you indexing?
- What embedding model?
- What vector store? (Pinecone, Supabase pgvector, Chroma)
- What chunk size/overlap?
- How do you handle retrieval failures?

**If using tool use:**
- What tools does the AI have access to?
- What are the function schemas?
- How do you validate tool outputs?
- What happens if a tool call fails?

**If using agents:**
- What's the agent loop?
- What are the stop conditions?
- How do you prevent infinite loops?
- What's the maximum iteration count?

## Key Insight

Planning is faster the second time because you know what you don't know. Last week's surprises become this week's anticipated challenges. Document those challenges explicitly — "This will be hard because X. My plan to handle it: Y."

## Done When

- [ ] Architecture doc complete (faster than last week)
- [ ] AI integration design detailed (more thorough than last week)
- [ ] User flows mapped with clear demo flow
- [ ] Component breakdown with reuse notes
- [ ] Wireframes sketched
- [ ] You can explain the technical differentiator in one sentence

---

*Tomorrow: Backend scaffold + AI core. Same start, different engine.*
