# Day 51 — Build Golden Dataset

> *"The quality of your eval is the quality of your dataset. Garbage in, garbage metrics out."*

**Date:** Marti, 8 Iulie 2026
**Hours:** 2h · Evening build session
**Topic:** Designing and building a golden evaluation dataset
**Phase:** Faza 2 — Patterns · Week 8

---

## What You're Doing

Today you build the most important artifact in your eval framework: the golden dataset.

A golden dataset is a curated collection of test cases where you know what a good answer looks like. It's "golden" because it's been carefully designed to be representative — covering the range of inputs your system will see in production, from easy layups to tricky edge cases.

The cardinal rule of golden dataset construction: **write the questions BEFORE looking at your system's output.** If you write questions after seeing what your system produces, you'll unconsciously optimize for its current behavior — which might be wrong. You want the dataset to challenge the system, not confirm it.

You're building 30 items today. That's enough for development and initial comparison. Later, you'd scale to 100+ for production decisions.

## The Work

### Step 1: Define the Schema

Every test case needs structure:

```typescript
// eval/types.ts
interface EvalItem {
  id: string;
  question: string;
  expectedAnswer: string;         // What a good answer should contain
  relevantSources?: string[];     // URLs or references (for faithfulness checks)
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;               // For grouped analysis
  evaluationCriteria: string[];   // What specifically to check
  acceptableAlternatives?: string[]; // Other correct formulations
}

interface EvalDataset {
  name: string;
  description: string;
  version: string;
  createdAt: string;
  items: EvalItem[];
}
```

### Step 2: Design the Category Distribution

Don't just write 30 random questions. Design a balanced distribution:

```markdown
## Dataset Composition (30 items)

### Factual Questions (10 items)
Questions with clear, verifiable answers.
These test basic accuracy and information retrieval.

### Synthesis/Multi-Source (8 items)
Questions that require combining information from multiple sources.
These test the system's ability to integrate and synthesize.

### Unanswerable/Unknowable (5 items)
Questions that SHOULD NOT have definitive answers.
These test whether the system admits uncertainty vs. hallucinating.

### Edge Cases (4 items)
Ambiguous questions, questions with common misconceptions,
questions where popular sources disagree.
These test robustness and nuance.

### Format-Specific (3 items)
Questions that require specific output formats.
These test instruction following.
```

### Step 3: Write the Factual Questions (10 items)

These are your baseline — clear questions with clear answers:

```json
[
  {
    "id": "fact-01",
    "question": "What programming language is TypeScript compiled to?",
    "expectedAnswer": "TypeScript compiles to JavaScript. The TypeScript compiler (tsc) transpiles TypeScript code into JavaScript that can run in any JavaScript environment.",
    "difficulty": "easy",
    "category": "factual",
    "evaluationCriteria": [
      "Must mention JavaScript as the compilation target",
      "Should mention the compiler or transpilation process"
    ]
  },
  {
    "id": "fact-02",
    "question": "What is the difference between REST and GraphQL APIs?",
    "expectedAnswer": "REST uses multiple endpoints with fixed data structures, while GraphQL uses a single endpoint where clients specify exactly what data they need. REST can over-fetch or under-fetch data; GraphQL solves this with precise queries.",
    "difficulty": "medium",
    "category": "factual",
    "evaluationCriteria": [
      "Must mention multiple endpoints vs single endpoint",
      "Must mention data fetching differences (over-fetch/under-fetch)",
      "Should mention query flexibility of GraphQL"
    ]
  },
  {
    "id": "fact-03",
    "question": "What is a WebSocket and how does it differ from HTTP?",
    "expectedAnswer": "WebSocket is a protocol that provides full-duplex communication over a single TCP connection. Unlike HTTP which is request-response, WebSocket maintains a persistent connection allowing both server and client to send data at any time.",
    "difficulty": "medium",
    "category": "factual",
    "evaluationCriteria": [
      "Must mention full-duplex or bidirectional communication",
      "Must contrast with HTTP request-response pattern",
      "Should mention persistent connection"
    ]
  },
  {
    "id": "fact-04",
    "question": "What is the CAP theorem in distributed systems?",
    "expectedAnswer": "The CAP theorem states that a distributed system can only guarantee two of three properties: Consistency (all nodes see the same data), Availability (every request gets a response), and Partition Tolerance (the system works despite network failures). In practice, partition tolerance is required, so you choose between consistency and availability.",
    "difficulty": "medium",
    "category": "factual",
    "evaluationCriteria": [
      "Must name all three properties: Consistency, Availability, Partition Tolerance",
      "Must explain the trade-off (can only have 2 of 3)",
      "Bonus: mention that P is required in practice"
    ]
  },
  {
    "id": "fact-05",
    "question": "What is the event loop in Node.js?",
    "expectedAnswer": "The event loop is Node.js's mechanism for handling asynchronous operations. It continuously checks the call stack and task queues, executing callbacks when the stack is empty. This single-threaded model allows Node.js to handle many concurrent connections without threads.",
    "difficulty": "medium",
    "category": "factual",
    "evaluationCriteria": [
      "Must mention asynchronous handling",
      "Must mention single-threaded nature",
      "Should mention callback/task queue mechanism"
    ]
  }
]
```

