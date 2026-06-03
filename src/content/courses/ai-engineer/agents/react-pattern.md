---
title: "ReAct Pattern"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "agents"
moduleTitle: "Agents & Tool Use"
moduleDescription: "Build AI agents that reason, plan, and take actions using tools."
lessonId: "ai-engineer/agents/react-pattern"
duration: "12 min"
order: 501
moduleOrder: 5
lessonOrder: 1
color: "purple"
---
# ReAct Pattern

ReAct (Reason + Act) is the foundational pattern for AI agents. The model reasons about what to do, takes an action, observes the result, and repeats until the task is complete.

## The Loop

```
User Query
    ↓
[Think] What do I need to do?
    ↓
[Act] Call a tool or function
    ↓
[Observe] Read the result
    ↓
[Think] Do I have enough information?
    ↓
[Act/Answer] Either call another tool or respond to the user
```

## Implementation

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

async function agentLoop(
  query: string,
  tools: Tool[],
  maxIterations: number = 10,
): Promise<string> {
  const messages: Message[] = [{ role: 'user', content: query }];

  for (let i = 0; i < maxIterations; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      })),
      messages,
    });

    // Check if the model wants to use a tool
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(c => c.type === 'tool_use');
      const tool = tools.find(t => t.name === toolUse.name);
      const result = await tool.execute(toolUse.input);

      messages.push({ role: 'assistant', content: response.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: result }],
      });
    } else {
      // Model is done -- return the final response
      return response.content.find(c => c.type === 'text')?.text ?? '';
    }
  }

  return 'Agent reached maximum iterations without completing.';
}
```

## Why ReAct Works

The key insight is that by writing out its reasoning, the model can:
1. Break complex problems into steps
2. Choose the right tool for each step
3. Adapt its plan based on intermediate results
4. Know when it has enough information to answer

## Limitations

- **Token cost:** Each iteration consumes tokens for the full conversation history.
- **Latency:** Multiple LLM calls add up.
- **Error propagation:** A bad tool result can derail the entire chain.
- **Infinite loops:** The agent may repeat actions without progress.

Always set a maximum iteration limit and implement error handling for tool failures.
