# Day 49 — Polish MCP Server + Document + Ship

> *"Code that works is a prototype. Code that's documented, validated, and handles errors is a product."*

**Date:** Duminica, 6 Iulie 2026
**Hours:** 5h · Full build day
**Topic:** Polishing MCP server, comprehensive documentation, orchestrator demo, ship to GitHub
**Phase:** Faza 2 — Patterns · Week 7

---

## What You're Doing

Your final build day for Week 7. You have a working MCP server from Day 45 and orchestration patterns from Days 46-48. Today you transform these from "it works on my machine" into "anyone can use this."

Five focused hours. Polishing, documenting, demonstrating, and shipping. This is the work that makes portfolios impressive — not because the code is more complex, but because it's more complete.

## The Work

### Hour 1-2: Polish the MCP Server

**Comprehensive Error Handling:**

Every tool should handle every failure mode gracefully:

```typescript
// src/utils/errors.ts
export class ToolError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

export function formatToolError(error: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  if (error instanceof ToolError) {
    return {
      content: [{
        type: 'text' as const,
        text: `Error [${error.code}]: ${error.message}${
          error.recoverable ? '\n(This error may be resolved by trying again or adjusting your input.)' : ''
        }`,
      }],
      isError: true,
    };
  }

  // Unknown errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  console.error('Unexpected error in tool:', error); // Log to stderr for debugging
  return {
    content: [{ type: 'text' as const, text: `Error: ${message}` }],
    isError: true,
  };
}
```

Apply to every tool:

```typescript
server.tool(
  'add_task',
  'Add a new task to the task manager',
  {
    title: z.string().min(1).max(200).describe('Task title'),
    description: z.string().max(2000).optional().describe('Detailed description'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
    tags: z.array(z.string().max(50)).max(10).default([]),
  },
  async (args) => {
    try {
      // Validate due date is in the future
      if (args.dueDate) {
        const dueDate = new Date(args.dueDate);
        if (isNaN(dueDate.getTime())) {
          throw new ToolError('Invalid date format', 'INVALID_DATE');
        }
      }

      const task = store.add({
        title: args.title,
        description: args.description,
        priority: args.priority,
        dueDate: args.dueDate,
        tags: args.tags,
        status: 'todo',
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Task created successfully.\n  ID: ${task.id}\n  Title: ${task.title}\n  Priority: ${task.priority}\n  Due: ${task.dueDate || 'not set'}\n  Tags: ${task.tags.length > 0 ? task.tags.join(', ') : 'none'}`,
        }],
      };
    } catch (error) {
      return formatToolError(error);
    }
  }
);
```

**Zod Validation Improvements:**

Make schemas more precise with custom error messages:

```typescript
const taskIdSchema = z.string()
  .min(1, 'Task ID cannot be empty')
  .describe('The 8-character task ID (e.g., "a1b2c3d4")');

const prioritySchema = z.enum(['low', 'medium', 'high', 'critical'])
  .describe('Priority level: low, medium, high, or critical');

const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .describe('Date in ISO format (YYYY-MM-DD)');
```

**Proper Logging to stderr:**

```typescript
// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

export function log(level: LogLevel, message: string, data?: unknown): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  // ALWAYS use stderr — stdout is for JSON-RPC only
  if (data) {
    console.error(`${prefix} ${message}`, data);
  } else {
    console.error(`${prefix} ${message}`);
  }
}
```

### Hour 3: Documentation

**README.md:**

```markdown
# Task Manager MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with
task management capabilities. Connect to Claude Desktop, Cursor, or any
MCP-compatible client.

## Features

- **4 Tools**: Add, list, update, and complete tasks
- **2 Resources**: Today's tasks dashboard, task statistics
- **Smart Validation**: Zod-powered input validation with clear error messages
- **Priority System**: low / medium / high / critical with sorted output
- **Tag Support**: Categorize and filter tasks by tags

## Quick Start

### Prerequisites
- Node.js 18+
- Claude Desktop (or any MCP client)

### Installation

    git clone <your-repo-url>
    cd mcp-task-manager
    npm install

### Connect to Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

    {
      "mcpServers": {
        "task-manager": {
          "command": "npx",
          "args": ["tsx", "/absolute/path/to/src/server.ts"]
        }
      }
    }

Restart Claude Desktop. You'll see the tools icon indicating the server is connected.

### Usage Examples

Ask Claude naturally:

    "Add a high priority task: Deploy the new API by Friday"
    "What tasks do I have?"
    "Show me overdue tasks"
    "Mark task a1b2c3d4 as done"
    "What are my stats?"

## Tools Reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `add_task` | Create a new task | title, description?, priority?, dueDate?, tags? |
| `list_tasks` | List tasks with filters | status?, priority?, tag? |
| `complete_task` | Mark task as done | taskId |
| `update_task` | Update task fields | taskId, priority?, status?, title? |

## Resources

| URI | Description |
|-----|-------------|
| `tasks://today` | Today's tasks and overdue items |
| `tasks://stats` | Task count by status |

## Architecture

    Claude Desktop ←→ MCP Client ←→ [stdio] ←→ MCP Server ←→ TaskStore

