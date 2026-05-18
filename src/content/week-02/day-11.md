# Day 11 — Structured Outputs

> *"The gap between 'Claude said some JSON' and 'Claude returned valid, typed data my app can use' is where real engineering begins."*

**Date:** Joi, 29 Mai 2025
**Hours:** 2h · Seara (20:00--22:00)
**Topic:** Getting reliable structured data from Claude
**Phase:** Faza 1 — Foundations · Week 2

---

## What You're Doing

Claude speaks human language beautifully. But your TypeScript code doesn't consume paragraphs -- it consumes objects with known shapes. Today you solve the fundamental integration problem: how do you get Claude to return data in an exact structure your application can trust?

This is a problem you know intimately from Angular. Every HTTP response needs an interface. Every form has a model. You wouldn't pass `any` around your Angular app and hope for the best -- so why would you do that with LLM outputs?

Today you'll learn two approaches to structured outputs, understand why one is dramatically more reliable than the other, and integrate Zod for runtime validation. By the end, you'll have a pattern for extracting typed, validated data from Claude that's as reliable as a REST API response.

---

## The Work

### The Problem

Ask Claude "Analyze this text and return the sentiment, key topics, and a confidence score." You'll get something like:

```
The sentiment is positive. The key topics are: technology, AI, and programming.
My confidence score would be around 0.85.
```

That's great for a human. Useless for your code. You need:

```json
{
  "sentiment": "positive",
  "topics": ["technology", "AI", "programming"],
  "confidence": 0.85
}
```

And you need it *every time*, without fail, matching an exact schema.

### Approach 1: Tool Use for Structured Output (Recommended)

This is the reliable way. Instead of asking Claude to *output* JSON, you define a tool whose `input_schema` IS your desired output shape. Then you force Claude to "call" that tool using `tool_choice`.

The trick: the tool doesn't actually *do* anything. It's a schema-enforcement mechanism.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Define a "tool" whose schema IS your desired output
const tools: Anthropic.Tool[] = [
  {
    name: "analyze_text",
    description:
      "Analyze the given text and return structured sentiment analysis results.",
    input_schema: {
      type: "object" as const,
      properties: {
        sentiment: {
          type: "string",
          enum: ["positive", "negative", "neutral", "mixed"],
          description: "The overall sentiment of the text",
        },
        topics: {
          type: "array",
          items: { type: "string" },
          description: "Key topics mentioned in the text (max 5)",
        },
        confidence: {
          type: "number",
          description: "Confidence score between 0 and 1",
        },
        summary: {
          type: "string",
          description: "A one-sentence summary of the text",
        },
      },
      required: ["sentiment", "topics", "confidence", "summary"],
    },
  },
];

async function analyzeText(text: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    tools: tools,
    // Force Claude to use this specific tool
    tool_choice: { type: "tool", name: "analyze_text" },
    messages: [
      {
        role: "user",
        content: `Analyze the following text:\n\n${text}`,
      },
    ],
  });

  // Extract the tool call -- guaranteed to exist because of tool_choice
  const toolUse = response.content.find((block) => block.type === "tool_use");

  if (toolUse && toolUse.type === "tool_use") {
    return toolUse.input; // This IS your structured data
  }

  throw new Error("No tool use block in response");
}

// Use it
const result = await analyzeText(
  "TypeScript 5.4 brings amazing new features. The developer experience keeps getting better with each release. I'm excited about the new type narrowing capabilities."
);

console.log(result);
// {
//   sentiment: "positive",
//   topics: ["TypeScript", "developer experience", "type narrowing"],
//   confidence: 0.92,
//   summary: "Enthusiastic review of TypeScript 5.4's new features and improved developer experience."
// }
```

**Why this works**: `tool_choice: { type: "tool", name: "analyze_text" }` forces Claude to call the tool with inputs matching the `input_schema`. The API validates the schema *before* returning the response. This is constraint at the protocol level, not the prompt level.

**Why this is better than prompt-based JSON**: Claude's tool-use training specifically optimizes for producing valid JSON that matches tool schemas. It's a different generation pathway than free-text output. Schema violations are caught at the API level.

### Approach 2: JSON Mode via Prompt

Sometimes you want JSON without the overhead of tool definitions. You can ask Claude directly:

```typescript
const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: `Analyze this text and return a JSON object with these exact fields:
- sentiment: "positive" | "negative" | "neutral" | "mixed"
- topics: string[] (max 5)
- confidence: number (0 to 1)
- summary: string (one sentence)

Return ONLY the JSON object, no other text.

Text to analyze:
"TypeScript 5.4 brings amazing new features. The developer experience keeps getting better."`,
    },
  ],
});

const text =
  response.content[0].type === "text" ? response.content[0].text : "";
const parsed = JSON.parse(text); // Hope it parses...
```

This works *most of the time*. But:
- Claude might wrap it in markdown code fences (` ```json ... ``` `)
- Claude might add explanatory text before/after the JSON
- The schema isn't enforced -- fields might be missing or wrong types
- You're relying on prompt engineering, not protocol guarantees

**Use Approach 2 only for** prototyping or when you truly don't need reliability.

### Validation with Zod

Regardless of which approach you use, always validate with [Zod](https://zod.dev). Trust but verify.

```typescript
import { z } from "zod";

// Define your schema
const TextAnalysisSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral", "mixed"]),
  topics: z.array(z.string()).max(5),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
});

// Type is automatically inferred
type TextAnalysis = z.infer<typeof TextAnalysisSchema>;

