# Week 12: LangChain.js + LangGraph

> *"You built everything from scratch. Now learn the framework that abstracts it. Not because you need it -- but because the industry expects you to know it."*

**Dates:** 4-10 August 2025
**Phase:** Faza 3 -- Production (Final Week)
**Hours this week:** ~18h
**Theme:** Framework Fluency + Graph-Based Agent Orchestration

---

## Why This Week Exists

You have spent the last eleven weeks building AI applications from first principles. You wrote your own RAG pipeline, your own agent loop, your own tool system, your own caching and retry logic. This was intentional -- you cannot evaluate a framework if you do not understand what it abstracts.

Now you learn LangChain.js and LangGraph. Not because they are essential (you proved you can build without them), but because they are ubiquitous. Job postings mention LangChain. Technical interviews reference it. Team discussions assume familiarity with it. And LangGraph solves a genuinely hard problem -- graph-based agent orchestration -- better than most hand-rolled solutions.

This week is about adding a tool to your belt, not replacing the tools you already have. You will learn LangChain, reimplement an existing project with it, honestly evaluate where it helps and where it hurts, then build something new with LangGraph that would be genuinely harder to build from scratch.

## The Honest Assessment

LangChain is polarizing in the AI engineering community. Here is the balanced take:

**Where LangChain helps:**
- Rapid prototyping (connect 5 services in 20 lines)
- Lots of integrations (vector stores, LLMs, tools, document loaders)
- Common patterns are one-liners (retrieval chains, agent executors)
- LangSmith for observability (like Langfuse but integrated)

**Where LangChain hurts:**
- Abstraction layers make debugging harder
- Breaking changes between versions
- Simple things can become complex when they don't fit LangChain's abstractions
- Performance overhead from the abstraction layer

**LangGraph (different story):**
- Graph-based orchestration is genuinely useful for complex workflows
- Branching, cycles, parallel execution, conditional routing
- State persistence between graph executions
- Harder to replicate well from scratch

## The Week Arc

**Monday:** LangChain.js overview. Map your manual code to LangChain equivalents. Understand LCEL (LangChain Expression Language).

**Tuesday:** LangGraph. Graphs, nodes, edges, conditional routing. The conceptual model for complex agent workflows.

**Wednesday:** Reimplement your RAG system using LangChain. Side-by-side comparison with your manual implementation.

**Thursday:** Advanced LangChain patterns. Custom chains, structured output, callbacks.

**Saturday:** Build a LangGraph agent. A multi-step content creator with quality gates and iteration loops.

**Sunday:** Faza 3 complete. Review everything, push everything, prepare for Faza 4.

## What Success Looks Like

By Sunday night, you will have LangChain fluency (can read and write LangChain code without documentation), a LangGraph agent that demonstrates graph-based orchestration, an honest comparison between manual and framework approaches, and a complete portfolio of six AI projects. Faza 3 is done.

---

**Friday (Day 82) is REST.**

*The final framework. The final week of Faza 3. Let's finish strong.*
