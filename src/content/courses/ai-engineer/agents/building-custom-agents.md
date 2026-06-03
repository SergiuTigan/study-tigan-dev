---
title: "Building Custom Agents"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "agents"
moduleTitle: "Agents & Tool Use"
moduleDescription: "Build AI agents that reason, plan, and take actions using tools."
lessonId: "ai-engineer/agents/building-custom-agents"
duration: "12 min"
order: 504
moduleOrder: 5
lessonOrder: 4
color: "purple"
---
# Building Custom Agents

Building a custom agent gives you full control over reasoning, tool selection, error handling, and conversation flow. This lesson walks through building a production-quality agent from scratch.

## Agent Architecture

```typescript
interface AgentConfig {
  model: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  maxIterations: number;
  onToolCall?: (name: string, args: unknown) => void;
  onError?: (error: Error) => void;
}

class Agent {
  private messages: Message[] = [];
  private iterationCount = 0;

  constructor(private config: AgentConfig) {}

  async run(userMessage: string): Promise<string> {
    this.messages.push({ role: 'user', content: userMessage });
    this.iterationCount = 0;

    while (this.iterationCount < this.config.maxIterations) {
      this.iterationCount++;

      const response = await this.callModel();

      if (this.isToolCall(response)) {
        await this.handleToolCall(response);
      } else {
        return this.extractText(response);
      }
    }

    return 'I was unable to complete the task within the allowed steps.';
  }

  private async handleToolCall(response: ModelResponse): Promise<void> {
    const toolCalls = this.extractToolCalls(response);
    this.messages.push({ role: 'assistant', content: response.content });

    const results = await Promise.all(
      toolCalls.map(async (call) => {
        try {
          this.config.onToolCall?.(call.name, call.input);
          const tool = this.findTool(call.name);
          const result = await tool.execute(call.input);
          return { id: call.id, content: result, is_error: false };
        } catch (error) {
          this.config.onError?.(error as Error);
          return { id: call.id, content: String(error), is_error: true };
        }
      })
    );

    this.messages.push({
      role: 'user',
      content: results.map(r => ({
        type: 'tool_result',
        tool_use_id: r.id,
        content: r.content,
        is_error: r.is_error,
      })),
    });
  }
}
```

## Adding Memory

```typescript
interface Memory {
  save(key: string, value: string): Promise<void>;
  recall(key: string): Promise<string | null>;
  search(query: string): Promise<string[]>;
}

// Add memory as a tool
const memoryTool: ToolDefinition = {
  name: 'remember',
  description: 'Save a piece of information for later recall.',
  parameters: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'A descriptive key for the information' },
      value: { type: 'string', description: 'The information to remember' },
    },
    required: ['key', 'value'],
  },
  execute: async (args) => {
    await memory.save(args.key, args.value);
    return 'Saved successfully.';
  },
};
```

## Error Recovery

```typescript
private async handleToolCall(response: ModelResponse): Promise<void> {
  // Retry failed tool calls up to 2 times
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await tool.execute(call.input);
      return result;
    } catch (error) {
      if (attempt === 2) {
        return `Tool failed after 3 attempts: ${error.message}`;
      }
      await delay(1000 * (attempt + 1)); // Backoff
    }
  }
}
```

Custom agents require more code but give you the flexibility to handle your specific requirements precisely. Start with a simple loop and add complexity as needed.
