---
title: "Week 5: RAG Production"
week: 5
phase: 2
phaseLabel: "Deep Dive"
order: 500
type: "week-intro"
---
# Week 5: RAG Production

> *"Amateur RAG retrieves documents. Production RAG retrieves the RIGHT documents, proves it, and tells you when it can't."*

**Dates:** 16-22 Iunie 2026
**Phase:** Faza 2 -- Patterns
**Hours:** 16h
**Outcome:** Contextual retrieval + hybrid search + reranking. An eval framework that proves quality. Portfolio piece #2 ships.

---

## The Big Picture

Last week you built a RAG system that works. This week you'll build one that works *well*. The gap between a demo and a production system isn't a framework or a database -- it's the difference between "it sometimes finds the right document" and "it reliably finds the right document, ranks it properly, and you can prove it with numbers."

The techniques this week come directly from Anthropic's Contextual Retrieval paper. The core insight: standard chunks lose context. When you chunk a financial report and store "revenue grew 40% YoY," you've lost *which company* and *which year*. Contextual retrieval fixes this by having a small, fast model prepend document-level context to each chunk before embedding. Combined with hybrid search (vector + keyword) and reranking (a cross-encoder that sees query and document together), retrieval quality jumps 49% over naive RAG. These aren't theoretical numbers -- they're from Anthropic's benchmarks.

But improvement means nothing without measurement. You'll build an evaluation framework this week: a golden dataset of question-answer pairs, retrieval metrics (Hit Rate, MRR), and LLM-as-judge scoring for generation quality. When you push your portfolio piece on Sunday, you won't just have a RAG system -- you'll have *evidence* that it works. That's what separates a side project from an engineering artifact.

## This Week

| Day | Date | Topic | Hours |
|-----|------|-------|-------|
| 29 | Lun 16 Iun | Contextual Retrieval Deep Dive | 2h |
| 30 | Mar 17 Iun | Hybrid Search (Vector + BM25) | 2h |
| 31 | Mie 18 Iun | Reranking | 2h |
| 32 | Joi 19 Iun | Implement Contextual Retrieval | 2h |
| 33 | Vin 20 Iun | **REST** | -- |
| 34 | Sam 21 Iun | Evaluate Your RAG | 3h |
| 35 | Dum 22 Iun | Polish RAG + UI + Ship | 5h |

## Key Concepts You'll Master

- **Contextual retrieval** -- prepending document-level context to chunks before embedding
- **Hybrid search** -- combining semantic (vector) and lexical (BM25) search
- **Reranking** -- using cross-encoders to re-score retrieved documents
- **RAG evaluation** -- Hit Rate, MRR, LLM-as-judge, golden datasets
- **Production polish** -- clean architecture, proper README, shipped artifact

## Reflection (after completing)

- [ ] Can I explain why contextual retrieval improves quality and by how much?
- [ ] Do I understand the tradeoff between vector search and keyword search?
- [ ] Can I articulate when reranking helps and when it's overhead?
- [ ] Does my eval framework give me confidence in my system's quality?
- [ ] Is portfolio piece #2 live on GitHub with architecture docs and eval results?
