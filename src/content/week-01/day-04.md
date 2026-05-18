# Day 4 --- Chain of Thought + Format Control

> *"Chain of thought is not about making the model verbose. It is about making the model accurate. Reasoning out loud catches errors that reasoning silently does not."*

**Date:** Joi, 22 Mai 2026
**Hours:** 2h · 20:00--22:00
**Topic:** Chain-of-thought prompting, enforcing output formats, knowing when each technique helps
**Phase:** Faza 1 --- Foundations · Week 1

---

## What You Are Doing

Today you learn two techniques that seem unrelated but share a common purpose: **controlling what Claude does *before* it gives you the answer.**

Chain of Thought (CoT) forces Claude to reason step-by-step before producing a final answer. It is the prompting equivalent of showing your work in a math exam. The model does not just guess the answer --- it works through the problem, which dramatically improves accuracy on anything that requires multi-step reasoning.

Format Control ensures Claude's output matches an exact schema you define. No creative liberties, no "here is my analysis" preambles, just the structured data you asked for. This is critical when your code needs to *parse* Claude's response downstream.

Together, these two techniques turn Claude from a chatbot into a reliable component in a software pipeline.

## The Work

### Step 1: Complete Tutorial Chapters 5-6 (40 min)

Continue with the interactive tutorial. Chapter 5 covers formatting output, and Chapter 6 covers chain-of-thought reasoning. Work through all exercises.

### Step 2: Chain of Thought --- Why It Works (25 min)

Here is a concrete example. Imagine you ask Claude to review a pull request and decide if it is safe to merge:

**Without CoT:**

```xml
<code>
<!-- complex diff with a subtle race condition -->
</code>

<task>Is this PR safe to merge? Answer YES or NO.</task>
```

Claude might answer "YES" because the code *looks* correct at a surface level. It is pattern-matching, not reasoning.

**With CoT:**

```xml
<code>
<!-- same complex diff -->
</code>

<task>
Analyze this PR for merge safety.

Think through it step by step:
1. What does this code change?
2. What are the possible states and transitions?
3. Are there any race conditions, edge cases, or error paths not handled?
4. What assumptions does this code make about the rest of the system?

After your analysis, give your final answer.
</task>

<output_format>
<analysis>
[Your step-by-step reasoning here]
</analysis>

<verdict>SAFE | UNSAFE | NEEDS_DISCUSSION</verdict>
<reason>[One sentence summary]</reason>
</output_format>
```

By forcing Claude to work through steps 1-4 before answering, it is far more likely to catch the subtle race condition. The reasoning process itself surfaces issues that a quick pattern-match would miss.

**The mechanism:** When Claude generates tokens, each token is influenced by the tokens before it. When it writes out its reasoning, those reasoning tokens become context for the final answer. The model literally thinks better when it thinks out loud.

Create `src/day-04-cot.ts` and test this:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic();

const codeToReview = `
// Service method for transferring funds
async transferFunds(fromId: string, toId: string, amount: number) {
  const fromAccount = await this.accountRepo.findById(fromId);
  const toAccount = await this.accountRepo.findById(toId);

  if (fromAccount.balance < amount) {
    throw new InsufficientFundsError();
  }

  fromAccount.balance -= amount;
  toAccount.balance += amount;

  await this.accountRepo.save(fromAccount);
  await this.accountRepo.save(toAccount);
}`;

