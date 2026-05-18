# Day 9 — Tool Use (Basic)

> *"Claude doesn't execute your tools. Claude asks you to execute them. This distinction is everything."*

**Date:** Marti, 27 Mai 2025
**Hours:** 2h · Seara (20:00--22:00)
**Topic:** Tool use fundamentals with the Anthropic API
**Phase:** Faza 1 — Foundations · Week 2

---

## What You're Doing

Yesterday, Claude could only talk. Today, Claude can *do things*.

Tool use (sometimes called "function calling") is the mechanism that bridges the gap between a language model that generates text and an application that takes actions. It's the single most important capability for building AI-powered software, and understanding it deeply will separate you from 90% of people building with LLMs.

Here's the mental shift: Claude doesn't have access to the internet. Claude can't read files. Claude can't check the weather. But Claude can *ask you* to do these things, describe exactly what parameters are needed, and then incorporate the results into its reasoning. You are the executor. Claude is the orchestrator.

If you've built Angular apps with backend services, you already know this pattern. Your Angular component doesn't query the database directly -- it asks a service to do it. Claude is the component. Your code is the service. The tool definition is the interface contract.

---

## The Work

### The Tool Use Flow

This is the complete flow. Memorize it:

```
1. YOU define available tools (name, description, input_schema)
2. YOU send a message with tools array
3. CLAUDE decides to use a tool → returns stop_reason: "tool_use"
4. YOU extract the tool name + arguments from the response
5. YOU execute the tool (your code, your responsibility)
6. YOU send the tool result back to Claude
7. CLAUDE incorporates the result and responds to the user
```

Steps 3-7 can repeat multiple times in a single conversation turn. Claude might need to call several tools before it has enough information to answer.

### Defining a Tool

A tool definition has three parts: `name`, `description`, and `input_schema` (JSON Schema format).

```typescript
const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description:
      "Get the current weather for a given location. Returns temperature, conditions, and humidity. Use this when the user asks about weather in a specific city or location.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "The city and country, e.g. 'London, UK' or 'Tokyo, Japan'",
        },
        units: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "Temperature units. Defaults to celsius.",
        },
      },
      required: ["location"],
    },
  },
];
```

**Critical details about the description**: This is not just documentation -- it's Claude's *instruction manual* for when and how to use the tool. A vague description means Claude will use the tool at wrong times or with wrong parameters. Be specific. Include examples. Mention edge cases.

### The Full Request-Response Cycle

Here's the complete, working implementation:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Step 1: Define the tool
const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description:
      "Get current weather for a location. Returns temperature in specified units, weather condition, and humidity percentage.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "City name, e.g. 'Bucharest' or 'London, UK'",
        },
        units: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "Temperature units (default: celsius)",
        },
      },
      required: ["location"],
    },
  },
];

// Step 5: YOUR tool implementation (Claude never sees this code)
async function executeGetWeather(
  location: string,
  units: string = "celsius"
): Promise<string> {
  // Using wttr.in -- a free weather API, no key needed
  const format = units === "fahrenheit" ? "u" : "m";
  const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1&${format}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const current = data.current_condition[0];

    return JSON.stringify({
      location: location,
      temperature: units === "fahrenheit"
        ? `${current.temp_F}°F`
        : `${current.temp_C}°C`,
      condition: current.weatherDesc[0].value,
      humidity: `${current.humidity}%`,
      feels_like: units === "fahrenheit"
        ? `${current.FeelsLikeF}°F`
        : `${current.FeelsLikeC}°C`,
    });
  } catch (error) {
    return JSON.stringify({ error: `Failed to get weather for ${location}` });
  }
}

// The main function that orchestrates everything
async function askAboutWeather(userQuestion: string): Promise<void> {
  console.log(`\nUser: ${userQuestion}\n`);

  // Step 2: Send message with tools
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    tools: tools,
    messages: [{ role: "user", content: userQuestion }],
  });

  console.log(`Stop reason: ${response.stop_reason}`);

  // Step 3: Check if Claude wants to use a tool
  if (response.stop_reason === "tool_use") {
    // Step 4: Extract tool call(s)
    const toolUseBlock = response.content.find(
      (block) => block.type === "tool_use"
    );

    if (toolUseBlock && toolUseBlock.type === "tool_use") {
      console.log(`Tool called: ${toolUseBlock.name}`);
      console.log(`Arguments: ${JSON.stringify(toolUseBlock.input, null, 2)}`);

      // Step 5: Execute the tool
      const input = toolUseBlock.input as { location: string; units?: string };
      const toolResult = await executeGetWeather(
        input.location,
        input.units || "celsius"
      );

      console.log(`Tool result: ${toolResult}\n`);

      // Step 6: Send the result back to Claude
      const finalResponse = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        tools: tools,
        messages: [
          { role: "user", content: userQuestion },
          { role: "assistant", content: response.content },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolUseBlock.id,
                content: toolResult,
              },
            ],
          },
        ],
      });

      // Step 7: Claude's final response
      const textBlock = finalResponse.content.find(
        (block) => block.type === "text"
      );
      if (textBlock && textBlock.type === "text") {
        console.log(`Claude: ${textBlock.text}`);
      }
    }
  } else {
    // Claude answered directly without needing a tool
    const textBlock = response.content.find((block) => block.type === "text");
    if (textBlock && textBlock.type === "text") {
      console.log(`Claude: ${textBlock.text}`);
    }
  }
}

