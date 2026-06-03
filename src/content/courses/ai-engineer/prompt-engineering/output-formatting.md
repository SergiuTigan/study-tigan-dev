---
title: "Output Formatting"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "prompt-engineering"
moduleTitle: "Prompt Engineering"
moduleDescription: "Master the art and science of crafting effective prompts for large language models."
lessonId: "ai-engineer/prompt-engineering/output-formatting"
duration: "10 min"
order: 203
moduleOrder: 2
lessonOrder: 3
color: "purple"
---
# Output Formatting

Controlling the format of LLM outputs is critical for building reliable applications. Unstructured text is hard to parse; structured output integrates cleanly with your code.

## JSON Output

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: `Extract the following information from this text and return it as JSON:

Text: "John Smith, 35, is a senior engineer at TechCorp in San Francisco. He has worked there for 5 years."

Return a JSON object with these fields:
- name (string)
- age (number)
- title (string)
- company (string)
- city (string)
- tenure_years (number)`,
  }],
});
```

## Enforcing JSON with System Prompts

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: 'You are a structured data extraction API. Always respond with valid JSON only. No markdown, no explanations, just the JSON object.',
  messages: [{ role: 'user', content: extractionPrompt }],
});

const data = JSON.parse(response.content[0].text);
```

## XML Tags for Structured Sections

Claude responds particularly well to XML-tagged output:

```typescript
const systemPrompt = `Analyze the code and provide your response in this format:

<analysis>
<summary>One-sentence summary of what the code does</summary>
<issues>
<issue severity="high|medium|low">Description of the issue</issue>
</issues>
<suggestion>Improved code</suggestion>
</analysis>`;
```

## Validation with Zod

Always validate LLM outputs:

```typescript
import { z } from 'zod';

const PersonSchema = z.object({
  name: z.string(),
  age: z.number().int().positive(),
  title: z.string(),
  company: z.string(),
  city: z.string(),
  tenure_years: z.number().int().nonnegative(),
});

const raw = JSON.parse(response.content[0].text);
const person = PersonSchema.parse(raw); // Throws if invalid
```

## Best Practices

- Always provide an example of the expected output format.
- Use JSON mode or structured output when available (OpenAI's `response_format: { type: "json_object" }`).
- Validate all outputs before using them in your application.
- Handle parsing failures gracefully with retries.
