---
title: "Week 6: Agents"
week: 6
phase: 2
phaseLabel: "Deep Dive"
order: 600
type: "week-intro"
---
# Week 6: Agents

> *"The best agent is the one you didn't need to build. But when you do need one, build it right."*

**Dates:** 23-29 Iunie 2026
**Phase:** Faza 2 — Patterns
**Hours This Week:** ~17h
**Outcome:** Working research agent with memory. Portfolio piece #3.

---

## The Big Picture

You've built RAG systems that retrieve and synthesize information. You've chained prompts together in structured workflows. But so far, **you** have been the decision-maker — you designed the exact sequence of steps, and the LLM filled in the blanks.

This week, that changes.

Agents flip the script. Instead of you deciding "first search, then read, then summarize," the LLM itself decides what to do next. It reasons about the problem, picks a tool, observes the result, and decides whether to continue or stop. The human designs the *capability*; the agent designs the *strategy*.

This is simultaneously the most exciting and most dangerous pattern in AI engineering. Exciting because it unlocks genuinely autonomous problem-solving. Dangerous because agents fail in spectacular, unpredictable ways — looping forever, hallucinating tool calls, burning through tokens on dead ends.

The Anthropic paper "Building Effective Agents" will be your bible this week. Its core thesis is counterintuitive: **use workflows when you can, agents when you must.** Most tasks that seem like they need an agent actually work better as a well-designed workflow. True agents should be reserved for problems where the search space is too large to predetermine the steps.

## What You'll Build

Your portfolio piece this week is a **Research Agent** — an autonomous system that can take a question, search the web, read multiple sources, take notes, detect contradictions, and produce a cited research brief. It will have:

- **ReAct architecture** (Reasoning + Acting loop)
- **Multi-step error recovery** with exponential backoff
- **Working memory** through a note-taking tool
- **Conversation memory** through summarization
- **Stuck detection** to avoid infinite loops

By Sunday, this ships to GitHub as your third portfolio piece.

## Daily Breakdown

| Day | Focus | Hours |
|-----|-------|-------|
| Day 36 (Lun) | Agent Theory — the foundational paper | 2h |
| Day 37 (Mar) | ReAct Pattern — build your first agent loop | 2h |
| Day 38 (Mie) | Workflows vs Agents — taxonomy and comparison | 2h |
| Day 39 (Joi) | Multi-Step & Error Recovery | 2h |
| Day 40 (Vin) | REST | -- |
| Day 41 (Sam) | Research Agent Full Build | 3h |
| Day 42 (Dum) | Memory + Polish + Ship | 5h |

## Key Concepts This Week

- **ReAct Loop:** Think → Act → Observe → Repeat
- **Tool Safety:** Every tool call can fail. Plan for it.
- **Working Memory:** Agents forget between steps unless you give them a scratchpad.
- **Stuck Detection:** If 3 steps produce no new info, stop.
- **The Agent Spectrum:** Prompt chaining → Routing → Parallelization → Orchestrator-Worker → Full Agent

---

*Let's build something that thinks for itself.*
