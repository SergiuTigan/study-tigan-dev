# Day 2 --- Prompt Structure

> *"A prompt is not a question. It is a specification. The difference between the two is the difference between 'build me an app' and a detailed PRD."*

**Date:** Marti, 20 Mai 2026
**Hours:** 2h · 20:00--22:00
**Topic:** Prompt anatomy, system prompts vs user messages, the art of specificity
**Phase:** Faza 1 --- Foundations · Week 1

---

## What You Are Doing

Yesterday you made the API talk. Today you learn how to make it *listen*. The difference between a mediocre AI feature and a great one almost never comes down to the model --- it comes down to the prompt. And the difference between a mediocre prompt and a great one is the same difference between a Jira ticket that says "fix the bug" and one that describes the expected behavior, reproduction steps, environment, and acceptance criteria.

You are going to work through Chapters 1-2 of the official Anthropic prompt engineering tutorial, then internalize the most important mental model shift in AI engineering: **a prompt is a specification, not a question**. By the end of tonight, the idea of sending Claude a bare instruction like "write a blog post" should feel as wrong as writing `any` in a strict TypeScript codebase.

## The Work

### Step 1: Complete Tutorial Chapters 1-2 (45 min)

Open the interactive tutorial and work through the first two chapters:

**Repository:** [github.com/anthropics/prompt-eng-interactive-tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial)

Clone it into your workspace:

```bash
cd ~/claude-lab
git clone https://github.com/anthropics/prompt-eng-interactive-tutorial.git tutorial
```

These are Jupyter notebooks. If you prefer not to set up Jupyter, you can read the notebooks on GitHub and run the equivalent code in your TypeScript project --- the concepts transfer directly.

**Chapter 1** covers basic prompt structure and the concept of clear, direct instructions. **Chapter 2** introduces the idea of assigning roles and being specific about what you want.

### Step 2: Understand the Anatomy of a Prompt (30 min)

Every effective prompt has these components, whether you make them explicit or not:

```
CONTEXT    — Who are you? What do you know? What situation is this?
TASK       — What exactly should you do?
INPUT      — What data/material are you working with?
CONSTRAINTS — What should you NOT do? What are the boundaries?
FORMAT     — What should the output look like?
```

This is not unlike an Angular component's contract:

| Prompt Part | Angular Equivalent |
|---|---|
| Context | Module/service dependencies, what is injected |
| Task | The component's responsibility (single responsibility) |
| Input | `@Input()` properties |
| Constraints | Validation rules, guard clauses |
| Format | The template --- the shape of the output |

Here is the difference between a lazy prompt and an engineered prompt:

**Lazy prompt (the `any` type):**
```
Write a blog post about Angular signals.
```

**Engineered prompt (strict-mode TypeScript):**
```
You are a senior frontend developer writing for an audience of mid-level
Angular developers who are familiar with RxJS but have not yet adopted Signals.

Write a 600-word blog post that:
- Explains what Angular Signals are and why they exist
- Compares Signals to BehaviorSubject with a concrete code example
- Addresses the concern "do I need to rewrite all my RxJS code?"
- Ends with 3 practical next steps

Tone: conversational but technically precise. No buzzwords.
Format: Markdown with code blocks using TypeScript syntax highlighting.
Do not include a title — I will add my own.
```

The second prompt will produce dramatically better output on the first try. More importantly, it will produce *consistent* output across multiple runs. That consistency is what matters in production.

### Step 3: System Prompt vs User Messages (20 min)

The Anthropic API separates `system` from `messages` for a reason. They serve different purposes:

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,

  // SYSTEM: persistent identity, rules, constraints
  // Think of this as the "module configuration"
  system: `You are a code review assistant for an Angular 18+ codebase.
Rules:
- Always suggest Signal-based alternatives when you see BehaviorSubject
- Flag any component with more than 200 lines
- Output format: markdown checklist with severity levels (critical/warning/suggestion)
- Never rewrite entire files — only show the specific lines to change`,

  // MESSAGES: the actual conversation, the runtime data
  // Think of this as the "component inputs"
  messages: [
    {
      role: "user",
      content: `Review this component:\n\n\`\`\`typescript\n${componentCode}\n\`\`\``,
    },
  ],
});
```

**Key distinction:**
- **System prompt** = the *identity and rules* that persist across an entire session or feature. It is your "configuration." You write it once, reuse it many times.
- **User messages** = the *runtime input* that changes per request. It is the data flowing through your pipeline.

In Angular terms: the system prompt is the `providedIn: 'root'` service configuration. The user message is the data passed to a method on that service.

### Step 4: The Specificity Exercise (30 min)

This is the most important exercise of the night. Take this intentionally vague prompt:

```
Help me with my code.
```

Rewrite it five times, each time more specific. Here is an example progression:

**Rewrite 1 --- Add context:**
```
I have an Angular component that is slow. Help me optimize it.
```

**Rewrite 2 --- Add specificity:**
```
I have an Angular 18 component that re-renders on every keystroke in a form
with 50 fields. Help me identify why and suggest fixes.
```

**Rewrite 3 --- Add constraints:**
```
I have an Angular 18 component that re-renders on every keystroke in a form
with 50 fields. The component uses OnPush change detection but still
re-renders excessively. Suggest fixes that don't require rewriting the entire
form — only targeted changes. Prioritize by impact.
```

**Rewrite 4 --- Add input:**
```
I have an Angular 18 component that re-renders on every keystroke in a form
with 50 fields. The component uses OnPush change detection but still
re-renders excessively.

