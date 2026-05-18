# Day 56 — Faza 2 Review

> *"You don't learn by building things. You learn by building things, then stepping back and understanding what you built."*

**Date:** Duminica, 13 Iulie 2026
**Hours:** 5h · Full review day
**Topic:** Polish Faza 2 code, write blog post, retrospective, prepare for Faza 3
**Phase:** Faza 2 — Patterns (FINAL DAY)

---

## What You're Doing

Faza 2 is complete. Four weeks of patterns, three portfolio pieces, one evaluation framework. Today you pause the forward march to look backward, polish what you've built, and prepare for what comes next.

This is the day that separates "I followed a tutorial" from "I understand what I built and can articulate it to others." You're going to spend five hours doing four things: polishing your code, writing about what you learned, reflecting on what was harder (and easier) than expected, and charting the path forward.

No new concepts. No new code patterns. Just depth, clarity, and preparation.

## The Work

### Hour 1-2: Polish All Faza 2 Code

Go through each project and bring it to portfolio standard.

**Project 1: RAG System (Week 4-5)**
```markdown
Review checklist:
- [ ] README is current and accurate
- [ ] .env.example has all required variables
- [ ] No API keys in committed code
- [ ] Error messages are helpful
- [ ] Code has comments at decision points (not obvious lines)
- [ ] package.json has correct dependencies
- [ ] TypeScript compiles without errors
- [ ] Basic usage example works from a fresh clone
```

**Project 2: Research Agent (Week 6)**
```markdown
Review checklist:
- [ ] Agent loop handles all edge cases (no tools, stuck, timeout)
- [ ] Error recovery is tested and working
- [ ] Memory persistence works across sessions
- [ ] CLI is user-friendly with help text
- [ ] README explains the architecture
- [ ] Streaming output is clean and informative
```

**Project 3: MCP Server (Week 7)**
```markdown
Review checklist:
- [ ] All tools have Zod validation with descriptive errors
- [ ] Resources return properly formatted content
- [ ] Logging goes to stderr only
- [ ] Claude Desktop config example is documented
- [ ] Installation from README works
- [ ] Orchestrator demo runs independently
```

**Project 4: Eval Framework (Week 8)**
```markdown
Review checklist:
- [ ] Golden dataset has 30 well-designed items
- [ ] LLM-as-judge produces consistent, calibrated scores
- [ ] Multi-model comparison runs and produces a clear table
- [ ] A/B test framework is reusable
- [ ] Results are saved to eval/runs/ as JSON
- [ ] Summary output is clear and actionable
```

For each project, run through the checklist. Fix anything broken. Don't add features — just polish what exists.

### Hour 3: Blog Post Draft

Write a draft blog post: **"How I Built and Evaluated a RAG System — A Practitioner's Guide"**

This isn't a tutorial — it's a reflection piece. Structure:

```markdown
# How I Built and Evaluated a RAG System

## The Problem
What I was trying to solve and why RAG was the right approach.

## The Architecture
[Diagram: Document → Chunks → Embeddings → Vector DB → Query → Retrieve → Augment → Generate]

What I built and why I made each architectural decision.

## What Worked
- Chunk size of ~500 tokens with 50-token overlap hit the sweet spot
- Reranking with a cross-encoder dramatically improved relevance
- The eval framework caught issues I would have missed manually

## What Surprised Me
- RAG is 80% retrieval engineering, 20% generation
- Embedding model choice matters more than I expected
- Small changes to chunk boundaries changed answer quality significantly
- LLM-as-judge is surprisingly reliable when calibrated

## The Numbers
- 30-item eval dataset covering factual, synthesis, and edge cases
- Sonnet scored 4.3/5 at $0.05 per 30 queries
- Haiku scored 3.7/5 at $0.004 per 30 queries
- Best prompt variant improved baseline by 12%

## What I'd Do Differently
- Start with evals earlier (I built the system first, then the eval)
- Use semantic chunking from the start instead of fixed-size
- Build a feedback loop for production monitoring

## Key Takeaway
The eval framework was the most valuable thing I built. Not because it's
technically impressive, but because it gave me confidence in every decision
after that. "Is Sonnet worth 10x the cost of Haiku for this task?" I can
answer that with data, not vibes.
```

Write the full draft. It doesn't need to be perfect — it needs to be complete. You can edit later. The act of writing forces you to organize your understanding.

### Hour 4: Retrospective

Be honest with yourself. Write answers to these questions:

