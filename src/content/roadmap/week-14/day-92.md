---
title: "Day 92 — Plan + Architecture + Wireframe"
week: 14
day: 92
phase: 4
phaseLabel: "Portfolio"
order: 1492
type: "day"
---
# Day 92 — Plan + Architecture + Wireframe

> *"Hours of planning save days of debugging."*

**Date:** Monday, 18 August 2025
**Hours:** 2h · Evening session
**Topic:** Project Architecture & Planning
**Phase:** Faza 4 — Portfolio + Job Hunt · Week 14

---

## What You're Doing

Today you plan everything. No code. Not a single line. You're creating the blueprint that makes Tuesday-through-Sunday flow instead of stumble.

This is the most important day of the project week. Engineers who skip planning spend Thursday debugging architecture mistakes instead of building the core AI flow. You won't make that mistake.

## The Work

### 1. One-Page Architecture Doc (45 min)

Create a document (Notion, Google Doc, or right in your repo) covering:

**Project Overview**
- What it does in one sentence
- Who it's for
- What problem it solves

**Tech Stack**
- Next.js 14+ (App Router)
- AI: OpenAI API / Anthropic API / Vercel AI SDK
- Database: Supabase / Planetscale / Neon
- Deployment: Vercel
- Styling: Tailwind CSS + shadcn/ui

**System Architecture**
```
User Input → Frontend (React) → API Route → AI Provider → Response Processing → Database (optional) → Frontend Display
```

**AI Integration Points**
- What prompts will you need?
- What model(s)?
- Streaming or batch responses?
- What context/data does the AI need?
- Estimated cost per interaction

**Data Model**
- What entities do you need? (Users, conversations, sessions, etc.)
- Sketch the schema — even 3-4 tables is enough
- What needs to persist vs. what's ephemeral?

### 2. User Flows (30 min)

Map 2-3 core user journeys:

```
Flow 1: First-time user
Landing → Sign up (optional) → Core interaction → Result → Save/Share

Flow 2: Returning user
Login → History → Continue session → New interaction

Flow 3: The "demo flow"
This is what you'll show in your video. Map it step by step.
```

### 3. Component Breakdown (20 min)

List every component you'll need:

```
Layout:
  - Header (logo, nav)
  - Sidebar (optional)
  - Main content area
  - Footer

Core:
  - ChatInterface / InputForm
  - ResponseDisplay
  - HistoryList
  - LoadingState

Shared:
  - Button, Input, Card (from shadcn/ui)
```

### 4. Wireframe (25 min)

Sketch the main screens. Paper, Excalidraw, or Figma — doesn't matter. You need:
- Landing/home page
- Main interaction page (this is 80% of your app)
- Results/output display
- Any secondary pages

Keep it ugly. Wireframes that look pretty waste time.

## Key Insight

The architecture doc isn't for you today — it's for you on Thursday when you're deep in the AI integration and can't remember why you structured the data that way. It's also for the interviewer who opens your repo and sees you think before you code.

## Done When

- [ ] One-page architecture document complete
- [ ] Tech stack decided (no more debating)
- [ ] 2-3 user flows mapped out
- [ ] Component list drafted
- [ ] Wireframes for main screens sketched
- [ ] AI integration points identified (prompts, models, context)
- [ ] Data model / schema drafted
- [ ] You could explain this project to someone in 30 seconds

---

*Tomorrow: Backend scaffold + AI core. You'll go from zero to working API endpoints in 2 hours.*