Continue writing 5 more factual questions covering: Docker containers vs VMs, JWT tokens, CORS, database indexing, and OAuth 2.0 flows.

### Step 4: Write the Synthesis Questions (8 items)

These require combining information:

```json
[
  {
    "id": "synth-01",
    "question": "Compare Bun, Deno, and Node.js as JavaScript runtimes. What are the key trade-offs for a new project in 2026?",
    "expectedAnswer": "Node.js has the largest ecosystem and most battle-tested in production. Deno offers better security defaults and TypeScript support out of the box. Bun prioritizes speed and includes a bundler/test runner. Trade-offs: Node.js for ecosystem/stability, Deno for security/modern standards, Bun for performance/developer experience.",
    "difficulty": "hard",
    "category": "synthesis",
    "evaluationCriteria": [
      "Must cover all three runtimes",
      "Must mention specific strengths of each",
      "Must discuss trade-offs, not just features",
      "Should give practical guidance for choosing"
    ]
  },
  {
    "id": "synth-02",
    "question": "What are the pros and cons of using an AI agent vs a predefined workflow for a customer support system?",
    "expectedAnswer": "Workflows offer predictability, consistent costs, easier testing, and reliability for known query types. Agents offer flexibility for unexpected queries and can adapt dynamically. A hybrid approach often works best: workflow for common cases (80%), agent fallback for complex cases (20%).",
    "difficulty": "hard",
    "category": "synthesis",
    "evaluationCriteria": [
      "Must cover advantages of both approaches",
      "Must discuss predictability vs flexibility trade-off",
      "Must mention cost and testing implications",
      "Bonus: suggest hybrid approach"
    ]
  }
]
```

Write 6 more synthesis questions covering: RAG vs fine-tuning, monolith vs microservices with AI, vector database comparison, edge computing trade-offs, serverless vs containers, and SQL vs NoSQL for different use cases.

### Step 5: Write the Unanswerable Questions (5 items)

These test whether the system says "I don't know" when it should:

```json
[
  {
    "id": "unanswer-01",
    "question": "Will AI replace all software engineers by 2030?",
    "expectedAnswer": "This is speculative and cannot be answered definitively. A good response acknowledges the uncertainty, presents arguments from both sides, and avoids making definitive predictions.",
    "difficulty": "hard",
    "category": "unanswerable",
    "evaluationCriteria": [
      "Must acknowledge uncertainty",
      "Must NOT make a definitive prediction",
      "Should present multiple perspectives",
      "Bonus: distinguish between tasks that AI can/cannot automate"
    ]
  },
  {
    "id": "unanswer-02",
    "question": "What is the internal architecture of Claude's training infrastructure?",
    "expectedAnswer": "This information is proprietary and not publicly available. A good response acknowledges this limitation rather than speculating or hallucinating details.",
    "difficulty": "medium",
    "category": "unanswerable",
    "evaluationCriteria": [
      "Must acknowledge that this is proprietary/unknown",
      "Must NOT fabricate technical details",
      "May reference what is publicly known (transformer architecture, RLHF)",
      "Must NOT claim certainty about internal details"
    ]
  }
]
```

