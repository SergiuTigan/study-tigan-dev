# Day 36 — Agent Theory

> *"The most effective agents are not the most autonomous — they are the ones with the best-defined boundaries."*

**Date:** Luni, 23 Iunie 2026
**Hours:** 2h · Evening deep study
**Topic:** Agent fundamentals, the Anthropic paper, agent vs workflow taxonomy
**Phase:** Faza 2 — Patterns · Week 6

---

## What You're Doing

Today is a reading day, and it might be the most important reading day in the entire roadmap. You are going to internalize a paper that will save you hundreds of hours of wasted effort: Anthropic's "Building Effective Agents."

The AI industry has a bad habit. Every demo shows autonomous agents doing magical things — browsing the web, writing code, deploying apps. What the demos don't show is the 47 failed runs before the successful one, the $200 API bill from a loop that wouldn't stop, or the hallucinated tool call that deleted production data.

The paper's central insight is deceptively simple: **most tasks don't need agents.** A well-designed workflow — with predetermined steps and clear handoffs — will outperform an agent on any task where you can define the steps in advance. Agents should be reserved for truly open-ended problems where the solution path is unknown.

This isn't a limitation. It's a superpower. Knowing *when not to build an agent* is what separates a productive AI engineer from someone chasing demos.

## The Work

### Step 1: Read the Paper (45 min)

Read the full paper carefully:
**https://www.anthropic.com/research/building-effective-agents**

Don't skim. Take notes. This paper introduces vocabulary you'll use for the rest of your career.

### Step 2: The Agent vs Workflow Distinction

Create a file `notes/agents-vs-workflows.md` and write out this core distinction in your own words:

```
WORKFLOW
- Steps are predetermined by the developer
- LLM fills in content at each step
- Predictable execution path
- Easy to test and debug
- Example: "Generate outline → Write sections → Create title → Format"

AGENT
- LLM decides the next action dynamically
- Developer provides tools and goals, not steps
- Unpredictable execution path
- Hard to test, prone to loops and failures
- Example: "Research this topic and produce a brief"
```

The key question to ask: **"Can I write down the steps in advance?"** If yes, use a workflow. If no, you might need an agent.

### Step 3: The Five Patterns

The paper describes five building blocks, arranged from simple to complex. Summarize each:

**1. Prompt Chaining**
```
Input → LLM Call 1 → Gate/Check → LLM Call 2 → Output

Example: Generate code → Check for errors → Fix errors → Output
Each step is predetermined. The "gate" between steps can include
programmatic validation.
```

**2. Routing**
```
Input → Classifier → Route A (specialized prompt)
                   → Route B (specialized prompt)
                   → Route C (specialized prompt)

Example: Customer query → Classify intent → Route to billing/technical/general
The LLM decides WHERE, but each route is a predetermined workflow.
```

**3. Parallelization**
```
Input → [LLM Call A] + [LLM Call B] + [LLM Call C] → Aggregate

Two flavors:
- Sectioning: Split task into independent subtasks
- Voting: Same task multiple times, aggregate results

Example: Evaluate code for [security] + [performance] + [style] → Merge
```

**4. Orchestrator-Worker**
```
Input → Orchestrator LLM → [Worker 1] + [Worker 2] + [Worker N] → Synthesis

Unlike parallelization, the orchestrator DYNAMICALLY decides
what workers to spawn and what they should do.

Example: "Refactor this codebase" → Orchestrator identifies files →
Workers refactor each → Orchestrator merges
```

**5. Evaluator-Optimizer**
```
Generator LLM → Output → Evaluator LLM → Feedback → Generator → ...

Loop until evaluator approves.

Example: Generate translation → Evaluate accuracy → Refine → Re-evaluate
```

### Step 4: When Agents Fail

Create a "failure modes" checklist. Agents fail when:

```markdown
## Agent Failure Modes

1. **Too many tools** — Agent gets confused choosing between 20+ tools.
   Fix: Group tools, use routing to narrow options.

2. **Vague instructions** — "Do something useful" leads to chaos.
   Fix: Specific goals with clear success criteria.

3. **No stopping condition** — Agent loops forever trying to "improve."
   Fix: Max steps, time limits, "good enough" criteria.

4. **No error recovery** — First tool failure crashes the whole run.
   Fix: Try/catch every tool, feed errors back as observations.

5. **Context window overflow** — Long histories exceed token limits.
   Fix: Summarize history, keep only recent steps in full.

6. **Cost explosion** — Each step costs tokens. 50 steps × Opus = $$$
   Fix: Use cheaper models for simple steps, set budget limits.

7. **Hallucinated tool calls** — Agent invents tools that don't exist.
   Fix: Strong system prompts, validate tool names before execution.
```

### Step 5: Decision Framework

Build your personal decision tree:

```
Should I build an agent?

1. Can I write down all the steps? → YES → Use a WORKFLOW
2. Are the steps mostly known with 1-2 variable parts? → Use a WORKFLOW with one agent step
3. Is the search space truly open-ended? → Consider an AGENT
4. Can I constrain the agent to <10 steps? → Build the AGENT
5. Will it need 50+ steps? → Rethink the problem. Break into sub-workflows.
```

## Key Insight

The most important sentence in the entire paper: **"Use the simplest solution that works."** Prompt chaining solves 80% of problems. Routing handles most of the rest. True autonomous agents are for the remaining edge cases. Building an agent when a workflow suffices is not impressive engineering — it's unnecessary complexity that will haunt you in production.

## Resources

- [Building Effective Agents — Anthropic](https://www.anthropic.com/research/building-effective-agents)
- [AI Agents in Production — Lessons Learned](https://www.anthropic.com/engineering)
- [LangChain Agent Concepts](https://python.langchain.com/docs/concepts/agents/) (for vocabulary, not necessarily the framework)

## Done When

- [ ] You've read the full Anthropic paper, not skimmed it
- [ ] You can explain the difference between agents and workflows without looking at notes
- [ ] You can name and describe all 5 building block patterns
- [ ] You have a written list of agent failure modes
- [ ] You have a personal decision framework for "agent vs workflow"
- [ ] You could explain to a colleague why "agents for everything" is a bad idea

---

*Tomorrow: You build the most common agent pattern — ReAct. A loop where the LLM thinks, acts, observes, and decides what to do next.*
