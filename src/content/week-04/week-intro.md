# Week 4: RAG Foundations

> *"The best AI systems don't just think well -- they remember well. RAG is how you give Claude a perfect memory of YOUR data."*

**Dates:** 9-15 Iunie 2026
**Phase:** Faza 2 -- Patterns
**Hours:** 16h
**Outcome:** A working RAG system that ingests PDFs and answers questions grounded in your documents.

---

## The Big Picture

You've built tools. You've built agents. But every system so far has had one fundamental limitation: Claude only knows what's in its training data and what you paste into the prompt. The moment a user asks about *their* company's internal docs, last quarter's financial report, or a proprietary knowledge base, Claude shrugs. Not because it's incapable -- because it literally doesn't have the information.

**Retrieval-Augmented Generation (RAG)** solves this. The idea is deceptively simple: before Claude answers a question, you *find* the relevant documents and *stuff* them into the prompt. Claude reads them, synthesizes an answer, and cites its sources. The user gets an AI that "knows" their data without any fine-tuning, retraining, or model modification. It's the single most deployed AI pattern in production today, and for good reason -- it works.

This week you'll build RAG from the ground up. Not by installing a framework and hoping for the best, but by understanding each piece: how text becomes vectors, how similarity search works mathematically, why chunking strategy makes or breaks your results, and how vector databases scale the whole thing. By Sunday, you'll have a complete pipeline that ingests real PDFs and answers questions about them. This is the foundation that Week 5 will harden into a portfolio-ready project.

## This Week

| Day | Date | Topic | Hours |
|-----|------|-------|-------|
| 22 | Lun 9 Iun | RAG Mental Model | 2h |
| 23 | Mar 10 Iun | Embeddings | 2h |
| 24 | Mie 11 Iun | Vector Similarity Search | 2h |
| 25 | Joi 12 Iun | Chunking Strategies | 2h |
| 26 | Vin 13 Iun | **REST** | -- |
| 27 | Sam 14 Iun | Vector Database (Supabase pgvector) | 3h |
| 28 | Dum 15 Iun | Mini RAG End-to-End | 5h |

## Key Concepts You'll Master

- **Embeddings** -- turning text into numbers that capture meaning
- **Vector similarity** -- finding "close" documents using cosine similarity
- **Chunking** -- splitting documents so retrieval actually works
- **Vector databases** -- storing and querying millions of embeddings efficiently
- **The RAG pipeline** -- ingest, retrieve, generate, end to end

## Reflection (after completing)

- [ ] Can I explain the RAG pipeline (ingest/retrieve/generate) to a non-technical person?
- [ ] Do I understand why chunking strategy matters more than embedding model choice?
- [ ] Can I build a similarity search from scratch without a library?
- [ ] Is my end-to-end RAG system answering questions correctly from real PDFs?
- [ ] What questions does my system get wrong, and do I understand why?
