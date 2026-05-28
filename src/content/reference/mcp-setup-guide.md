---
title: "MCP Setup Guide"
description: "Model Context Protocol server configuration for Claude Code"
category: "Configuration"
order: 3
lastUpdated: "2026-05-28"
---

# MCP Setup Guide

MCP (Model Context Protocol) lets Claude Code connect to external tools and data sources.

## Configuration File

MCP servers are configured in `~/.claude/claude_desktop_config.json` or per-project in `.claude/settings.json`.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    }
  }
}
```

## Common Servers

| Server | Purpose |
|--------|---------|
| `server-filesystem` | Read/write files outside workspace |
| `server-github` | GitHub API (issues, PRs, repos) |
| `server-postgres` | Query PostgreSQL databases |
| `server-sqlite` | Query SQLite databases |
| `server-brave-search` | Web search via Brave |
| `server-puppeteer` | Browser automation |
| `server-memory` | Persistent knowledge graph |

## Adding a Server

```bash
# Install and test
npx -y @modelcontextprotocol/server-filesystem /tmp

# Add to config
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem /path
```

## Verifying

```bash
# Check health
claude /doctor

# List active servers
claude mcp list
```

## Troubleshooting

- **Server not connecting:** Check `command` path is correct and binary exists
- **Env vars missing:** Ensure `env` block has required tokens
- **Timeout:** Some servers need `--timeout` flag increased
