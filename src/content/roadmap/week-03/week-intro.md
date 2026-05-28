---
title: "Week 3 — Mastery, Prompt Caching & Vision"
week: 3
phase: 1
phaseLabel: "Foundations"
order: 300
type: "week-intro"
---
# Week 3 — Mastery, Prompt Caching & Vision

> *"The difference between a junior and senior engineer isn't what they know — it's the absence of unknown unknowns."*

**Dates:** 2-8 Iunie 2026
**Hours:** ~16h total
**Phase:** Faza 1 — Foundations (Final Week)
**Outcome:** Prompt caching saves 90% on repeated prompts. Vision opens multimodal. Faza 1 DONE.

---

## The Big Picture

This is the week where everything clicks.

Weeks 1 and 2 gave you the vocabulary: API calls, streaming, tool use, structured output, cost tracking. You can build things. But there is a gap between "can build things" and "builds things well." Week 3 closes that gap.

You will start by pressure-testing your knowledge against two external courses — DeepLearning.AI and Anthropic's own official curriculum. These are not about learning new concepts from scratch. They are about finding the blind spots, the edge cases you did not encounter, the production patterns that only show up when someone with ten thousand hours of experience walks you through their workflow. Every "oh, I didn't know that" moment this week is a bug you are fixing in your mental model.

Then you unlock two capabilities that change the game. **Vision** turns Claude from a text processor into something that can see — screenshots, documents, diagrams, receipts. The interface between the physical world and AI reasoning opens up. **Prompt caching** is the single biggest cost optimization technique in AI engineering. One annotation on your system message and repeated requests cost 90% less. For production systems that handle thousands of requests with shared context, this is not an optimization — it is a requirement.

The week ends with a full retrospective. You will refactor your CLI tool into something you would be proud to show in an interview. You will test every edge case. You will write documentation that explains not just what your code does, but what you learned building it.

When Sunday night arrives, Faza 1 is complete. You will have gone from "I know what an API key is" to "I can build, optimize, and debug multimodal AI applications with cost awareness and production error handling." That is not a small thing.

---

## The Week at a Glance

| Day | Date | Hours | Focus |
|-----|------|-------|-------|
| **15** | Lun 2 Iun | 2h | DeepLearning.AI Course Part 1 |
| **16** | Mar 3 Iun | 2h | DeepLearning.AI Course Part 2 |
| **17** | Mie 4 Iun | 2h | Anthropic Official Courses |
| **18** | Joi 5 Iun | 2h | Vision (Multimodal) |
| **19** | Vin 6 Iun | -- | REST |
| **20** | Sam 7 Iun | 3h | Prompt Caching |
| **21** | Dum 8 Iun | 5h | Faza 1 Review: Refactor & Polish |

---

## What You Will Build

- **Vision integration** in your CLI tool — the `--image` flag that lets you send screenshots, photos, and documents alongside text prompts
- **Prompt caching** implementation — the `cache_control` annotation that slashes costs on repeated system prompts
- **A polished CLI tool** — refactored, tested, documented, ready for Faza 2
- **A complete Faza 1 retrospective** — what worked, what surprised you, what you would do differently

## Key Themes

**Closing knowledge gaps.** The courses are not busywork. They are calibration. You are measuring your understanding against expert benchmarks and patching every hole.

**Multimodal thinking.** Once Claude can see images, every problem with a visual component becomes solvable. Screenshot-to-code. Receipt-to-structured-data. Error-screenshot-to-debug-suggestion. The design space explodes.

**Cost engineering.** Prompt caching is where AI engineering meets business reality. A system prompt cached across thousands of requests is the difference between a viable product and a budget-burning experiment.

**Professional polish.** Week 3 ends with the kind of work that separates portfolio projects from toy projects: error handling, edge case testing, documentation, architecture thinking.

---

## Transition to Faza 2

When this week is done, you will have mastered the **how** of working with Claude. Faza 2 answers a different question entirely:

> *"How do I give the model the right information?"*

That means RAG (Retrieval-Augmented Generation), embeddings, vector databases, contextual retrieval, and the art of building systems where the AI has access to your data — not just your instructions. The foundation you built in Faza 1 is what makes Faza 2 possible.

---

*Let's finish strong. Day 15 starts Monday.*
