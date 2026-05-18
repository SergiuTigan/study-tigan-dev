# Day 7 --- Best Practices + Build prompts.md

> *"A craftsperson does not reinvent the chisel each morning. They maintain their tools, sharpen them, and know which one to reach for without thinking. Your prompts.md is your toolbox."*

**Date:** Duminica, 25 Mai 2026
**Hours:** 5h · 10:00--12:00 (study) + 14:00--17:00 (build)
**Topic:** Claude 4 best practices, building a reusable prompt engineering toolkit, Week 1 consolidation
**Phase:** Faza 1 --- Foundations · Week 1

---

## What You Are Doing

This is the culmination day. You have spent five days learning individual techniques --- API calls, prompt structure, XML tags, chain of thought, few-shot examples, hallucination control. Today you stitch everything together into a toolkit you will actually use for the rest of this roadmap and in your production work.

The morning session is study: you will read the official Claude 4 best practices documentation and complete the final tutorial chapter. Claude 4 has specific behaviors that differ from earlier models --- it follows system prompts more literally, handles multi-step tasks better, and benefits even more from XML structuring. Understanding these nuances makes you effective with the current frontier model.

The afternoon session is pure building: you will create `prompts.md`, a personal collection of battle-tested prompt templates covering the tasks you actually do --- code review, bug analysis, classification, explanation, refactoring. These templates encode everything you have learned this week. Every time you need a prompt in the future, you will start here instead of from scratch.

## The Work

### Morning Session: Study (2h)

#### Part 1: Tutorial Chapter 9 (45 min)

Complete the final chapter of the interactive tutorial. This chapter typically covers advanced techniques and putting it all together.

#### Part 2: Claude 4 Best Practices (75 min)

Read the official Claude 4 best practices documentation carefully:

**Primary resource:** [Claude 4 Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)

Key things to look for and internalize:

**1. System prompt adherence.** Claude 4 follows system prompts more literally than previous models. This means your system prompts need to be more carefully worded --- Claude will do exactly what you say, including things you did not intend. If your system prompt says "always respond in JSON," Claude will respond in JSON even when you ask it a clarifying question. Be precise about scope.

**2. Multi-step task handling.** Claude 4 is better at holding context across long, multi-step instructions. This means you can be more ambitious with single prompts. Where you might have broken a task into three sequential API calls before, you can now often do it in one well-structured prompt.

**3. XML structuring is even more important.** Claude 4 was trained with even stronger XML awareness. Tags like `<thinking>`, `<output>`, `<examples>` are not just helpful --- they are the primary way to control Claude 4's behavior. The investment you made on Day 3 pays dividends with this model.

**4. Instruction following vs creativity.** Claude 4 is more obedient. If you want creative latitude, you need to explicitly grant it. Otherwise, Claude will stick closely to your specifications.

Also read the general prompt engineering overview:

