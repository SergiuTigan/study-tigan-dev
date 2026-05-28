---
title: "Day 3 --- Roles & XML Structuring"
week: 1
day: 3
phase: 1
phaseLabel: "Foundations"
order: 103
type: "day"
---
# Day 3 --- Roles & XML Structuring

> *"XML tags in prompts are like TypeScript interfaces for natural language --- they impose structure where chaos would otherwise reign."*

**Date:** Miercuri, 21 Mai 2026
**Hours:** 2h · 20:00--22:00
**Topic:** Role assignment, XML-structured prompts, separating concerns in natural language
**Phase:** Faza 1 --- Foundations · Week 1

---

## What You Are Doing

In Angular, you do not dump everything into one component. You separate concerns: a service for data, a component for rendering, a pipe for transformation, an interface for the shape. You do this because separation makes things predictable, testable, and maintainable.

Today you learn to do the same thing with prompts. XML tags are Claude's native structuring mechanism --- the model was specifically trained to understand and respect them. When you wrap parts of your prompt in `<context>`, `<task>`, `<code>`, and `<output_format>` tags, Claude processes each section with a clearer understanding of its purpose. The result: more accurate, more consistent, more controllable outputs.

This is not a nice-to-have. XML structuring is the single highest-leverage prompt engineering technique you will learn this week. By the end of tonight, you should be reaching for XML tags the same way you reach for TypeScript interfaces --- automatically, without thinking.

## The Work

### Step 1: Complete Tutorial Chapters 3-4 (40 min)

Continue with the Anthropic interactive tutorial:

**Chapter 3** covers role prompting --- assigning Claude a specific persona or expertise. **Chapter 4** introduces structured output and formatting control.

Work through the exercises. Pay attention to how role assignment changes the tone, depth, and framing of responses.

### Step 2: XML Tags --- The Core Technique (30 min)

Here is a real-world prompt without XML structure:

```
You are a senior Angular developer. I need you to review this code. The code
is a user profile component. It fetches data, handles forms, and manages state.
I want you to check for performance issues, suggest improvements, and format
your response as a checklist. Here is the code: [code pasted here]. Also here
are the requirements from the ticket: [requirements here].
```

That works. But it is a wall of text where context, input, instructions, and format bleed into each other. Now here is the same prompt with XML tags:

```xml
<role>
You are a senior Angular architect conducting a code review.
You have deep expertise in Angular 18+, Signals, and performance optimization.
</role>

<context>
This is a user profile component in a B2B SaaS application.
The component handles data fetching, form management, and local state.
The team is migrating from RxJS to Signals incrementally.
</context>

<code language="typescript">
@Component({
  selector: 'app-user-profile',
  template: `
    <form [formGroup]="profileForm" (ngSubmit)="save()">
      <input formControlName="name" />
      <input formControlName="email" />
      <button type="submit" [disabled]="!profileForm.valid">Save</button>
    </form>
    <div *ngIf="loading">Loading...</div>
  `,
})
export class UserProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  private subscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    this.subscription = this.route.params.pipe(
      switchMap(params => this.userService.getUser(params['id']))
    ).subscribe(user => {
      this.profileForm.patchValue(user);
      this.loading = false;
    });
  }

  save() {
    this.userService.updateUser(this.profileForm.value).subscribe();
  }

  // No ngOnDestroy!
}
</code>

<requirements>
From ticket PROJ-1234:
- Component should use OnPush change detection
- Loading state should be reactive (Signal or Observable)
- Form must show validation errors inline
- Must handle API errors gracefully
</requirements>

<task>
Review this component against the requirements and Angular best practices.
</task>

<output_format>
Respond with a markdown checklist grouped by severity:

## Critical (must fix before merge)
- [ ] Issue: description | Fix: one-line suggestion

## Warning (should fix soon)
- [ ] Issue: description | Fix: one-line suggestion

## Suggestion (nice to have)
- [ ] Issue: description | Fix: one-line suggestion

End with a VERDICT: APPROVE / REQUEST_CHANGES / BLOCK
</output_format>
```

**Why this is better:**

1. **Claude knows what is code vs what is instructions.** Without tags, the model has to guess where your instructions end and the code begins. With `<code>`, it is unambiguous.
2. **Each section has a single responsibility.** Just like Angular components.
3. **The output format is isolated.** You can change the format without touching the task or the code.
4. **It is composable.** You can swap out the `<code>` block without changing anything else. You can reuse the `<output_format>` across different reviews.

### Step 3: The Tag Vocabulary (15 min)

You do not need to memorize a specific set of tags. Claude understands *any* reasonable XML tag name. But here are the most useful ones:

| Tag | Purpose | Angular Analogy |
|-----|---------|----------------|
| `<role>` or `<persona>` | Who Claude should be | Service provider configuration |
| `<context>` | Background information | Module imports, dependencies |
| `<task>` or `<instructions>` | What to do | Component class logic |
| `<input>` or `<code>` or `<data>` | Material to work with | `@Input()` properties |
| `<constraints>` or `<rules>` | What NOT to do | Validation, guards |
| `<output_format>` or `<format>` | Shape of the response | Template / interface |
| `<examples>` | Few-shot demonstrations | Unit tests as documentation |
| `<thinking>` | Space for Claude to reason | Like `console.log` for debugging |

