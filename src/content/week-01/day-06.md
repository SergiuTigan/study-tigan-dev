# Day 6 --- Few-Shot Examples + Hallucination Control

> *"Few-shot examples are the training data you provide at inference time. They are the most direct way to show Claude what you mean instead of telling it."*

**Date:** Sambata, 24 Mai 2026
**Hours:** 3h · 10:00--13:00
**Topic:** Few-shot prompting, hallucination prevention strategies, building a production-grade classifier
**Phase:** Faza 1 --- Foundations · Week 1

---

## What You Are Doing

You have spent four days learning how to tell Claude what you want. Today you learn to *show* it. Few-shot prompting is the technique of including input-output examples in your prompt so Claude can learn the pattern and generalize. It is the difference between explaining to someone how to sort a data structure and just showing them five sorted examples.

The second half of today tackles the dark side of language models: hallucination. Claude will confidently state things that are not true, invent API methods that do not exist, and cite documentation pages that were never written. This is not a bug --- it is a fundamental property of how language models generate text. But there are concrete techniques to control it. You need to learn them before you build anything a user will trust.

By the end of today, you will have built a ticket classifier that reliably categorizes support tickets into the right categories, handles edge cases gracefully, and never invents categories that do not exist. This is your first production-relevant AI feature.

## The Work

### Step 1: Complete Tutorial Chapters 7-8 (40 min)

Work through the next two chapters of the tutorial. Chapter 7 covers examples and few-shot learning, Chapter 8 covers avoiding hallucinations.

### Step 2: Few-Shot Prompting --- Show, Don't Tell (30 min)

The principle is simple: instead of describing the transformation you want, demonstrate it. Here is the structure:

```xml
<task>
Classify the following support ticket into exactly one category.
</task>

<categories>
- BUG: Something is broken that used to work
- FEATURE_REQUEST: User wants new functionality
- QUESTION: User needs help understanding existing functionality
- ACCOUNT: Login, billing, permissions, or account management
- PERFORMANCE: Slowness, timeouts, or resource issues
</categories>

<examples>
  <example>
    <input>The export button gives me a 500 error since yesterday's update</input>
    <output>{"category": "BUG", "confidence": "high", "reasoning": "Feature that worked before now returns server error after a deployment"}</output>
  </example>

  <example>
    <input>Can you add dark mode to the dashboard?</input>
    <output>{"category": "FEATURE_REQUEST", "confidence": "high", "reasoning": "Request for new visual functionality that does not exist"}</output>
  </example>

  <example>
    <input>How do I set up SSO for my team?</input>
    <output>{"category": "QUESTION", "confidence": "high", "reasoning": "Asking how to use existing feature, not reporting a problem"}</output>
  </example>

  <example>
    <input>The page takes 30 seconds to load when I have more than 1000 items</input>
    <output>{"category": "PERFORMANCE", "confidence": "high", "reasoning": "Specific performance degradation tied to data volume"}</output>
  </example>

  <example>
    <input>I can't log in and I forgot my password but the reset email never arrives</input>
    <output>{"category": "ACCOUNT", "confidence": "high", "reasoning": "Login and password reset are account management functions"}</output>
  </example>
</examples>

<ticket>
{{TICKET_TEXT}}
</ticket>

<output_format>
Respond with ONLY the JSON object, no other text:
{"category": "...", "confidence": "high|medium|low", "reasoning": "..."}
</output_format>
```

**Why this works so well:**

1. **Pattern completion.** Claude sees five input-output pairs and learns the pattern. It does not need to figure out your intent --- it just continues the pattern.
2. **Edge case handling.** The password reset example teaches Claude that compound issues should be classified by the primary concern (account access), not the secondary symptom.
3. **Output format is demonstrated, not just described.** Claude sees the exact JSON shape five times. It will match it precisely.
4. **The `reasoning` field forces transparency.** You can audit *why* Claude chose a category, which is invaluable for debugging and improving the prompt.

**How to choose good examples:**

- Cover each category at least once
- Include at least one ambiguous example that could go either way
- Include at least one example with multiple concerns
- Make examples diverse in length and phrasing
- Order does not matter much, but putting the most "typical" examples first is slightly better

### Step 3: Hallucination Control (30 min)

Hallucination in LLMs means the model generates text that sounds plausible but is factually wrong. In the Angular world, this shows up as:

- Suggesting API methods that do not exist (e.g., `component.detectChanges()` used in a context where it is not available)
- Citing Angular documentation pages with plausible but fictional URLs
- Inventing configuration options for third-party libraries
- Describing behavior for the wrong version of Angular

