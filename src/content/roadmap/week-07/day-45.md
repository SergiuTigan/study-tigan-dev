---
title: "Day 45 — Build Real MCP Server: Dobby API"
week: 7
day: 45
phase: 2
phaseLabel: "Deep Dive"
order: 745
type: "day"
---
# Day 45 — Build Real MCP Server: Dobby API

> *"The gap between 'hello world' and 'production' is where most developers give up. Don't be most developers."*

**Date:** Miercuri, 2 Iulie 2026
**Hours:** 2h · Evening build session
**Topic:** Building an MCP server that wraps a real API with tools and resources
**Phase:** Faza 2 — Patterns · Week 7

---

## What You're Doing

Yesterday you built an MCP server with toy tools. Today you build one with real tools.

The target: wrap an actual API as an MCP server. If you have your Dobby assistant API ready from earlier work, use that. If not, build a general-purpose task manager API wrapper, or wrap any API you find interesting — GitHub, a weather service, a note-taking app, or your RAG system from Week 4.

The point is to cross the gap from "I can build an MCP server" to "I can expose any service to AI clients." This is a genuine, marketable skill. Companies need engineers who can make their internal systems accessible to AI tools.

Today you'll also learn about MCP **resources** — read-only data that the model can pull in, like today's schedule or a configuration file.

## The Work

### Step 1: Choose Your API (10 min)

Pick one of these options:

```markdown
Option A: Dobby API (if you have it)
- Tools: get_schedule, add_task, complete_task, get_reminders
- Resources: schedule://today, tasks://pending

Option B: GitHub Wrapper
- Tools: list_repos, search_code, create_issue, get_pull_requests
- Resources: repos://recent, notifications://unread

Option C: Task Manager (build from scratch)
- Tools: add_task, list_tasks, complete_task, set_priority
- Resources: tasks://today, tasks://overdue

Option D: Your RAG System
- Tools: search_documents, ask_question, add_document
- Resources: documents://recent, stats://usage
```

I'll use **Option C (Task Manager)** as the example since it doesn't require external dependencies. Adapt the pattern to whatever API you choose.

### Step 2: Data Layer (15 min)

Create a simple in-memory store (you'd replace this with a database in production):

```typescript
// src/store.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: string;
  createdAt: string;
  tags: string[];
}

class TaskStore {
  private tasks: Map<string, Task> = new Map();

  add(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const id = crypto.randomUUID().slice(0, 8);
    const fullTask: Task = {
      ...task,
      id,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(id, fullTask);
    return fullTask;
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  list(filter?: {
    status?: Task['status'];
    priority?: Task['priority'];
    tag?: string;
  }): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (filter?.status) tasks = tasks.filter(t => t.status === filter.status);
    if (filter?.priority) tasks = tasks.filter(t => t.priority === filter.priority);
    if (filter?.tag) tasks = tasks.filter(t => t.tags.includes(filter.tag));

    return tasks.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  update(id: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(id);
    if (!task) return null;
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  complete(id: string): Task | null {
    return this.update(id, { status: 'done' });
  }

  getOverdue(): Task[] {
    const now = new Date().toISOString();
    return this.list().filter(
      t => t.dueDate && t.dueDate < now && t.status !== 'done'
    );
  }

  getStats(): { total: number; todo: number; inProgress: number; done: number } {
    const all = Array.from(this.tasks.values());
    return {
      total: all.length,
      todo: all.filter(t => t.status === 'todo').length,
      inProgress: all.filter(t => t.status === 'in_progress').length,
      done: all.filter(t => t.status === 'done').length,
    };
  }
}

export const store = new TaskStore();
```

### Step 3: MCP Tools (30 min)

Now expose the store as MCP tools:

```typescript
// src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { store } from './store.js';

const server = new McpServer({
  name: 'task-manager',
  version: '1.0.0',
});

// Tool 1: Add a task
server.tool(
  'add_task',
  'Add a new task to the task manager',
  {
    title: z.string().describe('Task title'),
    description: z.string().optional().describe('Detailed description'),
    priority: z.enum(['low', 'medium', 'high', 'critical'])
      .default('medium')
      .describe('Task priority level'),
    dueDate: z.string().optional().describe('Due date in ISO format (YYYY-MM-DD)'),
    tags: z.array(z.string()).default([]).describe('Tags for categorization'),
  },
  async ({ title, description, priority, dueDate, tags }) => {
    const task = store.add({
      title,
      description,
      priority,
      dueDate,
      tags,
      status: 'todo',
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Task created:\n  ID: ${task.id}\n  Title: ${task.title}\n  Priority: ${task.priority}\n  Status: ${task.status}`,
      }],
    };
  }
);

