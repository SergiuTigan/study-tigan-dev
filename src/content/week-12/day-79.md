# Day 79 -- LangGraph: Graph-Shaped Agent Workflows

> *"Your ReAct agent was a loop. LangGraph agents are a graph. Loops are linear. Graphs can branch, merge, run in parallel, and loop back conditionally."*

**Date:** Marti, 5 August 2025
**Hours:** 2h · Evening session
**Topic:** LangGraph Fundamentals -- StateGraph, Nodes, Edges
**Phase:** Faza 3 -- Production · Week 12

---

## What You're Doing

Today you learn LangGraph, and this is the part of the LangChain ecosystem that genuinely solves a hard problem. Your Week 5-6 ReAct agent was a while loop: think, act, observe, repeat. That works for simple agents. But what if you need an agent that researches in parallel, then merges findings, then branches based on quality, then loops back to revise if the output is not good enough?

A while loop cannot express that easily. A graph can.

LangGraph lets you define agent workflows as directed graphs. Nodes are functions (LLM calls, tool executions, transformations). Edges connect nodes. Conditional edges enable dynamic routing. The graph has shared state that flows through every node. This is the architecture that powers complex agent systems in production.

## The Work

### The Core Concepts

```
State → [Node A] → [Node B] → [Conditional Edge] → [Node C] or [Node D]
                                      ↑                        |
                                      |                        |
                                      +────── loop back ───────+
```

**StateGraph:** The graph definition. You define the state shape, add nodes, add edges, compile it.

**State (Annotation):** A TypeScript type that defines what data flows through the graph. Every node reads from and writes to this state.

**Nodes:** Functions that take state and return partial state updates. Can be LLM calls, tool executions, data transformations, or anything async.

**Edges:** Connections between nodes. Can be static (always go A -> B) or conditional (go A -> B if condition, else A -> C).

**START / END:** Special nodes marking where the graph begins and ends.

### Installation

```bash
npm install @langchain/langgraph @langchain/anthropic @langchain/core
```

### Your First Graph

Let's build a simple graph that classifies a query, then routes it to different handler nodes:

```typescript
import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { ChatAnthropic } from '@langchain/anthropic';

// 1. Define the state
const GraphState = Annotation.Root({
  input: Annotation<string>(),
  classification: Annotation<string>(),
  response: Annotation<string>(),
});

// 2. Create nodes (functions that transform state)
const model = new ChatAnthropic({ modelName: 'claude-haiku-4-20250514' });

async function classify(state: typeof GraphState.State) {
  const response = await model.invoke([
    {
      role: 'system',
      content: 'Classify the input as "question", "task", or "conversation". Respond with one word only.',
    },
    { role: 'user', content: state.input },
  ]);

  return { classification: response.content.toString().trim().toLowerCase() };
}

async function handleQuestion(state: typeof GraphState.State) {
  const response = await model.invoke([
    { role: 'system', content: 'Answer the question concisely.' },
    { role: 'user', content: state.input },
  ]);
  return { response: response.content.toString() };
}

async function handleTask(state: typeof GraphState.State) {
  const response = await model.invoke([
    { role: 'system', content: 'Break the task into steps and execute.' },
    { role: 'user', content: state.input },
  ]);
  return { response: response.content.toString() };
}

async function handleConversation(state: typeof GraphState.State) {
  const response = await model.invoke([
    { role: 'system', content: 'Respond conversationally and warmly.' },
    { role: 'user', content: state.input },
  ]);
  return { response: response.content.toString() };
}

// 3. Build the graph
const graph = new StateGraph(GraphState)
  // Add nodes
  .addNode('classify', classify)
  .addNode('handle_question', handleQuestion)
  .addNode('handle_task', handleTask)
  .addNode('handle_conversation', handleConversation)
  // Add edges
  .addEdge(START, 'classify')
  .addConditionalEdges('classify', (state) => {
    // Dynamic routing based on classification
    switch (state.classification) {
      case 'question': return 'handle_question';
      case 'task': return 'handle_task';
      default: return 'handle_conversation';
    }
  })
  .addEdge('handle_question', END)
  .addEdge('handle_task', END)
  .addEdge('handle_conversation', END);

// 4. Compile and run
const app = graph.compile();

const result = await app.invoke({
  input: 'What is the capital of France?',
});

console.log(result.classification); // 'question'
console.log(result.response);       // 'The capital of France is Paris.'
```

### State with Reducers (Accumulating Data)