Here are five concrete strategies to control hallucination:

**Strategy 1: The Escape Hatch**

Explicitly give Claude permission to say "I don't know."

```xml
<rules>
If you are not certain about a specific API, method, or configuration option,
say "I'm not sure about this — verify in the docs" instead of guessing.
It is better to be honest than to be confidently wrong.
</rules>
```

Without this, Claude's default behavior is to always provide an answer, even when uncertain. The escape hatch changes the incentive.

**Strategy 2: Source Material Only**

Provide the material Claude should draw from, and instruct it to stay within those bounds.

```xml
<documentation>
<!-- paste the relevant docs, README, or API spec -->
</documentation>

<rules>
Answer based ONLY on the documentation provided above.
If the answer is not in the documentation, say "Not covered in provided docs."
Do not draw on general knowledge about this library.
</rules>
```

This is the "closed book exam" approach. It is extremely effective for Q&A features, documentation chatbots, and any situation where accuracy matters more than coverage.

**Strategy 3: Cite Specific Parts**

Force Claude to point to its evidence.

```xml
<task>
Answer the user's question based on the codebase context provided.
For every claim you make, cite the specific file and line number from the context.
If you cannot cite a specific source, prefix the statement with "[UNVERIFIED]".
</task>
```

**Strategy 4: Confidence Levels**

Make uncertainty visible in the output.

```xml
<output_format>
{
  "answer": "...",
  "confidence": "high|medium|low",
  "sources": ["file:line", "file:line"],
  "caveats": ["anything you're unsure about"]
}
</output_format>
```

**Strategy 5: Constrain the Output Space**

The fewer options Claude has, the less room for hallucination. Enumerating valid responses eliminates the possibility of invented categories.

```xml
<valid_categories>BUG | FEATURE_REQUEST | QUESTION | ACCOUNT | PERFORMANCE</valid_categories>
<rule>The category MUST be one of the valid_categories listed above. No other values are allowed.</rule>
```

### Step 4: Build the Ticket Classifier (60 min)

This is your main build for today. Create `src/day-06-classifier.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic();

interface ClassificationResult {
  category: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

const VALID_CATEGORIES = [
  "BUG",
  "FEATURE_REQUEST",
  "QUESTION",
  "ACCOUNT",
  "PERFORMANCE",
] as const;

const SYSTEM_PROMPT = `You are a support ticket classifier for a B2B SaaS platform.
You classify tickets into exactly one category. You are precise and consistent.
If a ticket is ambiguous, you choose the most likely category and set confidence to "medium" or "low".
You NEVER invent categories outside the provided list.
If a ticket is completely unrelated to the product, classify it as "QUESTION" with low confidence.`;

const CLASSIFIER_PROMPT = `
<categories>
- BUG: Something is broken that used to work, errors, crashes, incorrect behavior
- FEATURE_REQUEST: User wants new functionality that does not exist
- QUESTION: User needs help understanding existing functionality
- ACCOUNT: Login, billing, permissions, password, team management
- PERFORMANCE: Slowness, timeouts, high resource usage, scaling issues
</categories>

<examples>
  <example>
    <input>The export button gives me a 500 error since yesterday's update</input>
    <output>{"category": "BUG", "confidence": "high", "reasoning": "Previously working export feature now returns server error, likely regression from recent deployment"}</output>
  </example>

  <example>
    <input>Can you add dark mode to the dashboard?</input>
    <output>{"category": "FEATURE_REQUEST", "confidence": "high", "reasoning": "Requesting visual functionality that does not currently exist in the product"}</output>
  </example>

  <example>
    <input>How do I set up SSO for my team?</input>
    <output>{"category": "QUESTION", "confidence": "high", "reasoning": "Seeking guidance on using an existing feature, not reporting a problem"}</output>
  </example>

  <example>
    <input>The page takes 30 seconds to load when I have more than 1000 items</input>
    <output>{"category": "PERFORMANCE", "confidence": "high", "reasoning": "Specific performance degradation correlated with data volume"}</output>
  </example>

  <example>
    <input>I can't log in and the password reset email never arrives</input>
    <output>{"category": "ACCOUNT", "confidence": "high", "reasoning": "Authentication and account recovery issues fall under account management"}</output>
  </example>
</examples>

<ticket>
{{TICKET}}
</ticket>