```markdown
## Faza 2 Retrospective

### What was harder than expected?
(Common answers: error recovery in agents, designing good eval datasets,
understanding when to use workflows vs agents, managing context windows)

### What was easier than expected?
(Common answers: MCP setup, basic RAG pipeline, using the Claude API,
multi-model comparison)

### What are my gaps?
(Be specific. Not "I need to learn more" but "I don't fully understand
how embeddings are trained" or "I struggle with designing system prompts
for complex agents")

### What would I build differently?
(With hindsight, what architectural decisions would you change?
What would you prioritize differently?)

### Am I on track?
(Can you comfortably discuss RAG, agents, MCP, and evals in a technical
interview? Could you build a simple agent system from scratch without
referring to notes?)

### What excites me most about Faza 3?
(Production deployment? Fine-tuning? Advanced architectures?
Your answer guides how you'll approach the next phase.)
```

### Faza 2 Skills Inventory

Check off what you can now do:

```markdown
## Skills Acquired in Faza 2

### RAG (Weeks 4-5)
- [ ] Chunk documents with appropriate size and overlap
- [ ] Generate and store embeddings
- [ ] Build a retrieval pipeline with vector similarity search
- [ ] Augment prompts with retrieved context
- [ ] Implement reranking for improved relevance
- [ ] Handle multi-turn conversations with context

### Agents (Week 6)
- [ ] Build a ReAct agent loop from scratch
- [ ] Implement tool execution with error recovery
- [ ] Add working memory (notes) and conversation memory
- [ ] Detect and handle stuck agents
- [ ] Distinguish when to use workflows vs agents
- [ ] Build hybrid workflow-agent systems

### MCP (Week 7)
- [ ] Build an MCP server with tools and resources
- [ ] Connect to Claude Desktop via stdio transport
- [ ] Implement orchestrator-worker patterns
- [ ] Build subagent systems with isolated contexts
- [ ] Select appropriate models for different task types

### Evaluation (Week 8)
- [ ] Design a golden dataset with diverse test categories
- [ ] Implement LLM-as-judge with calibration
- [ ] Run multi-model comparisons
- [ ] A/B test prompt variants with data
- [ ] Make engineering decisions based on eval data
```

### Hour 5: Prepare for Faza 3

Faza 3 is about **production and advanced topics.** Sketch what's coming:

```markdown
## Faza 3 Preview: Production AI Engineering

What Faza 2 taught you to BUILD, Faza 3 teaches you to SHIP.

Topics ahead:
- Deployment: Docker, cloud hosting, CI/CD for AI systems
- Monitoring: Tracking quality, latency, cost in production
- Fine-tuning: When and how to customize models
- Advanced RAG: Hybrid search, query expansion, metadata filtering
- Security: Prompt injection, data leakage, access control
- Scale: Handling thousands of concurrent users
- Business: Pricing AI features, usage-based billing

The transition from Faza 2 to Faza 3 is the transition from
"I can build AI systems" to "I can run AI systems in production."
```

Prepare your environment:
```bash
# Ensure all Faza 2 projects are committed and pushed
cd ~/projects/rag-system && git status
cd ~/projects/research-agent && git status
cd ~/projects/mcp-task-manager && git status
cd ~/projects/eval-framework && git status

# Create Faza 3 directory
mkdir -p ~/projects/faza-3
```

### Final Thought: Where You Stand

Take a moment to appreciate the distance you've traveled.

Four weeks ago, you could call the Claude API and get responses. Now you can:

- Build systems that retrieve and synthesize information from documents
- Create autonomous agents that decide their own actions and recover from errors
- Build universal tool servers that any AI client can use
- Systematically evaluate and optimize AI systems with data

You're no longer a beginner calling APIs. You're an AI engineer who understands patterns, makes data-driven decisions, and ships production-quality code.

Faza 2 is complete. Faza 3 awaits.

## Key Insight

The retrospective is the most important hour of the day. It's tempting to skip it and jump into Faza 3. Don't. The engineers who grow fastest are the ones who regularly pause to examine what they've learned, what confused them, and what they'd do differently. The blog post forces you to explain your understanding to others. The retrospective forces you to be honest about your gaps. Both of these accelerate learning more than another day of building.

## Resources

- [Writing Technical Blog Posts — Advice for Engineers](https://jvns.ca/blog/2023/06/05/some-blogging-myths/)
- [Retrospective Techniques](https://www.atlassian.com/team-playbook/plays/retrospective)
- [Portfolio Projects That Get Hired](https://www.levels.fyi/blog/how-to-build-a-portfolio.html)

## Done When

- [ ] All 4 Faza 2 projects pass their polish checklists
- [ ] Blog post draft is complete (doesn't have to be published yet)
- [ ] Retrospective answers are written honestly
- [ ] Skills inventory is checked — you know what you can and can't do
- [ ] Faza 3 preview is reviewed and you know what's coming
- [ ] All code is committed and pushed to GitHub
- [ ] You feel the satisfaction of completing a major milestone

---

*Faza 2: Complete. You've gone from API basics to building agents, MCP servers, and evaluation frameworks. Faza 3 takes everything you've built and puts it into production. See you on the other side.*
