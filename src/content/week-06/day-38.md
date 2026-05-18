# Day 38 — Workflows vs Agents Taxonomy

> *"A workflow is a recipe. An agent is a chef. Use the recipe when it exists — hire the chef when it doesn't."*

**Date:** Miercuri, 25 Iunie 2026
**Hours:** 2h · Evening build session
**Topic:** Deep comparison of workflows vs agents, building both for the same task
**Phase:** Faza 2 — Patterns · Week 6

---

## What You're Doing

Yesterday you built your first agent. It was exciting — watching an LLM decide its own next step feels like a glimpse of the future. Today you're going to temper that excitement with engineering discipline.

You're going to build the **exact same task** as both a workflow and an agent, then compare them side by side. The goal isn't to prove one is better — it's to develop the intuition for *when to use which*. This is the skill that separates a senior AI engineer from someone who agents-everything because it looks cool on Twitter.

The Anthropic paper gave you the theory. Today you'll feel the difference in your hands.

## The Work

### Step 1: The Deep Comparison Table

Before building anything, internalize the taxonomy. Create this reference document:

```markdown
| Dimension         | Workflow                        | Agent                            |
|-------------------|---------------------------------|----------------------------------|
| Steps             | Predefined by developer         | Dynamically chosen by LLM        |
| LLM role          | Fills in content at each step   | Decides what step to take next   |
| Predictability    | High — same path every time     | Low — different path each run    |
| Testing           | Easy — known inputs/outputs     | Hard — non-deterministic paths   |
| Debugging         | Step X failed → fix step X      | "Why did it go down path Y?"     |
| Error handling    | Handle each step explicitly     | Agent must self-recover          |
| Cost              | Predictable token usage         | Unpredictable, can spiral        |
| Latency           | Predictable, usually lower      | Unpredictable, often higher      |
| Flexibility       | Only handles designed cases     | Can handle unexpected situations |
| Maintenance       | Change steps, test again        | Change prompt, pray it still works|
| Best for          | Known processes, pipelines      | Open-ended research, exploration |
```

Read each row twice. The "Maintenance" row is the one that bites in production.

### Step 2: Build a Workflow — Blog Post Generator

Build a predetermined, step-by-step workflow for generating a blog post:

```typescript
interface WorkflowStep {
  name: string;
  prompt: string;
  inputFrom?: string; // previous step to pull input from
}

async function blogPostWorkflow(topic: string): Promise<string> {
  const results: Record<string, string> = {};

  // Step 1: Generate outline (ALWAYS happens)
  console.log('Step 1: Generating outline...');
  results.outline = await callLLM(
    `Create a detailed outline for a blog post about: ${topic}
     Include 4-5 main sections with bullet points for each.
     Output ONLY the outline, nothing else.`
  );

  // Step 2: Write each section (ALWAYS happens)
  console.log('Step 2: Writing sections...');
  results.body = await callLLM(
    `Using this outline, write the full blog post.
     Outline:
     ${results.outline}

     Write in a conversational, engaging tone.
     Each section should be 2-3 paragraphs.
     Include practical examples.`
  );

  // Step 3: Generate title options (ALWAYS happens)
  console.log('Step 3: Generating title...');
  results.title = await callLLM(
    `Given this blog post, generate 5 title options.
     Pick the best one and output ONLY that title.

     Post:
     ${results.body.substring(0, 1000)}...`
  );

  // Step 4: Format and assemble (ALWAYS happens)
  console.log('Step 4: Formatting...');
  results.final = await callLLM(
    `Format this blog post with proper Markdown.
     Add the title, section headers, and a brief intro.
     Title: ${results.title}
     Body: ${results.body}`
  );

  return results.final;
}
```

Notice: **every step is predetermined.** The LLM decides *what to write*, but you decided *the process*. Four steps. Always four steps. In order.

### Step 3: Build an Agent — Blog Post Agent

Now build the same task as an agent:

```typescript
const blogTools: Tool[] = [
  {
    name: 'research_topic',
    description: 'Research a topic to gather information and ideas',
    parameters: { query: { type: 'string', description: 'What to research', required: true } },
    execute: async (args) => `Research results for "${args.query}": [simulated research data]`,
  },
  {
    name: 'write_section',
    description: 'Write a section of the blog post',
    parameters: {
      title: { type: 'string', description: 'Section title', required: true },
      context: { type: 'string', description: 'What to cover', required: true },
    },
    execute: async (args) => `[Written section: ${args.title}]`,
  },
  {
    name: 'review_draft',
    description: 'Review current draft for quality and completeness',
    parameters: { draft: { type: 'string', description: 'The draft to review', required: true } },
    execute: async (args) => `Review: Good structure, could use more examples in section 2.`,
  },
  {
    name: 'finish_post',
    description: 'Finalize and output the complete blog post',
    parameters: { post: { type: 'string', description: 'The final blog post', required: true } },
    execute: async (args) => args.post as string,
  },
];

// Use the ReAct loop from Day 37
const result = await runAgent(
  'Write a blog post about TypeScript decorators with practical examples',
  blogTools
);
```

### Step 4: Compare — Side by Side

Run both. Then fill in this comparison for this specific task:

```markdown
## Blog Post: Workflow vs Agent

| Metric             | Workflow          | Agent              |
|--------------------|-------------------|--------------------|
| Steps taken        | 4 (always)        | 6-12 (varies)      |
| Total tokens       | ~4,000            | ~8,000-15,000      |
| Latency            | ~15s              | ~30-60s            |
| Output quality     | Consistent, good  | Varies, sometimes great |
| Predictability     | 100%              | ~70%               |
| Cost               | ~$0.02            | ~$0.04-0.08        |

VERDICT: For blog post generation, the WORKFLOW wins.
The task has a known process. An agent adds cost and unpredictability
without meaningful quality improvement.
```

### Step 5: The Hybrid — Workflow with an Agent Step

The real power emerges when you combine both. Build a hybrid:

```typescript
async function hybridBlogWorkflow(topic: string): Promise<string> {
  // Step 1: AGENT step — open-ended research
  // (We don't know what sources exist or how many we need)
  console.log('Step 1: Agent-driven research...');
  const research = await runAgent(
    `Research "${topic}" thoroughly. Find 3-5 key points, recent developments,
     and practical examples. Summarize your findings.`,
    [webSearch, readUrl, finish]
  );

  // Step 2: WORKFLOW step — structured writing
  // (We know exactly what to do with the research)
  console.log('Step 2: Structured writing...');
  const post = await callLLM(
    `Using this research, write a blog post:
     ${research}
     Format: Title, Intro, 4 sections, Conclusion.`
  );

  // Step 3: WORKFLOW step — formatting
  console.log('Step 3: Formatting...');
  const formatted = await callLLM(
    `Format this post in clean Markdown with proper headers: ${post}`
  );

  return formatted;
}
```

This is the pattern you'll use most in production: **workflow structure with agent flexibility where needed.** The research step is genuinely open-ended (you don't know what you'll find), so an agent makes sense. The writing and formatting steps have a known process, so workflows are better.

### Step 6: Build Your Intuition Checklist

```markdown
## When to Use What

USE A WORKFLOW when:
- [ ] You can list the steps on a whiteboard
- [ ] The task is the same every time (generate report, process form, etc.)
- [ ] Consistency matters more than creativity
- [ ] You need predictable costs and latency
- [ ] You need to test and debug reliably

USE AN AGENT when:
- [ ] You genuinely don't know the steps in advance
- [ ] The task requires dynamic information gathering
- [ ] Different inputs might need completely different approaches
- [ ] The search space is too large to pre-plan

USE A HYBRID when:
- [ ] Most steps are known, but 1-2 require exploration
- [ ] You want workflow reliability with agent flexibility
- [ ] You need to research before processing
```

## Key Insight

The blog post exercise reveals something important: agents don't automatically produce better results. For structured tasks, they produce *more variable* results at *higher cost*. The workflow's predictability is a feature, not a limitation. The hybrid approach gives you the best of both worlds — use an agent for the genuinely unknown parts, and a workflow for everything else.

## Resources

- [Building Effective Agents — Anthropic](https://www.anthropic.com/research/building-effective-agents)
- [Workflow Orchestration Patterns](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [When to Use AI Agents vs Chains](https://www.anthropic.com/research/building-effective-agents#when-and-how-to-use-frameworks)

## Done When

- [ ] You've built the same task (blog post) as both a workflow and an agent
- [ ] You've run both and compared tokens, latency, quality, and predictability
- [ ] You've built a hybrid workflow with an agent step inside
- [ ] You have a written intuition checklist for when to use each approach
- [ ] You can explain to a colleague why the workflow wins for structured tasks
- [ ] You understand that "agent" is not always better than "workflow"

---

*Tomorrow: Multi-step error recovery. Your agent will learn to handle failures gracefully instead of crashing at the first problem.*