**Secondary resource:** [Prompt Engineering Overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

Take notes. Not summaries of the docs --- notes on what changes about *your* prompting approach based on what you read.

### Afternoon Session: Build prompts.md (3h)

Create a file called `prompts.md` in your `claude-lab` project root. This is your personal prompt engineering toolkit. Each template should be complete and ready to use --- paste it in, fill in the placeholders, and go.

#### Template 1: Code Review (30 min)

```markdown
## Code Review

### System Prompt
```
You are a senior {{FRAMEWORK}} architect conducting a code review.
You are thorough but practical — you flag real issues, not style nitpicks.
You understand that perfect is the enemy of shipped.
```

### User Prompt
```xml
<context>
{{CONTEXT: e.g., "Angular 18 app, standalone components, migrating from RxJS to Signals"}}
</context>

<code language="{{LANGUAGE}}">
{{CODE}}
</code>

<focus_areas>
{{OPTIONAL: specific concerns like "performance", "security", "accessibility"}}
</focus_areas>

<task>
Review this code. Focus on issues that would cause bugs in production,
performance problems, or maintainability concerns. Ignore formatting
and style preferences.
</task>

<output_format>
## Critical (blocks merge)
- [ ] **Issue:** description
  - **Why:** explanation
  - **Fix:** concrete code suggestion

## Warning (fix before next sprint)
- [ ] **Issue:** description
  - **Why:** explanation
  - **Fix:** concrete code suggestion

## Suggestion (consider for future)
- [ ] **Issue:** description
  - **Why:** explanation

**VERDICT:** APPROVE | REQUEST_CHANGES | BLOCK
**Summary:** One sentence overall assessment.
</output_format>
```
```

#### Template 2: Bug Analysis (25 min)

```markdown
## Bug Analysis

### System Prompt
```
You are a debugging expert. You think systematically about failure modes
and root causes. You do not guess — you reason from evidence.
If you cannot determine the root cause from the information given,
you say what additional information you need.
```

### User Prompt
```xml
<environment>
{{ENVIRONMENT: e.g., "Angular 18, Node 20, Chrome 126, Ubuntu 22.04"}}
</environment>

<error>
{{ERROR MESSAGE AND/OR STACK TRACE}}
</error>

<context>
{{WHAT HAPPENED: what the user did, what was expected, what actually happened}}
</context>

<relevant_code>
{{CODE THAT MAY BE RELATED — be generous with context}}
</relevant_code>

<task>
Analyze this bug. Think step by step:
1. What does the error message tell us?
2. What are the possible root causes?
3. Which root cause is most likely given the context?
4. What is the fix?
</task>

<output_format>
<analysis>
[Step-by-step reasoning]
</analysis>

<result>
**Root Cause:** [one sentence]
**Confidence:** high | medium | low
**Fix:**
```{{LANGUAGE}}
[code fix]
```
**Verification:** [how to confirm the fix works]
**Prevention:** [how to prevent this class of bug in the future]
</result>
</output_format>
```
```

#### Template 3: Classification (25 min)

```markdown
## Classification

### System Prompt
```
You are a precise classifier. You assign items to exactly one category
from a predefined list. You never invent categories. When uncertain,
you assign the most likely category and flag low confidence.
```

### User Prompt
```xml
<categories>
{{LIST OF VALID CATEGORIES WITH DESCRIPTIONS}}
</categories>

<examples>
  <example>
    <input>{{EXAMPLE INPUT 1}}</input>
    <output>{"category": "{{CAT}}", "confidence": "high", "reasoning": "{{WHY}}"}</output>
  </example>
  <!-- Include 3-5 examples covering different categories and edge cases -->
</examples>

<item>
{{ITEM TO CLASSIFY}}
</item>

<rules>
- Category MUST be from the list above. No other values.
- If genuinely ambiguous, pick the most likely and set confidence to "medium" or "low".
- If the item is nonsensical or unrelated, classify as "{{DEFAULT}}" with confidence "low".
</rules>

Respond with ONLY the JSON object:
{"category": "...", "confidence": "high|medium|low", "reasoning": "..."}
```

*Use prefill technique: start assistant message with `{`*
```

#### Template 4: Code Explanation (25 min)

```markdown
## Code Explanation

### System Prompt
```
You explain code clearly and concisely. You adapt your explanation
to the reader's experience level. You focus on the WHY, not just the WHAT.
```

### User Prompt
```xml
<audience>
{{WHO IS READING: e.g., "Senior Angular dev unfamiliar with this codebase"}}
</audience>

<code language="{{LANGUAGE}}">
{{CODE}}
</code>

<task>
Explain this code. Cover:
1. What it does (high-level purpose, 2-3 sentences)
2. How it works (walk through the key logic)
3. Why it is written this way (design decisions, tradeoffs)
4. The one thing most likely to confuse someone reading it for the first time
</task>

<output_format>
**Purpose:** [2-3 sentences]

**How it works:**
[Numbered walkthrough of the key logic]

**Design decisions:**
[Why the code is structured this way]

**Watch out for:**
[The most confusing or non-obvious aspect]
</output_format>
```
```

#### Template 5: Refactoring (25 min)

```markdown
## Refactoring

### System Prompt
```
You are a refactoring specialist. You improve code structure without
changing behavior. You make targeted, safe changes — never rewrite
everything at once. Each suggestion should be independently mergeable.
```

### User Prompt
```xml
<context>
{{CODEBASE CONTEXT: framework, version, team conventions, constraints}}
</context>

<code language="{{LANGUAGE}}">
{{CODE TO REFACTOR}}
</code>

<goals>
{{WHAT IMPROVEMENT YOU WANT: e.g., "reduce complexity", "improve testability",
  "migrate from RxJS to Signals", "extract reusable logic"}}
</goals>

<constraints>
- Do not change the public API/interface
- Each change must be independently mergeable
- Preserve existing test coverage
{{ADDITIONAL CONSTRAINTS}}
</constraints>

<task>
Suggest refactoring steps. For each step:
1. What to change and why
2. Before code
3. After code
4. Risk level (safe / low / medium)
</task>

<output_format>
## Refactoring Plan

### Step 1: [Name]
**Why:** [one sentence]
**Risk:** safe | low | medium

Before:
```{{LANGUAGE}}
[before code]
```

After:
```{{LANGUAGE}}
[after code]
```

[Repeat for each step]

**Recommended order:** [which steps to do first and why]
**Total estimated risk:** [overall assessment]
</output_format>
```
```

#### Additional Templates to Add (30 min)

Add 2-3 more templates relevant to your daily work. Ideas:

- **PR Description Generator** --- paste a diff, get a well-structured PR description
- **Test Case Generator** --- paste a function, get comprehensive test scenarios
- **Migration Assistant** --- describe current and target state, get step-by-step migration
- **Architecture Decision Record** --- describe a decision, get a structured ADR
- **Interview Question Analyzer** --- paste a technical question, get structured answer approach

#### Week 1 Reflection Section (15 min)

Add a reflection section at the end of your `prompts.md`:

```markdown
## Week 1 Reflection

### What I Learned
- Prompts are specifications, not questions
- XML tags are the primary structuring mechanism for Claude
- Chain of thought trades tokens for accuracy — use deliberately
- Few-shot examples are stronger than detailed instructions
- Always validate model output in code
- Claude 4 follows instructions more literally — be precise

### What Surprised Me
[Fill in after completing the week]

### What I Want to Explore Further
[Fill in — topics that sparked curiosity]

### My Prompting Principles
1. Start with XML structure, always
2. Include the output format explicitly
3. Use few-shot examples for any classification or categorization task
4. Add escape hatches for uncertainty ("if unsure, say so")
5. Validate output in code, never trust blindly
6. Use CoT for complex reasoning, skip for simple tasks
7. System prompts for identity and rules, user messages for runtime data
```

### Additional Study Resources (20 min)

Scan these resources. You do not need to read them fully today, but bookmark them for reference:

- **[Brex Prompt Engineering Guide](https://github.com/brexhq/prompt-engineering)** --- a practical guide from Brex's engineering team. Excellent real-world examples.
- **[promptingguide.ai](https://www.promptingguide.ai/)** --- a comprehensive academic and practical resource covering every known prompting technique.
- **[Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)** --- official examples and patterns, many directly relevant to what you will build in coming weeks.

## Key Concepts

**Templates save cognitive load.** Every time you start from scratch, you burn mental energy on structure instead of substance. Templates let you focus on the unique part of each task --- the specific code, the specific question --- while the structure is already solved.

**Your prompts.md will evolve.** What you write today is version 1. As you work through the rest of this roadmap, you will discover new patterns, refine existing ones, and add specialized templates for tools, agents, and RAG. Keep it a living document.

**The best practices for Claude 4 are not "nice to have."** They are the difference between a prompt that works in a demo and one that works in production. Claude 4's literal system prompt following, in particular, is something you need to design around --- it is a feature, not a limitation, but only if you know about it.

## Build / Practice

Your deliverables for today:

1. **Completed tutorial** --- all 9 chapters done
2. **`prompts.md`** --- at least 5 complete, usable templates with system prompts, user prompts, XML structure, and output formats
3. **Week 1 reflection** --- honest assessment of what you learned and what to explore further

### Final Exercise: Use Your Own Templates

Before you close your laptop, take one of your templates and use it for a real task. Review an actual component from your Angular codebase using Template 1. Debug a real error from your recent work using Template 2. The acid test is: *does the template produce a useful result on the first try?*

If it does not, iterate. That is the process.

## Resources

- [Claude 4 Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices) --- model-specific guidance for the current frontier model
- [Prompt Engineering Overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) --- comprehensive overview of all techniques
- [Prompt Engineering Tutorial Ch 9](https://github.com/anthropics/prompt-eng-interactive-tutorial) --- final chapter, advanced techniques
- [Brex Prompt Engineering Guide](https://github.com/brexhq/prompt-engineering) --- real-world enterprise prompting patterns
- [promptingguide.ai](https://www.promptingguide.ai/) --- academic and practical prompting reference
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook) --- official code examples and patterns

## Done When

- [ ] You have completed all 9 chapters of the Anthropic interactive tutorial
- [ ] You have read the Claude 4 best practices page and can name 3 Claude 4 specific behaviors
- [ ] Your `prompts.md` contains at least 5 complete, reusable templates
- [ ] Each template has a system prompt, user prompt with XML structure, and output format
- [ ] You have used at least one template on a real task and confirmed it produces useful output
- [ ] You have written your Week 1 reflection honestly
- [ ] You can explain the difference between prompt engineering and "just asking questions"

### Week 1 Completion Checklist

Go back to the week intro page and fill in the reflection section. Be honest:

- [ ] I can make an API call to Claude and explain every field in the response
- [ ] I understand system prompts vs user messages
- [ ] I default to XML-structured prompts
- [ ] I know when CoT helps and when it is overkill
- [ ] I can write few-shot examples that guide exact output
- [ ] I have hallucination control strategies
- [ ] My `prompts.md` has templates I will actually use
- [ ] I can explain prompt engineering to another developer

If you can check all of these, you are ready for Week 2: Structured Output and Multi-turn Conversations.

---

*Next week: You will move from single prompts to conversations. Multi-turn dialogue, structured output with Zod/TypeScript, and the patterns that make Claude a reliable component in your application architecture. The foundation you built this week makes everything next week possible.*