### Step 4: Practice --- Restructure 3 Real Prompts (35 min)

This is the core exercise. Take three prompts from your actual work --- things you have asked ChatGPT or Claude in the past --- and restructure them with XML tags.

**Prompt 1: Code explanation**

```xml
<context>
I inherited this codebase and need to understand this function quickly.
I am a Senior Angular developer comfortable with TypeScript and RxJS.
</context>

<code language="typescript">
<!-- paste a real function from your codebase -->
</code>

<task>
Explain what this function does in plain language.
Then identify the one thing about it that is most likely to confuse a new team member.
</task>

<output_format>
**What it does:** (2-3 sentences)
**Confusing part:** (1 sentence + why it is confusing)
**How I would rename/refactor for clarity:** (1 concrete suggestion)
</output_format>
```

**Prompt 2: Error diagnosis**

```xml
<context>
Angular 18 application, standalone components, SSR enabled.
This error appeared after upgrading from Angular 17.
</context>

<error>
ERROR NullInjectorError: No provider for HttpClient!
  at NullInjector.get (core.mjs:1234)
  at R3Injector.get (core.mjs:5678)
</error>

<task>
Diagnose the root cause and provide the fix.
Do not explain what dependency injection is — I know.
</task>

<output_format>
**Root cause:** (one sentence)
**Fix:** (code snippet showing exactly what to add/change)
**Why this broke during upgrade:** (one sentence)
</output_format>
```

**Prompt 3: Write your own.** Pick something from your actual daily work. Structure it.

For each prompt, run both the unstructured and XML-structured versions through the API. Compare output quality.

## Key Concepts

**XML tags are not magic --- they are boundaries.** They work because they create unambiguous boundaries between different types of information. Claude's training taught it to respect these boundaries. Without them, the model is parsing your intent from a stream of natural language. With them, each section's purpose is explicit.

**Nesting is fine.** You can nest XML tags:

```xml
<examples>
  <example>
    <input>User clicks save with empty form</input>
    <output>Show validation errors, do not submit</output>
  </example>
  <example>
    <input>User clicks save with valid form</input>
    <output>Submit, show success toast, redirect</output>
  </example>
</examples>
```

This nesting is especially powerful for few-shot examples (Day 6).

**Close your tags.** Claude is forgiving about malformed XML, but you should close your tags properly. Think of it as the same discipline as closing HTML tags --- technically some browsers will fix it for you, but you would never ship unclosed tags on purpose.

**Tags do not need to be in the system prompt.** You can use XML tags in user messages, system prompts, or both. Use them wherever structure would help.

## Build / Practice

Create `src/day-03-xml.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic();

async function xmlVsPlain() {
  const plainPrompt = `You are an Angular expert. Review this code and tell
me what's wrong. The code is: export class MyComponent { data: any;
ngOnInit() { fetch('/api/data').then(r => r.json()).then(d => this.data = d); }
} I want a checklist of issues sorted by severity.`;

  const xmlPrompt = `
<role>Senior Angular architect performing a code review.</role>

<code language="typescript">
export class MyComponent {
  data: any;

  ngOnInit() {
    fetch('/api/data')
      .then(r => r.json())
      .then(d => this.data = d);
  }
}
</code>

<task>Identify all issues with this Angular component.</task>

<output_format>
Checklist sorted by severity (critical first):
- [severity] issue description → fix suggestion
</output_format>`;

  for (const [label, prompt] of [["PLAIN", plainPrompt], ["XML", xmlPrompt]]) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text"
      ? response.content[0].text
      : "";
    console.log(`\n${"=".repeat(60)}`);
    console.log(`${label} — ${response.usage.output_tokens} output tokens`);
    console.log("=".repeat(60));
    console.log(text);
  }
}

xmlVsPlain().catch(console.error);
```

Run it. The XML version should produce a more organized, more consistent review.

## Resources

- [Use XML Tags (Anthropic Docs)](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags) --- official guide to XML structuring
- [Prompt Engineering Tutorial Ch 3-4](https://github.com/anthropics/prompt-eng-interactive-tutorial) --- role prompting and formatting
- [Anthropic Cookbook: Prompt Engineering](https://github.com/anthropics/anthropic-cookbook) --- more examples of structured prompts

## Done When

- [ ] You have completed Chapters 3-4 of the tutorial
- [ ] You can list at least 6 useful XML tags and their purposes
- [ ] You have restructured 3 real prompts from your work with XML tags
- [ ] You have compared XML vs plain versions through the API and seen the difference
- [ ] When you start writing a new prompt, your instinct is to reach for XML tags first
- [ ] You understand that XML tags are boundaries, not decorations --- each one serves a structural purpose

---

*Tomorrow: Chain of Thought and Format Control. You will learn when to ask Claude to "think out loud" before answering (and when that wastes tokens), plus how to enforce exact output formats like VERDICT: PASS/FAIL.*
