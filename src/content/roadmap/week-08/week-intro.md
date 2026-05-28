---
title: "Week 8: Evaluations"
week: 8
phase: 2
phaseLabel: "Deep Dive"
order: 800
type: "week-intro"
---
# Week 8: Evaluations

> *"If you can't measure it, you can't improve it. And in AI, if you aren't measuring, you're guessing."*

**Dates:** 7-13 Iulie 2026
**Phase:** Faza 2 — Patterns (Final Week)
**Hours This Week:** ~17h
**Outcome:** Eval framework. Faza 2 complete.

---

## The Big Picture

This is the final week of Faza 2, and it's dedicated to the skill that most AI engineers skip: **evaluation**.

Here's the dirty secret of AI engineering. Most developers ship AI features by vibing. They try a prompt, look at a few outputs, think "that looks about right," and push to production. Then they get bug reports that are impossible to reproduce because the system is non-deterministic. They try to fix the prompt, and it helps for one case but breaks three others. They have no way to know if a change is an improvement or a regression.

Evaluations fix this. An eval is a systematic way to measure how well your AI system performs across a range of inputs. It's the difference between "I think this prompt is better" and "this prompt scores 4.2/5 on correctness across 30 test cases, compared to 3.8 for the previous version."

This week you'll build a complete evaluation framework: a golden dataset, an LLM-as-judge scoring system, multi-model comparison, and A/B testing for prompts. By Sunday, you'll have a reusable eval pipeline that you can apply to any AI system you build.

And then Faza 2 is complete.

## Daily Breakdown

| Day | Focus | Hours |
|-----|-------|-------|
| Day 50 (Lun) | Eval Mental Model — why and how | 2h |
| Day 51 (Mar) | Build Golden Dataset — 30 test cases | 2h |
| Day 52 (Mie) | LLM-as-Judge — automated scoring | 2h |
| Day 53 (Joi) | Multi-Model Comparison — Opus vs Sonnet vs Haiku | 2h |
| Day 54 (Vin) | REST | -- |
| Day 55 (Sam) | A/B Test Prompts — systematic prompt optimization | 3h |
| Day 56 (Dum) | Faza 2 Review — polish, retrospective, prep for Faza 3 | 5h |

## Key Concepts This Week

- **Golden Dataset:** A curated set of test cases with expected answers
- **LLM-as-Judge:** Using a stronger model to score a weaker model's outputs
- **Score Distribution:** AI isn't pass/fail — it's score distributions you compare
- **Multi-Model Comparison:** Same eval, different models, compare quality/cost/latency
- **Eval-Driven Development:** Hypothesis → Variant → Eval → Compare → Ship winner

## Why This Matters

Without evals, every AI decision is a guess:
- "Should I use Opus or Sonnet?" → Guess
- "Is this new prompt better?" → Guess
- "Does adding examples help?" → Guess
- "Is temperature 0.3 or 0.7 better?" → Guess

With evals, every decision is data:
- "Sonnet scores 4.1 on this task at 1/15th the cost of Opus (4.3)" → Decision
- "The structured prompt scores 4.4 vs baseline 3.8, p < 0.05" → Decision
- "Adding 3 examples improves score from 3.6 to 4.2" → Decision

---

*This week, you stop guessing and start measuring. The foundation for everything you build in Faza 3.*
