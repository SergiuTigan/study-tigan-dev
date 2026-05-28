---
title: "Day 15 — DeepLearning.AI Course Part 1"
week: 3
day: 15
phase: 1
phaseLabel: "Foundations"
order: 315
type: "day"
---
# Day 15 — DeepLearning.AI Course Part 1

> *"If you only ever learn from one teacher, you only ever learn one way of thinking. The second perspective is where the real understanding begins."*

**Date:** Luni, 2 Iunie 2026
**Hours:** 2h · Evening session
**Topic:** DeepLearning.AI — Anthropic/Claude Short Course (First Half)
**Phase:** Faza 1 — Foundations · Week 3

---

## What You're Doing

For the past two weeks, you have been learning Claude through Anthropic's own documentation and your own experimentation. That is the best foundation. But today you add a second lens: Andrew Ng's team at DeepLearning.AI, who have built short courses in collaboration with Anthropic that approach the same material from a different angle.

This is not about repeating what you already know. It is about calibration. When you watch an expert explain something you have already built, one of two things happens: either you nod along and confirm your understanding is solid, or you catch a subtle detail you missed — a production pattern, a prompt structure, a way of thinking about error handling that had not occurred to you. Both outcomes are valuable. The first builds confidence. The second fixes bugs in your mental model before they become bugs in your production code.

Go in with an active mindset. You are not a student watching a lecture. You are a practitioner auditing a peer's approach.

---

## The Work

### Step 1: Find the Right Course

Navigate to the DeepLearning.AI short courses catalog:

```
https://www.deeplearning.ai/short-courses/
```

Look for Anthropic-related courses. As of mid-2026, there are courses covering prompt engineering with Claude, building with the Anthropic API, and tool use patterns. Pick the one most aligned with what you have been building — likely the course focused on practical API usage and prompt engineering with Claude.

### Step 2: Set Up Your Notes Framework

Before you press play, create a simple note structure. You are tracking three things:

```markdown
## DeepLearning.AI Course Notes — Part 1

### Confirmed Knowledge
Things I already knew, now validated:
-

### New Insights
Things I did not know or had not considered:
-

### Production Patterns
Approaches specifically designed for real-world use:
-

### Different Prompt Approaches
Ways of structuring prompts I haven't tried:
-
```

This framework forces active watching. Every few minutes, you should be writing something in one of these four categories.

### Step 3: Work Through the First Half

Work through approximately the first 50% of the course content. Do not rush. When the instructor shows a code example, compare it to how you would have written it:

- **Do they structure their system prompts differently?** Pay attention to how they separate instructions from context from examples.
- **How do they handle multi-turn conversations?** Look for patterns in how they manage conversation history, especially around token limits.
- **What error handling do they include?** Production code has try/catch blocks, retries, fallback behavior. Note every defensive pattern.
- **How do they think about cost?** Do they mention token counting, model selection based on task complexity, or prompt optimization?

### Step 4: Try Their Examples Your Way

When the course presents a hands-on exercise, try it two ways:

1. **Their way** — follow the exercise as designed, see the expected output
2. **Your way** — solve the same problem using your CLI tool or your own code patterns

The gap between the two approaches is where learning happens. Maybe their approach is cleaner. Maybe yours handles an edge case theirs does not. Both are data points.

### Step 5: Flag Anything Surprising

Keep a separate list of anything that genuinely surprises you. These are your highest-value takeaways. Examples of things that commonly surprise people at this stage:

- How much difference prompt structure (not just content) makes to output quality
- Specific formatting patterns that Claude responds to better than others
- Rate limiting and retry strategies for production deployments
- How experienced engineers think about prompt versioning and testing

---

## Key Insight

**The goal of studying a second source is not to learn new facts — it is to find the gaps between what you think you know and what you actually know.** Every "oh, I didn't realize that" moment is worth more than ten "yes, I already knew that" moments. Hunt for the surprises.

---

## Resources

- [DeepLearning.AI Short Courses](https://www.deeplearning.ai/short-courses/) — find the Anthropic/Claude course
- [Anthropic API Documentation](https://docs.anthropic.com/) — your reference for cross-checking anything the course presents
- Your own CLI tool source code — the best way to validate a new pattern is to implement it

---

## Done When

- [ ] Found and started the relevant DeepLearning.AI course
- [ ] Completed approximately the first half of the course content
- [ ] Notes document has entries in all four categories (confirmed, new, production, different approaches)
- [ ] At least one "surprise" flagged — something you genuinely did not know
- [ ] Tried at least one course exercise using your own code/CLI tool

---

*Tomorrow: Complete the course. Focus shifts to hands-on exercises, error handling patterns, and multi-turn conversation management. The goal is a clear, complete picture of "production prompt engineering."*