Here is the component code:
[paste actual code]

Suggest fixes that don't require rewriting the entire form — only targeted
changes. Prioritize by impact. For each suggestion, show the before/after code.
```

**Rewrite 5 --- Add output format:**
```
I have an Angular 18 component that re-renders on every keystroke in a form
with 50 fields. The component uses OnPush change detection but still
re-renders excessively.

Here is the component code:
[paste actual code]

Analyze this component and provide:
1. ROOT CAUSE: One sentence explaining why the re-renders happen
2. FIXES: Ordered by impact (highest first), each with:
   - What to change (one sentence)
   - Before code snippet
   - After code snippet
   - Expected performance improvement
3. VERDICT: Can this be fixed with targeted changes, or does it need a rewrite?

Do not suggest switching to React. Do not suggest libraries I am not already using.
```

**Now do this yourself** with a real problem from your Angular work. Pick something you would actually ask Claude. Write it five times. Run each version through the API and compare the outputs.

## Key Concepts

**Specificity is not verbosity.** A good prompt is specific, not long. Every sentence should either add context, narrow the task, or define the output. If a sentence does not do one of those three things, cut it.

**System prompts are persistent; user messages are ephemeral.** Design your system prompts to be reusable across many different inputs. If you find yourself repeating instructions in every user message, that instruction probably belongs in the system prompt.

**Vague prompts get average outputs.** When you give Claude a vague instruction, it produces the statistical average of all plausible completions. The more specific you are, the more you push the output toward the specific region of quality you want. This is not a metaphor --- it is literally how the probability distribution narrows.

## Build / Practice

Create `src/day-02-specificity.ts` in your `claude-lab` project:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic();

async function comparePrompts() {
  const vague = "Explain dependency injection.";

  const specific = `Explain Angular's dependency injection system to a backend
Java developer who understands Spring DI. Focus on:
1. How Angular's DI differs from Spring (max 3 key differences)
2. One code example showing providedIn: 'root' vs module-scoped
3. The one gotcha that trips up every Spring developer

Keep it under 400 words. Use TypeScript code blocks.`;

  for (const [label, prompt] of [["VAGUE", vague], ["SPECIFIC", specific]]) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    console.log(`\n${"=".repeat(60)}`);
    console.log(`${label} PROMPT (${response.usage.output_tokens} tokens)`);
    console.log("=".repeat(60));
    console.log(text.substring(0, 500) + "...\n");
  }
}

comparePrompts().catch(console.error);
```

Run it. Notice the difference in output quality and token usage. The vague prompt uses more tokens for a less useful answer.

## Resources

- [Prompt Engineering Interactive Tutorial (Ch 1-2)](https://github.com/anthropics/prompt-eng-interactive-tutorial) --- official Anthropic tutorial, the primary resource for today
- [Anthropic Prompt Engineering Overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) --- high-level best practices
- [Be Clear and Direct](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct) --- Anthropic's guide on specificity

## Done When

- [ ] You have completed Chapters 1-2 of the interactive tutorial
- [ ] You can explain the five parts of a prompt (context, task, input, constraints, format)
- [ ] You understand the difference between system prompts and user messages and when to use each
- [ ] You have taken one vague prompt and rewritten it 5 times with increasing specificity
- [ ] You have run both a vague and specific prompt through the API and observed the quality difference
- [ ] You can articulate why "write a blog post" is a terrible prompt (it specifies nothing about audience, length, structure, tone, or constraints)

---

*Tomorrow: XML tags --- Claude's superpower. You will learn how to separate concerns within a prompt the same way you separate concerns in an Angular app. It is the single technique that will level up your prompts the most.*
