---
title: "Week 1: Anthropic API + Prompt Engineering"
week: 1
phase: 1
phaseLabel: "Foundations"
order: 100
type: "week-intro"
---
# Week 1: Anthropic API + Prompt Engineering

> *"The hottest new programming language is English." -- Andrej Karpathy*

**Dates:** 19-25 Mai 2026
**Phase:** Faza 1 --- Foundations
**Hours:** 16h total
**Outcome:** You can make Claude do exactly what you want, every time. You own a personal `prompts.md` toolkit you will use for the rest of the roadmap and beyond.

---

## The Big Picture

You have spent eight years mastering Angular --- components, dependency injection, RxJS, change detection, the entire mental model of declarative UI engineering. This week you start building an entirely new mental model, and the good news is that much of what you already know transfers directly.

Think of a prompt the way you think of a well-designed Angular component: it has clearly defined inputs, a predictable transformation, and a structured output. A sloppy prompt is like a 500-line component with no interfaces and inline styles --- it *works*, but nobody (including the model) can reason about it reliably. This week you will learn to write prompts that are closer to strict-mode TypeScript: typed, structured, deterministic.

By Sunday evening you will have gone from "I paste stuff into ChatGPT and hope for the best" to "I engineer prompts with XML structure, chain-of-thought reasoning, few-shot examples, and hallucination guardrails --- and I can explain *why* each technique exists." That shift is the foundation everything else in this roadmap builds on.

## This Week's Journey

| Day | Date | Topic | Hours |
|-----|------|-------|-------|
| Day 1 | Lun 19 Mai | Setup & First API Call | 2h |
| Day 2 | Mar 20 Mai | Prompt Structure | 2h |
| Day 3 | Mie 21 Mai | Roles & XML Structuring | 2h |
| Day 4 | Joi 22 Mai | Chain of Thought + Format Control | 2h |
| Day 5 | Vin 23 Mai | REST | --- |
| Day 6 | Sam 24 Mai | Few-Shot + Hallucination Control | 3h |
| Day 7 | Dum 25 Mai | Best Practices + Build prompts.md | 5h |

## What You Will Have Built

- A working TypeScript project that calls the Anthropic API
- A collection of progressively refined prompts showing clear before/after quality
- A ticket classifier powered by few-shot prompting with structured JSON output
- `prompts.md` --- your personal prompt engineering toolkit with reusable templates

## Prerequisites

- Node.js 20+ installed
- A code editor (VS Code recommended)
- An Anthropic account (free tier is enough to start)
- Curiosity and two hours a night

## Week Reflection (fill after completing)

- [ ] I can make an API call to Claude and explain every field in the response object
- [ ] I understand the difference between system prompts and user messages
- [ ] I default to XML-structured prompts without conscious effort
- [ ] I know when chain-of-thought helps and when it is overkill
- [ ] I can write few-shot examples that guide Claude to the exact output format I need
- [ ] I have strategies for preventing hallucinations in production prompts
- [ ] My `prompts.md` contains at least 5 reusable templates I will actually use
- [ ] I can explain to another developer *why* prompt engineering matters for AI engineering
- [ ] **Honest self-rating (1-10) on prompt engineering confidence:** ___