// Test it
askAboutWeather("What's the weather like in Bucharest right now?");
```

### Anatomy of Claude's Tool-Use Response

When Claude decides to use a tool, the response looks different from a normal text response:

```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "I'll check the current weather in Bucharest for you."
    },
    {
      "type": "tool_use",
      "id": "toolu_01ABC123...",
      "name": "get_weather",
      "input": {
        "location": "Bucharest",
        "units": "celsius"
      }
    }
  ],
  "stop_reason": "tool_use",
  "usage": { "input_tokens": 350, "output_tokens": 65 }
}
```

Notice:
- **`stop_reason` is `"tool_use"`**, not `"end_turn"`. This tells you Claude is pausing and waiting for you to execute the tool.
- **`content` is an array** that can contain both text AND tool_use blocks. Claude might say "Let me check that for you" AND request a tool call in the same response.
- **`tool_use.id`** is critical -- you must reference this exact ID when sending back the result.
- **`tool_use.input`** matches the `input_schema` you defined. Claude respects the schema.

### Sending the Tool Result Back

The tool result is sent as a special content type in a `user` message:

```typescript
{
  role: "user",
  content: [
    {
      type: "tool_result",
      tool_use_id: "toolu_01ABC123...",  // Must match the tool_use.id
      content: '{"temperature": "24°C", "condition": "Partly cloudy"}',
    },
  ],
}
```

The `content` field in `tool_result` is a string. Send JSON, plain text, or whatever your tool returns. Claude will interpret it.

### The Security Model

This is the part that trips people up. Let's be crystal clear:

**Claude NEVER executes tools.** Claude generates a JSON object saying "I'd like to call `get_weather` with these parameters." Your code receives this request, validates it, executes the actual function, and sends the result back.

This means:
- **You control what tools exist.** Claude can only use tools you define.
- **You control execution.** You can add rate limiting, auth checks, logging -- anything.
- **You can reject tool calls.** Send back an error result if the parameters are invalid.
- **You can fake results.** Useful for testing and dry runs.

In Angular terms: Claude is a smart component that emits events. Your code is the parent that handles them. The component doesn't have direct access to the service -- it goes through `@Output()`.

### Error Handling in Tool Results

Always handle errors gracefully. Send back useful error messages:

```typescript
// If the tool fails, tell Claude why
const toolResult = {
  type: "tool_result" as const,
  tool_use_id: toolUseBlock.id,
  content: JSON.stringify({
    error: "Location not found. Please try a major city name.",
  }),
  is_error: true, // Optional: signals to Claude this was an error
};
```

Claude will see the error and either try again with different parameters or explain the failure to the user.

---

## Key Insight

Tool use is a **communication protocol**, not an execution framework. Claude says "I need X," you provide X, Claude continues. The power is in the separation: Claude handles reasoning and language, you handle execution and security. Neither crosses into the other's territory.

This is why tool use is safe by default. Claude can't delete your files or call arbitrary APIs -- unless you write a tool that does those things and give it to Claude. The security boundary is *your code*.

---

## Build

### Weather Tool CLI

Build a CLI that:

1. Defines a `get_weather` tool with the schema above
2. Accepts a user question as a command-line argument (or via prompt)
3. Detects when Claude returns `stop_reason: "tool_use"`
4. Calls the [wttr.in](https://wttr.in) API (free, no auth needed) with the extracted parameters
5. Sends the result back to Claude
6. Prints Claude's final natural-language response

Test with these queries:
- "What's the weather in Bucharest?" (straightforward)
- "Should I wear a jacket in London today?" (Claude must reason about the weather data)
- "What's the capital of France?" (Claude should answer directly, no tool call)

**Verify the third case**: Claude should NOT call the weather tool for questions that don't need weather data. If it does, your tool description needs to be more specific.

**Stretch goal**: Add a `get_time` tool that returns the current time in a given timezone. Test: "What's the time and weather in Tokyo?"

---

## Resources

- **[Tool Use Overview](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview)** -- The definitive guide. Read the full page, including error handling and best practices.
- **[Anthropic Cookbook: Tool Use](https://github.com/anthropics/anthropic-cookbook/tree/main/tool_use)** -- Working examples in Python and TypeScript. Study the patterns.
- **[wttr.in API](https://github.com/chubin/wttr.in)** -- The free weather API used in examples. JSON format: `wttr.in/London?format=j1`

---

## Done When

- [ ] You can define a tool with `name`, `description`, and `input_schema`
- [ ] You can detect `stop_reason: "tool_use"` and extract the tool name, arguments, and `tool_use_id`
- [ ] You can execute a real API call (wttr.in) with the extracted arguments
- [ ] You can send back a `tool_result` message with the correct `tool_use_id`
- [ ] Claude gives a natural language response that incorporates the tool result
- [ ] You understand that Claude does NOT execute tools -- your code does
- [ ] Claude does NOT call the weather tool for non-weather questions

---

*Tomorrow: [Day 10 -- Multi-Tool & Agent Loop](/day-10.md) -- multiple tools, chained calls, and the loop that powers every AI agent.*
