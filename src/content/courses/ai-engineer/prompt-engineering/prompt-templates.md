---
title: "Prompt Templates & Variables"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "prompt-engineering"
moduleTitle: "Prompt Engineering"
moduleDescription: "Master the art and science of crafting effective prompts for large language models."
lessonId: "ai-engineer/prompt-engineering/prompt-templates"
duration: "10 min"
order: 204
moduleOrder: 2
lessonOrder: 4
color: "purple"
---
# Prompt Templates & Variables

Prompt templates separate the prompt structure from the dynamic content. This is essential for maintaining, testing, and versioning your prompts.

## Basic Template Pattern

```typescript
interface SummarizationInput {
  text: string;
  maxSentences: number;
  style: 'technical' | 'casual' | 'executive';
}

function buildSummarizationPrompt(input: SummarizationInput): string {
  return `Summarize the following text in ${input.maxSentences} sentences.
Use a ${input.style} writing style.

Text to summarize:
${input.text}

Summary:`;
}
```

## System Prompt + User Prompt Pattern

```typescript
interface PromptTemplate {
  system: string;
  user: (vars: Record<string, string>) => string;
}

const classificationTemplate: PromptTemplate = {
  system: `You are a support ticket classifier. Classify tickets into exactly one category:
- BILLING: Payment, invoices, subscriptions
- TECHNICAL: Bugs, errors, integrations
- ACCOUNT: Login, permissions, profile
- FEATURE: Feature requests, suggestions

Respond with only the category name.`,

  user: (vars) => `Classify this support ticket:

Subject: ${vars.subject}
Body: ${vars.body}`,
};
```

## Template Registry

```typescript
const templates = new Map<string, PromptTemplate>();

templates.set('classify-ticket', classificationTemplate);
templates.set('summarize', summarizationTemplate);
templates.set('extract-entities', entityExtractionTemplate);

function getPrompt(name: string, vars: Record<string, string>): {
  system: string;
  user: string;
} {
  const template = templates.get(name);
  if (!template) throw new Error(`Unknown template: ${name}`);
  return {
    system: template.system,
    user: template.user(vars),
  };
}
```

## Version Control

Store prompts as separate files and version them:

```
prompts/
├── classify-ticket/
│   ├── v1.ts
│   ├── v2.ts      # Improved accuracy
│   └── latest.ts  # Re-exports current version
├── summarize/
│   └── v1.ts
└── index.ts
```

## Best Practices

- Treat prompts as code: version them, review them, test them.
- Use type-safe template variables (TypeScript interfaces).
- Separate system prompts from user prompts.
- Include prompt version in your logs for debugging.
- Never concatenate user input directly -- sanitize and validate first.