async function withoutCoT() {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Review this code. Is it safe for production? Answer only YES or NO.\n\n${codeToReview}`,
    }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}

async function withCoT() {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `
<code>
${codeToReview}
</code>

<task>
Analyze this code for production safety. Think step by step:
1. What operation does this code perform?
2. What could go wrong between step 1 and the final save?
3. Is the operation atomic? What happens if it fails midway?
4. Are there concurrency concerns?
</task>

<output_format>
<analysis>
[Step-by-step reasoning]
</analysis>

<verdict>SAFE | UNSAFE</verdict>
<issues>[Numbered list of issues found, or "None"]</issues>
</output_format>`,
    }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}

async function main() {
  console.log("=== WITHOUT Chain of Thought ===");
  console.log(await withoutCoT());

  console.log("\n=== WITH Chain of Thought ===");
  console.log(await withCoT());
}

main().catch(console.error);
```

Run it. The CoT version should identify the race condition (non-atomic double save) and the lack of a transaction. The non-CoT version will likely just say "NO" or "YES" without catching the nuance.

### Step 3: Format Control --- Making Output Parseable (25 min)

When Claude's output feeds into your code (not a human), format control is non-negotiable. Here are three levels of format enforcement:

**Level 1: Describe the format in natural language**

```
Respond with a JSON object containing "score" (1-10) and "reason" (string).
```

This works most of the time but occasionally Claude adds markdown formatting or preamble text.

**Level 2: Provide an exact template**

```xml
<output_format>
Respond with ONLY this JSON, no other text:
{
  "score": <number 1-10>,
  "reason": "<one sentence>",
  "category": "<bug|feature|refactor|docs>"
}
</output_format>
```

More reliable. The "no other text" instruction helps prevent preambles.

**Level 3: Prefill the response (most reliable)**

The Anthropic API lets you start Claude's response with specific text by including a partial `assistant` message:

```typescript
const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 256,
  messages: [
    {
      role: "user",
      content: `Classify this ticket: "Login button not working on Safari"

Respond with JSON only: {"category": "...", "priority": "...", "summary": "..."}`,
    },
    {
      role: "assistant",
      content: "{", // Prefill! Claude continues from here
    },
  ],
});

// Claude's response will start with the rest of the JSON
// You prepend the "{" you already provided
const fullJson = "{" + (response.content[0].type === "text"
  ? response.content[0].text
  : "");
const parsed = JSON.parse(fullJson);
```

This is the **prefill technique** --- you put the opening character of the desired format in an `assistant` message, and Claude continues from there. It is the most reliable way to enforce JSON output because Claude literally cannot start its response with anything else.

### Step 4: When to Use CoT vs Skip It (15 min)

CoT is powerful but not free. It uses more tokens (costs more, takes longer). Here is the decision framework:

| Scenario | CoT? | Why |
|----------|------|-----|
| Complex code review | Yes | Multiple files, subtle bugs, needs deep analysis |
| Simple classification | No | "Is this a bug or feature?" --- one step, no reasoning needed |
| Multi-step math/logic | Yes | Each step builds on the previous |
| Extracting data from text | No | Pattern matching, not reasoning |
| Comparing two approaches | Yes | Needs weighing tradeoffs |
| Formatting conversion | No | Mechanical transformation |
| Debugging a stack trace | Yes | Needs to trace the error path |
| Generating boilerplate | No | Template application, no decisions |

**Rule of thumb:** If a junior developer would need to think about it for more than 30 seconds, use CoT. If they could do it mechanically, skip it.

### Step 5: Combining CoT with Format Control (15 min)

The most powerful pattern: let Claude think freely, then constrain the final output:

```xml
<task>
Analyze this Angular component for accessibility issues.
</task>

<code>
<!-- component code here -->
</code>

<instructions>
First, think through the component's accessibility step by step inside
<analysis> tags. Consider: keyboard navigation, screen reader support,
ARIA attributes, color contrast, focus management.

Then provide your structured assessment.
</instructions>

<output_format>
<analysis>
[Your detailed reasoning — be thorough]
</analysis>

<result>
{
  "score": <number 1-10>,
  "critical_issues": ["<issue 1>", "<issue 2>"],
  "warnings": ["<warning 1>"],
  "passes": ["<what's done well>"],
  "verdict": "PASS | FAIL | CONDITIONAL"
}
</result>
</output_format>
```

This gives you the best of both worlds: Claude reasons thoroughly (improving accuracy), but the final output is structured and parseable. Your code can extract the JSON from between the `<result>` tags while ignoring the analysis.

```typescript
// Parsing the structured output
const text = response.content[0].type === "text" ? response.content[0].text : "";
const resultMatch = text.match(/<result>\s*([\s\S]*?)\s*<\/result>/);
if (resultMatch) {
  const result = JSON.parse(resultMatch[1]);
  console.log(`Verdict: ${result.verdict}`);
  console.log(`Score: ${result.score}/10`);
}
```

## Key Concepts

**CoT trades tokens for accuracy.** It is an engineering tradeoff, just like trading memory for speed. You would not memoize a function that runs once. Do not use CoT for simple tasks.

**Format control is about downstream reliability.** If a human reads the output, approximate formatting is fine. If code parses it, you need deterministic structure. The prefill technique is your strongest tool for this.

**The analysis/result pattern is production-grade.** Reasoning in `<analysis>`, structured answer in `<result>`. This pattern will follow you through the entire roadmap. You will use it for tool selection (Week 3), agent decision-making (Week 5), and evaluation (Week 7).

## Build / Practice

Extend your `day-04-cot.ts` with a combined CoT + format control example. Pick a real Angular component from your codebase, ask Claude to analyze it, and parse the structured result in TypeScript.

## Resources

- [Chain of Thought (Anthropic Docs)](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought) --- official guide with examples
- [Prompt Engineering Tutorial Ch 5-6](https://github.com/anthropics/prompt-eng-interactive-tutorial) --- hands-on exercises
- [Prefill Claude's Response](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prefill-claudes-response) --- the prefill technique documentation
- [Control Output Format](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct#specify-the-desired-output-format) --- formatting strategies

## Done When

- [ ] You have completed Chapters 5-6 of the tutorial
- [ ] You can explain chain of thought in one sentence (forcing the model to reason before answering)
- [ ] You have built and run the CoT comparison example and seen the accuracy difference
- [ ] You understand the prefill technique and when to use it
- [ ] You know the decision framework for when CoT helps and when it wastes tokens
- [ ] You can implement the analysis/result pattern with XML tags and parse the output in TypeScript

---

*Friday is rest day. On Saturday you tackle few-shot examples and hallucination control --- two techniques that make the difference between a demo and a production feature. Enjoy the break.*