// Tool 2: List tasks
server.tool(
  'list_tasks',
  'List tasks with optional filtering by status, priority, or tag',
  {
    status: z.enum(['todo', 'in_progress', 'done']).optional().describe('Filter by status'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Filter by priority'),
    tag: z.string().optional().describe('Filter by tag'),
  },
  async ({ status, priority, tag }) => {
    const tasks = store.list({ status, priority, tag });

    if (tasks.length === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No tasks found matching the filters.' }],
      };
    }

    const formatted = tasks.map(t =>
      `[${t.id}] ${t.priority.toUpperCase()} | ${t.status} | ${t.title}${t.dueDate ? ` (due: ${t.dueDate})` : ''}`
    ).join('\n');

    return {
      content: [{ type: 'text' as const, text: `Tasks (${tasks.length}):\n${formatted}` }],
    };
  }
);

// Tool 3: Complete a task
server.tool(
  'complete_task',
  'Mark a task as completed',
  {
    taskId: z.string().describe('The ID of the task to complete'),
  },
  async ({ taskId }) => {
    const task = store.complete(taskId);

    if (!task) {
      return {
        content: [{ type: 'text' as const, text: `Error: Task "${taskId}" not found.` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text' as const, text: `Task "${task.title}" marked as done!` }],
    };
  }
);

// Tool 4: Update task priority or status
server.tool(
  'update_task',
  'Update a task\'s priority, status, or other fields',
  {
    taskId: z.string().describe('The ID of the task to update'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('New priority'),
    status: z.enum(['todo', 'in_progress', 'done']).optional().describe('New status'),
    title: z.string().optional().describe('New title'),
  },
  async ({ taskId, ...updates }) => {
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const task = store.update(taskId, cleanUpdates);

    if (!task) {
      return {
        content: [{ type: 'text' as const, text: `Error: Task "${taskId}" not found.` }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Task "${task.title}" updated. Priority: ${task.priority}, Status: ${task.status}`,
      }],
    };
  }
);
```

### Step 4: MCP Resources (20 min)

Resources are read-only data endpoints. They're perfect for dashboards and summaries:

```typescript
// Add to src/server.ts

// Resource 1: Today's tasks
server.resource(
  'tasks-today',              // Resource identifier
  'tasks://today',            // URI
  {
    name: 'Today\'s Tasks',
    description: 'All tasks due today or overdue',
    mimeType: 'text/plain',
  },
  async () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = store.list().filter(
      t => t.status !== 'done' && (!t.dueDate || t.dueDate <= today)
    );

    const text = tasks.length === 0
      ? 'No tasks due today. You\'re all caught up!'
      : tasks.map(t =>
          `[${t.priority.toUpperCase()}] ${t.title}${t.dueDate ? ` (due: ${t.dueDate})` : ''}`
        ).join('\n');

    return {
      contents: [{
        uri: 'tasks://today',
        text: `Today's Tasks (${tasks.length}):\n\n${text}`,
        mimeType: 'text/plain',
      }],
    };
  }
);

// Resource 2: Task statistics
server.resource(
  'tasks-stats',
  'tasks://stats',
  {
    name: 'Task Statistics',
    description: 'Overview of task counts by status',
    mimeType: 'application/json',
  },
  async () => {
    const stats = store.getStats();

    return {
      contents: [{
        uri: 'tasks://stats',
        text: JSON.stringify(stats, null, 2),
        mimeType: 'application/json',
      }],
    };
  }
);
```

### Step 5: Start the Server (5 min)

```typescript
// Add at the end of src/server.ts

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Task Manager MCP server running');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### Step 6: Connect and Test (20 min)

Update Claude Desktop config:
```json
{
  "mcpServers": {
    "task-manager": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mcp-task-manager/src/server.ts"]
    }
  }
}
```

Restart Claude Desktop and test with natural conversation:

```
"Add a task: Write the MCP documentation, high priority, due July 5th, tag it with 'docs'"
"What tasks do I have?"
"Add three more tasks for this week"
"Show me just the high priority tasks"
"Complete the documentation task"
"What are my task stats?"
```

Watch how Claude naturally discovers and uses your tools based on the conversation.

## Key Insight

The difference between a tool and a resource is the difference between a function and a file. Tools *do things* — they take parameters and produce side effects. Resources *provide information* — they're read-only snapshots of data. In practice, you'll expose actions as tools (add_task, complete_task) and dashboards as resources (tasks://today, tasks://stats). Claude Desktop shows resources in the attachment menu, giving users a way to pull in context before asking questions.

## Resources

- [MCP Resources Documentation](https://modelcontextprotocol.io/docs/concepts/resources)
- [MCP Tools Documentation](https://modelcontextprotocol.io/docs/concepts/tools)
- [MCP Server Quickstart](https://modelcontextprotocol.io/quickstart/server)
- [Example MCP Servers — GitHub](https://github.com/modelcontextprotocol/servers)

## Done When

- [ ] Your MCP server wraps a real data layer (task store or other API)
- [ ] You've exposed at least 4 tools with proper Zod validation
- [ ] You've exposed at least 2 resources with appropriate MIME types
- [ ] Error cases return `isError: true` with helpful messages
- [ ] Claude Desktop connects and discovers all tools
- [ ] You've tested a full workflow through Claude Desktop (create, list, update, complete)
- [ ] Resources show up and can be read by the client

---

*Tomorrow: Orchestrator-Worker pattern. One LLM plans, many LLMs execute. You'll build a system where a manager delegates to specialized workers.*
