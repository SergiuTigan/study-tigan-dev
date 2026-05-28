---
title: "Week 2 — Streaming, Tool Use & Structured Outputs"
week: 2
phase: 1
phaseLabel: "Foundations"
order: 200
type: "week-intro"
---
# Week 2 — Streaming, Tool Use & Structured Outputs

> *"The best AI tools don't feel like AI at all. They feel like fast, reliable software."*

**Dates:** 26 Mai -- 1 Iunie 2025
**Total Hours:** ~17h
**Phase:** Faza 1 -- Foundations
**Outcome:** A working CLI tool that streams responses, uses tools, tracks costs, and outputs structured JSON. Your first portfolio piece.

---

## The Big Picture

Week 1 gave you the mental model: tokens, messages, system prompts, temperature. You can talk to Claude through the API. You understand what's happening under the hood.

Now you build things that *work like real software*.

This week is where your Angular engineering background becomes a superpower. Everything you're about to learn -- streaming data, orchestrating async flows, validating schemas, managing state -- these are patterns you've been doing for eight years. The domain is new. The engineering discipline is not.

By Sunday, you'll push your first AI project to GitHub. Not a tutorial. Not a demo. A real CLI tool with real architecture.

---

## The Week at a Glance

| Day | Date | Topic | Hours | Key Concept |
|-----|------|-------|-------|-------------|
| 8 | Lun 26 Mai | Streaming Responses | 2h | Server-sent events, perceived latency |
| 9 | Mar 27 Mai | Tool Use (Basic) | 2h | The tool-use loop, security model |
| 10 | Mie 28 Mai | Multi-Tool & Agent Loop | 2h | The agent loop -- core of every AI agent |
| 11 | Joi 29 Mai | Structured Outputs | 2h | Schema-level guarantees with tool_choice |
| 12 | Vin 30 Mai | **REST** | -- | Recharge |
| 13 | Sam 31 Mai | Token Economics | 3h | Cost tracking, model cascade strategy |
| 14 | Dum 1 Iunie | CLI Project #1: Ship It | 5h | Combine everything, push to GitHub |

---

## What You'll Build

The week culminates in **CLI Project #1** -- a conversational command-line tool that:

- **Streams** Claude's responses in real time (character by character)
- **Uses tools** -- at least two external tools Claude can call (weather, URL fetching, calculations, or your own ideas)
- **Outputs structured JSON** when asked, validated against Zod schemas
- **Tracks costs** across the entire conversation with a CostTracker class
- **Maintains conversation memory** across turns

This is not a toy. This is the same architecture pattern behind Claude Code, Cursor, and every serious AI-powered CLI tool.

---

## Why This Week Matters

There's a specific moment in every AI engineer's journey where the technology stops feeling like magic and starts feeling like *infrastructure*. That moment happens when you implement the agent loop for the first time.

The agent loop is deceptively simple:

```
while (true) {
  response = await claude.createMessage(messages)
  if (response.stop_reason === 'end_turn') break
  // process tool calls, append results, continue
}
```

Six lines of pseudocode. But these six lines are the beating heart of every AI agent, every coding assistant, every autonomous system being built today. When you understand this loop -- really understand it -- you'll see it everywhere.

---

## Angular Parallels

Your Angular background maps directly to this week's concepts:

| Angular Concept | AI Engineering Equivalent |
|----------------|--------------------------|
| `AsyncPipe` + Observables | Streaming responses with async iterators |
| HTTP Interceptors | Tool use middleware (you intercept, execute, return) |
| Reactive Forms + Validators | Structured outputs + Zod validation |
| `NgRx` action/reducer loop | The agent loop (message -> tool_call -> tool_result -> repeat) |
| Environment configs | Model selection + cost management |

You're not starting from zero. You're translating.

---

## Prerequisites Check

Before starting this week, confirm:

- [x] Anthropic API key is set as `ANTHROPIC_API_KEY` environment variable
- [x] TypeScript project from Week 1 compiles and runs
- [x] You can make a basic `client.messages.create()` call and get a response
- [x] You understand the Messages API structure (role, content, model, max_tokens)

If any of these are missing, revisit Week 1 Day 6-7 before proceeding.

---

## How to Use These Pages

Each day is a standalone article. You can:

1. **Read it in one sitting** before you start coding (10-15 min)
2. **Follow the Build section** as a hands-on lab
3. **Use the Done When checklist** to confirm completion
4. **Reference the Resources** for deeper dives

The pages are designed to work in Notion as individual pages linked from your main roadmap. Each one should feel like opening a Medium article -- context, depth, practical examples, and a clear finish line.

---

## End-of-Week Goal

By Sunday night, you will have:

1. A GitHub repository with a working CLI tool
2. A README that explains architecture decisions
3. A CostTracker that shows exactly how much your conversations cost
4. Your first real piece in your AI Engineering portfolio
5. The deep, practical understanding that *AI agents are just loops with tools*

Let's build.

---

*First up: [Day 8 -- Streaming Responses](/day-08.md) -- making Claude feel instant.*