Write 3 more: a question about future pricing, one about internal company decisions, one about unannounced products.

### Step 6: Write Edge Cases (4 items)

```json
[
  {
    "id": "edge-01",
    "question": "Is JavaScript single-threaded?",
    "expectedAnswer": "JavaScript itself is single-threaded in its execution model, but the runtime environment (Node.js, browsers) uses multiple threads behind the scenes for I/O operations, Web Workers allow parallel execution, and SharedArrayBuffer enables shared memory. The answer is nuanced: the main execution thread is single, but the ecosystem supports concurrency.",
    "difficulty": "hard",
    "category": "edge_case",
    "evaluationCriteria": [
      "Must acknowledge the nuance (not just yes/no)",
      "Must mention single-threaded execution model",
      "Must mention multi-threaded capabilities (Workers, libuv, etc.)",
      "Should avoid an oversimplified answer"
    ]
  }
]
```

### Step 7: Write Format-Specific Cases (3 items)

```json
[
  {
    "id": "format-01",
    "question": "List the SOLID principles. For each, give: the name, a one-sentence explanation, and a code smell that violates it. Format as a numbered list.",
    "expectedAnswer": "1. Single Responsibility... 2. Open/Closed... 3. Liskov Substitution... 4. Interface Segregation... 5. Dependency Inversion...",
    "difficulty": "medium",
    "category": "format",
    "evaluationCriteria": [
      "Must list all 5 principles",
      "Must use numbered list format",
      "Each item must have: name, explanation, code smell",
      "Must be properly formatted (not a wall of text)"
    ]
  }
]
```

### Step 8: Assemble and Save

```typescript
// eval/buildDataset.ts
import * as fs from 'fs/promises';

const dataset: EvalDataset = {
  name: 'AI Engineering Knowledge Eval v1',
  description: 'Golden dataset for evaluating AI systems on software engineering and AI topics',
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  items: [
    // ... all 30 items from above
  ],
};

// Validate before saving
const categories = dataset.items.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('Dataset composition:');
Object.entries(categories).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count} items`);
});
console.log(`  Total: ${dataset.items.length} items`);

await fs.writeFile(
  'eval/dataset.json',
  JSON.stringify(dataset, null, 2)
);

console.log('Dataset saved to eval/dataset.json');
```

## Key Insight

The hardest part of building a golden dataset is resisting the temptation to test what your system is already good at. Your ego wants a dataset that produces high scores. Your eval needs a dataset that finds weaknesses. Include questions you suspect the system will struggle with — unanswerable questions, nuanced topics, format requirements. A dataset that scores 5/5 across the board isn't a good dataset; it's a wasted opportunity to find problems before your users do.

## Resources

- [Anthropic — Develop Tests](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests)
- [Hamel Husain — Creating a LLM-as-Judge Eval](https://hamel.dev/blog/posts/llm-judge/)
- [OpenAI Evals Framework](https://github.com/openai/evals)

## Done When

- [ ] You have 30 eval items in `eval/dataset.json`
- [ ] Distribution: ~10 factual, ~8 synthesis, ~5 unanswerable, ~4 edge cases, ~3 format
- [ ] Each item has: id, question, expectedAnswer, difficulty, category, evaluationCriteria
- [ ] Questions were written BEFORE testing them against your system
- [ ] The dataset includes items you expect the system to struggle with
- [ ] You can load and iterate over the dataset programmatically

---

*Tomorrow: LLM-as-Judge. You'll use Claude to automatically score answers against your golden dataset. Automated evaluation at scale.*