The real power comes from state annotations with reducers. A reducer defines how multiple updates to the same field are combined:

```typescript
const AgentState = Annotation.Root({
  // Replace: each update overwrites (default)
  currentStep: Annotation<string>(),

  // Accumulate: each update appends to the array
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Accumulate findings
  findings: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Track iteration count
  iterations: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
});
```

### A Graph with Cycles (Loops)

This is what makes LangGraph special -- cycles. Your graph can loop back:

```typescript
const ReviewState = Annotation.Root({
  draft: Annotation<string>(),
  feedback: Annotation<string>(),
  score: Annotation<number>(),
  iterations: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
});

async function writeDraft(state: typeof ReviewState.State) {
  const prompt = state.feedback
    ? `Revise based on feedback: ${state.feedback}\n\nOriginal: ${state.draft}`
    : `Write a short article about AI engineering.`;

  const response = await model.invoke([{ role: 'user', content: prompt }]);
  return {
    draft: response.content.toString(),
    iterations: 1,
  };
}

async function reviewDraft(state: typeof ReviewState.State) {
  const response = await model.invoke([
    {
      role: 'system',
      content: 'Review the article. Provide a score 1-10 and feedback. Format: SCORE: N\nFEEDBACK: ...',
    },
    { role: 'user', content: state.draft },
  ]);

  const text = response.content.toString();
  const scoreMatch = text.match(/SCORE:\s*(\d+)/);
  const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]*)/);

  return {
    score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
    feedback: feedbackMatch ? feedbackMatch[1].trim() : 'No specific feedback.',
  };
}

// Build graph with a cycle
const reviewGraph = new StateGraph(ReviewState)
  .addNode('write', writeDraft)
  .addNode('review', reviewDraft)
  .addEdge(START, 'write')
  .addEdge('write', 'review')
  .addConditionalEdges('review', (state) => {
    // If score is good enough OR we've iterated too many times, stop
    if (state.score >= 8 || state.iterations >= 3) {
      return END;
    }
    // Otherwise, loop back to write
    return 'write';
  })
  .compile();

const result = await reviewGraph.invoke({});
console.log(`Final draft (after ${result.iterations} iterations, score: ${result.score}):`);
console.log(result.draft);
```

This write->review->maybe-revise loop is the pattern you will use tomorrow for the content creator agent.

### Visualizing the Graph

LangGraph can output a Mermaid diagram of your graph:

```typescript
// Get graph visualization
const mermaid = app.getGraph().drawMermaidPng();
// Or as text
const mermaidText = app.getGraph().toJSON();
```

### Why Graphs Beat Loops

| Feature | While Loop (your ReAct) | LangGraph |
|---------|------------------------|-----------|
| Linear flow | Easy | Easy |
| Branching | Manual if/else | addConditionalEdges |
| Parallel execution | Manual Promise.all | Built-in parallel nodes |
| State management | Manual variables | Typed state with reducers |
| Persistence | Manual save/load | Built-in checkpointing |
| Visualization | None | Mermaid diagrams |
| Error recovery | Manual try/catch | Resume from checkpoint |
| Cycle limits | Manual counter | Built-in recursion limits |

## Key Insight

LangGraph is not just LangChain with graphs. It is a fundamentally different way to think about agent architecture. Instead of writing imperative code that says "do this, then do that, then maybe do this again," you declare a graph that says "these are the possible steps, these are the connections, these are the conditions for routing." The graph is both the execution engine and the documentation. Anyone looking at your graph definition immediately understands the workflow. That clarity is worth the abstraction.

## Resources

- [LangGraph.js Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangGraph Concepts](https://langchain-ai.github.io/langgraphjs/concepts/)
- [LangGraph Tutorials](https://langchain-ai.github.io/langgraphjs/tutorials/)
- [StateGraph Reference](https://langchain-ai.github.io/langgraphjs/reference/classes/langgraph.StateGraph.html)

## Done When

- [ ] You installed LangGraph and ran a basic graph
- [ ] You understand StateGraph, nodes, edges, and conditional edges
- [ ] You built a graph with conditional routing (classify -> route)
- [ ] You built a graph with a cycle (write -> review -> maybe revise)
- [ ] You understand state annotations with reducers
- [ ] You can explain why graphs are better than loops for complex agent workflows
- [ ] You can visualize your graph's structure

---

*Tomorrow: Reimplement your RAG system using LangChain. Side-by-side comparison. Honest evaluation.*
