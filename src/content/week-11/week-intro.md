# Week 11: Observability, Caching & Cost Optimization

> *"Anyone can make an AI demo. Production means knowing how much each request costs, why it failed at 3am, and how to make it 10x cheaper."*

**Dates:** 28 Iulie -- 3 August 2025
**Phase:** Faza 3 -- Production
**Hours this week:** ~19h
**Theme:** Making AI Applications Production-Grade

---

## Why This Week Exists

You have four working AI projects. They demo well. They solve real problems. But if you deployed any of them for 1,000 users tomorrow, you would have no idea how much it costs, which requests are failing, or why the response took 8 seconds instead of 2.

This week fills the gap between "it works" and "it runs in production." You are adding the instrumentation, caching, and cost controls that separate hobby projects from professional systems. This is the week that makes your resume say "production AI systems" instead of "AI demos."

## The Three Pillars

**Observability (Days 71-72):** You cannot optimize what you cannot measure. Langfuse gives you traces for every LLM call -- input, output, latency, cost, token usage. You will instrument all four projects and build a clear picture of how your AI systems behave.

**Caching (Day 73):** LLM calls are expensive and often redundant. The same question asked twice should not cost twice. You will implement three caching layers: API-level prompt caching (Anthropic's built-in feature), semantic caching (similar questions get cached answers), and exact caching (identical inputs return cached outputs).

**Cost Optimization (Days 74, 76):** The difference between a viable AI product and a money pit is often a 10x cost reduction. You will build a model cascade router that sends simple queries to cheap models and complex queries to expensive ones. You will implement rate limiting, retry logic, and provider fallbacks. You will build a cost tracking dashboard.

**Integration (Day 77):** Apply everything to all four projects. Every project gets observability, caching, and cost optimization. Every README gets updated. Everything is pushed.

## The Numbers That Matter

After this week, you will be able to answer these questions for every project:
- What is the average cost per request?
- What is the p50 and p95 latency?
- What percentage of requests hit the cache?
- What is the projected monthly cost at 10,000 requests/day?
- Which tool calls are most/least frequently used?
- What is the error rate, and what types of errors occur?

These are the questions that come up in AI engineering interviews. This week gives you real answers from real projects.

## What Success Looks Like

By Sunday night, every project has Langfuse traces, at least one caching layer, retry logic with exponential backoff, and a model routing strategy. You have a cost dashboard that shows real numbers. Your READMEs mention observability and cost optimization. You can discuss production AI systems with authority because you have actually built them.

---

**Friday (Day 75) is REST.**

*Let's make it production-grade.*
