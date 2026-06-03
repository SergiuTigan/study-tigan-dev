---
title: "Function Calling"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "agents"
moduleTitle: "Agents & Tool Use"
moduleDescription: "Build AI agents that reason, plan, and take actions using tools."
lessonId: "ai-engineer/agents/function-calling"
duration: "10 min"
order: 502
moduleOrder: 5
lessonOrder: 2
color: "purple"
---
# Function Calling

Function calling (also called tool use) allows LLMs to invoke predefined functions with structured arguments. The model decides when to call a function and what arguments to pass.

## Defining Tools

```typescript
const tools = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a location.',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name, e.g., "San Francisco"' },
        units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature unit' },
      },
      required: ['location'],
    },
  },
  {
    name: 'search_database',
    description: 'Search the product database by name or category.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        category: { type: 'string', description: 'Product category filter' },
        limit: { type: 'number', description: 'Max results to return' },
      },
      required: ['query'],
    },
  },
];
```

## Handling Tool Calls

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  tools,
  messages: [{ role: 'user', content: 'What is the weather like in Tokyo?' }],
});

for (const block of response.content) {
  if (block.type === 'tool_use') {
    console.log(`Tool: ${block.name}`);
    console.log(`Args: ${JSON.stringify(block.input)}`);
    // Tool: get_weather
    // Args: { "location": "Tokyo", "units": "celsius" }
  }
}
```

## Tool Design Best Practices

```typescript
// Good: Clear name, specific description, well-typed parameters
{
  name: 'create_calendar_event',
  description: 'Creates a new event on the user calendar. Returns the event ID.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Event title' },
      start_time: { type: 'string', description: 'ISO 8601 datetime, e.g., "2025-03-14T10:00:00Z"' },
      duration_minutes: { type: 'number', description: 'Duration in minutes' },
    },
    required: ['title', 'start_time', 'duration_minutes'],
  },
}
```

## Parallel Tool Calls

Some models support calling multiple tools in a single turn:

```typescript
// Model might return multiple tool_use blocks:
// 1. get_weather({ location: "New York" })
// 2. get_weather({ location: "London" })
// Execute both in parallel, then return both results
```

## Safety Considerations

- Validate tool inputs before execution.
- Implement rate limits on tool calls.
- Log all tool invocations for auditing.
- Use allowlists for which tools each user can access.
- Never let the model construct arbitrary code to execute.