async function analyzeTextSafe(text: string): Promise<TextAnalysis> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    tools: tools, // same tool definition from Approach 1
    tool_choice: { type: "tool", name: "analyze_text" },
    messages: [{ role: "user", content: `Analyze:\n\n${text}` }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Expected tool use response");
  }

  // Validate AND type the response
  const validated = TextAnalysisSchema.parse(toolUse.input);
  return validated;
}
```

Now `validated` is typed as `TextAnalysis` and you have runtime guarantees. If Claude ever returns something that doesn't match -- wrong enum value, missing field, confidence of 2.5 -- Zod throws with a clear error.

### Zod-to-JSON-Schema Bridge

You can generate your tool's `input_schema` directly from your Zod schema, keeping everything in sync:

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const TextAnalysisSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral", "mixed"])
    .describe("The overall sentiment of the text"),
  topics: z.array(z.string()).max(5)
    .describe("Key topics mentioned (max 5)"),
  confidence: z.number().min(0).max(1)
    .describe("Confidence score between 0 and 1"),
  summary: z.string()
    .describe("One-sentence summary"),
});

// Convert Zod schema to JSON Schema for the tool definition
const jsonSchema = zodToJsonSchema(TextAnalysisSchema, {
  target: "openApi3",
});

const tools: Anthropic.Tool[] = [
  {
    name: "analyze_text",
    description: "Return structured text analysis results.",
    input_schema: jsonSchema as Anthropic.Tool["input_schema"],
  },
];
```

**Install**: `npm install zod zod-to-json-schema`

One source of truth. Your Zod schema defines the type, the validation, and the tool's input_schema. Change it once, everything updates.

### Practical Pattern: Extract Entities

Here's a real-world pattern -- extracting structured entities from unstructured text:

```typescript
const PersonSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional(),
});

const ExtractionSchema = z.object({
  people: z.array(PersonSchema),
  organizations: z.array(z.string()),
  dates: z.array(z.object({
    date: z.string(),
    context: z.string(),
  })),
  action_items: z.array(z.string()),
});

type Extraction = z.infer<typeof ExtractionSchema>;

// Use with tool_choice to force structured output
// Input: messy meeting notes
// Output: clean, typed, validated data
```

This is the kind of feature that takes weeks to build with traditional NLP and takes an afternoon with Claude + Zod.

### When to Use Which Approach

| Scenario | Approach | Why |
|----------|----------|-----|
| Production data extraction | Tool + Zod | Schema enforced at API level + runtime validation |
| Quick prototype | Prompt JSON | Faster to write, good enough for testing |
| User-facing structured responses | Tool + Zod | Can't afford malformed data |
| Internal logging/analytics | Either | Lower stakes, prompt JSON may suffice |
| Complex nested schemas | Tool + Zod | Nested JSON from prompts is unreliable |

---

## Key Insight

`tool_choice: { type: "tool", name: "..." }` is not just a convenience -- it changes the *generation pathway*. When Claude knows it must produce tool-compatible JSON, it uses specialized logic trained for structured output. When you ask for JSON in a prompt, Claude is generating free text that happens to look like JSON. The difference in reliability is significant, especially for complex or nested schemas.

Think of it like the difference between Angular's `FormControl` with validators vs. trusting user input. Both "work." Only one is production-grade.

---

## Build

### Structured Extraction CLI

Build a CLI tool that:

1. Takes a block of text as input (paste a paragraph, an email, meeting notes, etc.)
2. Uses a tool with `tool_choice` to extract structured data
3. Validates with Zod before returning
4. Outputs clean, formatted JSON to the terminal

Define at least two extraction schemas:

**Schema 1: Text Analysis**
```typescript
{
  sentiment: "positive" | "negative" | "neutral" | "mixed",
  topics: string[],
  confidence: number,
  summary: string,
  language: string
}
```

**Schema 2: Contact Extraction**
```typescript
{
  people: Array<{ name: string, role?: string, email?: string }>,
  companies: string[],
  phone_numbers: string[],
  action_items: string[]
}
```

Let the user choose which extraction schema to use via a command-line argument (e.g., `--mode analyze` or `--mode contacts`).

Test with real data -- copy a paragraph from a blog post, a work email (sanitized), or a LinkedIn message.

**Stretch goal**: Add a `--validate-only` flag that shows what Zod validation errors occur when you deliberately corrupt the schema (e.g., remove a required field from the tool definition).

---

## Resources

- **[Structured Outputs with Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/structured-outputs)** -- Anthropic's official guide to using tools for structured data extraction.
- **[Zod Documentation](https://zod.dev/)** -- The TypeScript schema validation library. Read the "Basic Usage" and "Objects" sections.
- **[zod-to-json-schema](https://www.npmjs.com/package/zod-to-json-schema)** -- Converts Zod schemas to JSON Schema format for tool definitions.
- **[Anthropic Cookbook: Structured Output](https://github.com/anthropics/anthropic-cookbook/tree/main/tool_use)** -- Working examples of the tool_choice pattern.

---

## Done When

- [ ] You can force structured output using `tool_choice: { type: "tool", name: "..." }`
- [ ] You understand the difference between tool-based and prompt-based JSON extraction
- [ ] You have a Zod schema that validates Claude's structured output
- [ ] Your code throws a clear error if Claude's output doesn't match the schema
- [ ] You can explain why `tool_choice` is more reliable than asking for JSON in the prompt
- [ ] You've successfully extracted structured data from at least two different types of text
- [ ] The output is valid JSON that passes Zod validation every time

---

*Day 12 is REST -- recharge. Then: [Day 13 -- Token Economics](/day-13.md) -- understanding what every API call costs and building a cost tracker.*
