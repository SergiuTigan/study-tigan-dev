---
title: "Day 43 — MCP Introduction"
week: 7
day: 43
phase: 2
phaseLabel: "Deep Dive"
order: 743
type: "day"
---
# Day 43 — MCP Introduction

> *"Before USB, every printer needed its own cable, its own driver, its own connector. MCP is having that same moment for AI tools."*

**Date:** Luni, 30 Iunie 2026
**Hours:** 2h · Evening study session
**Topic:** Model Context Protocol — architecture, concepts, why it matters
**Phase:** Faza 2 — Patterns · Week 7

---

## What You're Doing

Today you learn about MCP — the Model Context Protocol — and why it's one of the most important infrastructure developments in AI engineering.

Here's the problem MCP solves. You built a research agent last week with web search and webpage reading tools. Those tools work with your agent. But what if you want Claude Desktop to use them? You'd have to build a plugin. What about Cursor? Another integration. ChatGPT? Yet another. Every AI application has its own way of connecting to external services, and every developer rebuilds the same tools over and over.

MCP creates a universal standard. You build one MCP server that exposes your tools, and *any* MCP-compatible client can use them. Claude Desktop, Cursor, Windsurf, VS Code with Copilot, your own applications — all of them can connect to the same server through the same protocol.

Anthropic open-sourced MCP in late 2024, and it's rapidly becoming the standard for AI tool integration. Understanding it now puts you ahead of most AI engineers.

## The Work

### Step 1: The Architecture

MCP follows a client-server architecture with three layers:

```
┌─────────────────────────────────────────────┐
│                AI Application               │
│  (Claude Desktop, Cursor, Your App, etc.)   │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────▼────────┐
          │   MCP Client    │  ← Built into the AI application
          │  (protocol lib) │     Discovers and calls tools
          └────────┬────────┘
                   │ JSON-RPC (stdio or HTTP/SSE)
          ┌────────▼────────┐
          │   MCP Server    │  ← YOU build this
          │  (your code)    │     Exposes tools, resources, prompts
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ External Service │  ← APIs, databases, files, etc.
          │  (anything)      │
          └─────────────────┘
```

The key insight: **the MCP server is the bridge between AI models and the real world.** The model doesn't need to know about REST APIs, authentication, or data formats. It just knows "I have a tool called `get_schedule` that returns today's schedule."

### Step 2: What MCP Servers Expose

An MCP server can expose three types of capabilities:

**1. Tools (Functions the model can call)**
```
Tools are the most common capability. They're functions with:
- A name: "get_weather"
- A description: "Get current weather for a city"
- Input schema: { city: string, units?: "celsius" | "fahrenheit" }
- An execute function that returns results

The model sees the name and description, decides when to call it,
and provides the required inputs.
```

**2. Resources (Data the model can read)**
```
Resources are like files or data endpoints. They have:
- A URI: "schedule://today" or "file:///path/to/doc.md"
- A name: "Today's Schedule"
- A MIME type: "text/plain", "application/json"
- Content that the client can fetch

Resources are READ-ONLY. The model can request them,
but they don't take parameters like tools do.
```

**3. Prompts (Reusable templates)**
```
Prompts are pre-written templates that clients can use:
- A name: "code_review"
- Arguments: { code: string, language: string }
- A template that gets filled in

Less common than tools and resources, but useful for
standardizing how the model interacts with your service.
```

### Step 3: Transport — How They Talk

MCP supports two transport mechanisms:

**stdio (Standard I/O) — for local servers:**
```
The MCP server runs as a subprocess on your machine.
The client writes JSON-RPC messages to the server's stdin.
The server writes responses to stdout.

This is the most common transport for local tools.
Claude Desktop uses this to connect to local MCP servers.

Pros: Simple, no network setup, secure (local only)
Cons: Can't share across machines
```

**HTTP with SSE (Server-Sent Events) — for remote servers:**
```
The MCP server runs as a web service.
The client sends JSON-RPC over HTTP POST.
The server can stream responses via SSE.

Pros: Can be deployed anywhere, shared across clients
Cons: Needs authentication, network setup
```

### Step 4: The JSON-RPC Protocol

Under the hood, MCP uses JSON-RPC 2.0. Here's what the messages look like:

```json
// Client → Server: "What tools do you have?"
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}

// Server → Client: "Here are my tools"
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather for a city",
        "inputSchema": {
          "type": "object",
          "properties": {
            "city": { "type": "string" }
          },
          "required": ["city"]
        }
      }
    ]
  }
}

// Client → Server: "Call this tool"
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "city": "București" }
  }
}

// Server → Client: "Here's the result"
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Current weather in București: 28°C, sunny"
      }
    ]
  }
}
```

You won't write this JSON by hand — the SDK handles it. But understanding the protocol helps you debug when things go wrong.

### Step 5: The MCP Ecosystem

Map the current landscape:

```markdown
## MCP Clients (apps that CONNECT to servers)
- Claude Desktop — Anthropic's desktop app
- Claude Code — CLI tool for developers
- Cursor — AI-powered code editor
- Windsurf — AI development environment
- VS Code + Extensions — via various plugins
- Your own applications — using the SDK

## MCP Servers (tools that EXPOSE capabilities)
- Official servers: filesystem, GitHub, Slack, Google Drive, PostgreSQL
- Community servers: hundreds on GitHub
- Your servers: anything you build

## Where to Find Servers
- https://github.com/modelcontextprotocol/servers (official)
- https://mcp.run (community directory)
- https://glama.ai/mcp/servers (another directory)
```

### Step 6: Why This Matters for Your Career

Write down why MCP matters:

```markdown
## Why MCP matters for AI engineers

1. **Build once, use everywhere**
   One MCP server works with Claude, Cursor, and any future MCP client.
   No more rebuilding tools for each platform.

2. **Composability**
   Users can connect multiple MCP servers to one client.
   Your weather server + someone's calendar server = "Schedule outdoor
   activities when weather is good."

3. **Security model**
   The server controls what the model can access.
   Better than giving the model raw API keys.

4. **Growing ecosystem**
   Companies are building MCP servers for their products.
   Knowing how to build and maintain them is a marketable skill.

5. **It's the winning standard**
   Adopted by Anthropic, Cursor, and growing.
   Being early to the right standard is career leverage.
```

## Key Insight

MCP is not just a protocol — it's a **design philosophy**. It says: "AI tools should be modular, composable, and universal." Before MCP, every AI integration was a snowflake. After MCP, tools are interchangeable parts. This is the same shift that USB brought to hardware and REST brought to web APIs. The engineers who understand and build for this standard will define how AI interacts with the real world.

## Resources

- [Model Context Protocol — Official Site](https://modelcontextprotocol.io/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP GitHub Organization](https://github.com/modelcontextprotocol)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)
- [MCP Server Directory](https://github.com/modelcontextprotocol/servers)

## Done When

- [ ] You can draw the MCP architecture from memory (Model ←→ Client ←→ Server ←→ Service)
- [ ] You know the three capabilities: Tools, Resources, Prompts
- [ ] You understand both transports: stdio (local) and HTTP/SSE (remote)
- [ ] You've read through the MCP specification overview
- [ ] You've browsed the official server directory to see what exists
- [ ] You can explain to a colleague why MCP matters in 2 sentences

---

*Tomorrow: You build your first MCP server. One tool, stdio transport, connected to Claude Desktop. Hello world for the protocol that's changing AI infrastructure.*