Respond with ONLY the JSON object. No markdown, no explanation, no code fences:
{"category": "...", "confidence": "high|medium|low", "reasoning": "..."}`;

async function classifyTicket(ticket: string): Promise<ClassificationResult> {
  const prompt = CLASSIFIER_PROMPT.replace("{{TICKET}}", ticket);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: "{" }, // Prefill for reliable JSON
    ],
  });

  const text = response.content[0].type === "text"
    ? response.content[0].text
    : "";
  const fullJson = "{" + text;

  try {
    const result = JSON.parse(fullJson) as ClassificationResult;

    // Validate category is in allowed list
    if (!VALID_CATEGORIES.includes(result.category as any)) {
      console.warn(
        `WARNING: Model returned invalid category "${result.category}". Defaulting to QUESTION.`
      );
      result.category = "QUESTION";
      result.confidence = "low";
    }

    return result;
  } catch (e) {
    console.error("Failed to parse JSON:", fullJson);
    throw new Error("Classification failed — invalid JSON response");
  }
}

// Test with various tickets, including edge cases
async function main() {
  const testTickets = [
    // Clear-cut cases
    "The save button does nothing when I click it",
    "Please add the ability to export to PDF",
    "Where can I find the API documentation?",

    // Ambiguous / edge cases
    "The app is slow and also the search gives wrong results",
    "I need to change my company name but the settings page shows an error",
    "Your product is terrible and I want a refund",
    "asdfghjkl",
    "Can you integrate with Salesforce? Also my dashboard is broken.",

    // Tricky: multiple valid categories
    "My team member can't access the reports page and it loads very slowly for me",
  ];

  console.log("Ticket Classifier Results\n" + "=".repeat(60));

  for (const ticket of testTickets) {
    try {
      const result = await classifyTicket(ticket);
      console.log(`\nTicket: "${ticket}"`);
      console.log(
        `  → ${result.category} (${result.confidence}) — ${result.reasoning}`
      );
    } catch (e) {
      console.error(`\nTicket: "${ticket}"`);
      console.error(`  → ERROR: ${(e as Error).message}`);
    }
  }
}

main().catch(console.error);
```

Run it and study the results. Pay special attention to:

1. **How does it handle the gibberish input?** (It should classify with low confidence)
2. **How does it handle multi-issue tickets?** (It should pick the primary concern)
3. **Does it ever invent a category?** (It should not, but check)
4. **Are the confidence levels appropriate?** (Ambiguous tickets should get medium/low)

## Key Concepts

**Few-shot examples are the strongest control mechanism you have.** More powerful than elaborate instructions. If Claude sees five examples of the pattern you want, it will generalize that pattern more reliably than if you explain the pattern in prose.

**Hallucination is not random; it is systematic.** Claude hallucinates most when (a) it lacks information, (b) the expected output space is unbounded, and (c) it has no permission to be uncertain. Address all three.

**Validation is not optional.** Even with perfect prompts, always validate the output in code. Check that categories are valid, JSON parses correctly, and confidence levels are within expected bounds. Defense in depth applies to AI features just like it applies to security.

**The prefill technique plus validation is a production pattern.** Prefill ensures format compliance. Validation catches the remaining edge cases. Together they give you reliability.

## Build / Practice

Your classifier is the deliverable. After the main build, extend it:

1. Add a sixth category (e.g., `INTEGRATION`) with a new few-shot example
2. Test with 5 more edge-case tickets you write yourself
3. Track how often the model returns low-confidence results and decide if those need human review

## Resources

- [Prompt Engineering Tutorial Ch 7-8](https://github.com/anthropics/prompt-eng-interactive-tutorial) --- few-shot and hallucination exercises
- [Use Examples (Anthropic Docs)](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-examples) --- official guide on few-shot prompting
- [Reduce Hallucinations](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations) --- Anthropic's hallucination mitigation strategies
- [Prefill Claude's Response](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prefill-claudes-response) --- prefill technique for format enforcement

## Done When

- [ ] You have completed Chapters 7-8 of the tutorial
- [ ] You can explain few-shot prompting and when it outperforms zero-shot
- [ ] You have built the ticket classifier with 5 few-shot examples
- [ ] The classifier handles all test cases including edge cases (gibberish, multi-issue, ambiguous)
- [ ] The classifier never invents a category outside the valid list
- [ ] You can name at least 4 strategies for controlling hallucination
- [ ] You understand why validation in code is necessary even with good prompts
- [ ] Your classifier uses the prefill technique for reliable JSON output

---

*Tomorrow: The big build day. You will consolidate everything from this week into a reusable `prompts.md` toolkit, study Claude 4 specific best practices, and end Week 1 with a reflection on how far you have come.*