## Development

    npm run dev        # Run with hot reload
    npm run typecheck  # Check types
    LOG_LEVEL=debug npx tsx src/server.ts  # Debug logging
```

### Hour 4: Add Orchestrator/Subagent Demo Module

Create a standalone demo that showcases the orchestration patterns:

```typescript
// src/demo/orchestrator-demo.ts

/**
 * Demonstrates three multi-agent patterns:
 * 1. Orchestrator-Worker: Parallel content generation
 * 2. Subagent Delegation: Autonomous research + writing
 * 3. Evaluator-Optimizer: Generate, evaluate, refine
 *
 * Run: npx tsx src/demo/orchestrator-demo.ts
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Pattern 1: Orchestrator-Worker (from Day 46)
async function demoOrchestratorWorker(): Promise<void> {
  console.log('\n=== Demo: Orchestrator-Worker ===\n');
  console.log('A manager LLM breaks a task into subtasks,');
  console.log('workers execute in parallel, manager synthesizes.\n');

  // ... (simplified version of Day 46 code)
}

// Pattern 2: Subagent (from Day 48)
async function demoSubagent(): Promise<void> {
  console.log('\n=== Demo: Subagent Delegation ===\n');
  console.log('A parent agent spawns autonomous child agents');
  console.log('with isolated contexts and focused tools.\n');

  // ... (simplified version of Day 48 code)
}

// Pattern 3: Evaluator-Optimizer
async function demoEvaluatorOptimizer(): Promise<void> {
  console.log('\n=== Demo: Evaluator-Optimizer ===\n');
  console.log('A generator produces output, an evaluator scores it,');
  console.log('the generator refines until the evaluator approves.\n');

  let attempt = 0;
  let approved = false;
  let content = '';

  while (!approved && attempt < 3) {
    attempt++;

    // Generate
    const genResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: attempt === 1
          ? 'Write a one-paragraph explanation of MCP (Model Context Protocol).'
          : `Improve this explanation based on the feedback:\n${content}\n\nFeedback: Needs more concrete examples.`,
      }],
    });
    content = genResponse.content[0].type === 'text' ? genResponse.content[0].text : '';

    // Evaluate
    const evalResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Score this explanation 1-5 on clarity and usefulness.
Output JSON: {"score": N, "feedback": "..."}

Text: ${content}`,
      }],
    });
    const evalText = evalResponse.content[0].type === 'text' ? evalResponse.content[0].text : '{}';

    console.log(`  Attempt ${attempt}: ${evalText.substring(0, 100)}...`);

    if (evalText.includes('"score": 4') || evalText.includes('"score": 5')) {
      approved = true;
    }
  }

  console.log(`\nFinal (after ${attempt} attempts):\n${content}`);
}

// Run all demos
async function main(): Promise<void> {
  const demo = process.argv[2] || 'all';

  switch (demo) {
    case 'orchestrator': await demoOrchestratorWorker(); break;
    case 'subagent': await demoSubagent(); break;
    case 'evaluator': await demoEvaluatorOptimizer(); break;
    case 'all':
      await demoOrchestratorWorker();
      await demoSubagent();
      await demoEvaluatorOptimizer();
      break;
    default:
      console.log('Usage: npx tsx src/demo/orchestrator-demo.ts [orchestrator|subagent|evaluator|all]');
  }
}

main().catch(console.error);
```

### Hour 5: Ship It

```bash
# Pre-flight checks
npx tsc --noEmit          # TypeScript clean
npm run lint 2>/dev/null   # Lint (if configured)

# Create .env.example
echo "ANTHROPIC_API_KEY=your-key-here" > .env.example

# Ensure .gitignore is complete
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
data/
*.log
EOF

# Commit and push
git add -A
git commit -m "feat: MCP task manager server with orchestration demos"
git push origin main
```

Final verification:
- Clone the repo to a different directory
- Follow the README to set up
- Connect to Claude Desktop
- Test the tools work

## Key Insight

Documentation is not a chore — it's a design tool. When you write the README, you're forced to think about your project from the user's perspective. "How do they install it?" "What's the first thing they should try?" "What will confuse them?" Every unclear README reflects an unclear design decision. The projects that get stars on GitHub aren't the most clever — they're the most approachable.

## Resources

- [MCP Server Best Practices](https://modelcontextprotocol.io/docs/concepts/tools)
- [How to Write a Good README](https://www.makeareadme.com/)
- [Zod Documentation](https://zod.dev/)
- [TypeScript MCP SDK Reference](https://github.com/modelcontextprotocol/typescript-sdk)

## Done When

- [ ] All tools have comprehensive error handling with `ToolError`
- [ ] Zod schemas have min/max constraints and descriptive error messages
- [ ] Logging goes to stderr only, with configurable log levels
- [ ] README includes: quick start, usage examples, tools reference, architecture
- [ ] Orchestrator demo module runs independently
- [ ] .env.example exists (no actual keys committed)
- [ ] .gitignore covers node_modules, dist, .env, data
- [ ] Code is pushed to GitHub
- [ ] You can clone the repo fresh and get it running in 5 minutes

---

*Next week: Evaluations. You'll build a framework to systematically test your AI systems — golden datasets, LLM-as-judge scoring, multi-model comparison, and A/B testing. The final week of Faza 2.*
