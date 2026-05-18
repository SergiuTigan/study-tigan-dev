# Week 7: MCP & Advanced Agent Orchestration

> *"MCP is to AI tools what USB was to peripherals. Before it, every connection was custom. After it, everything just works."*

**Dates:** 30 Iunie - 6 Iulie 2026
**Phase:** Faza 2 — Patterns
**Hours This Week:** ~17h
**Outcome:** Working MCP server, orchestrator-worker patterns, subagent delegation.

---

## The Big Picture

Last week you built an agent that decides its own actions. This week you build the infrastructure that makes agents truly powerful: **standardized tool protocols** and **multi-agent orchestration**.

Two threads run through this week:

**Thread 1: MCP (Model Context Protocol).** Right now, if you want Claude Desktop to use your research agent's tools, you have to build a custom integration. If you want ChatGPT to use them, you build another. Cursor? Another. Every AI application reinvents the wheel for connecting to external services.

MCP fixes this. It's a universal protocol — think of it as "USB for AI tools." You build one MCP server, and any MCP-compatible client (Claude Desktop, Cursor, Windsurf, your own apps) can use it. Build once, connect everywhere.

**Thread 2: Advanced Orchestration.** Single agents hit a ceiling. They have one context window, one set of tools, one thread of reasoning. Orchestrator-worker patterns break through that ceiling by having a "manager" LLM delegate subtasks to specialized "worker" LLMs. Subagents take this further — spawning fully autonomous agents with their own context, tools, and completion criteria.

By Sunday, you'll have a polished MCP server on GitHub and hands-on experience with multi-agent patterns.

## Daily Breakdown

| Day | Focus | Hours |
|-----|-------|-------|
| Day 43 (Lun) | MCP Introduction — the protocol, the architecture | 2h |
| Day 44 (Mar) | MCP SDK — build your first server | 2h |
| Day 45 (Mie) | Build a real MCP server with actual API tools | 2h |
| Day 46 (Joi) | Orchestrator-Worker pattern | 2h |
| Day 47 (Vin) | REST | -- |
| Day 48 (Sam) | Subagents — isolated agents with focused tasks | 3h |
| Day 49 (Dum) | Polish MCP + Document + Ship | 5h |

## Key Concepts This Week

- **MCP Server:** A process that exposes tools, resources, and prompts via JSON-RPC
- **MCP Client:** An AI application that connects to MCP servers (Claude Desktop, Cursor, etc.)
- **Transport:** How client and server communicate (stdio for local, HTTP/SSE for remote)
- **Orchestrator-Worker:** One LLM plans, many LLMs execute, one LLM synthesizes
- **Subagents:** Fully autonomous child agents with isolated context
- **Model Selection:** Use Haiku for simple workers, Sonnet for complex ones, Opus for orchestration

---

*This week, you stop building tools for one application and start building tools for the entire AI ecosystem.*
