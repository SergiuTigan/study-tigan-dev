---
title: "Claude Code Commands"
description: "Complete reference for Claude Code CLI commands and slash commands"
category: "CLI"
order: 1
lastUpdated: "2026-05-28"
---

# Claude Code Commands

Quick reference for all Claude Code CLI commands.

## CLI Commands

```bash
# Start interactive session
claude

# Run with initial prompt
claude "explain this codebase"

# Pipe input
cat file.ts | claude "review this code"

# Non-interactive (print mode)
claude -p "what does this function do"

# Resume last conversation
claude --resume

# Continue specific conversation
claude --continue
```

## Slash Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help |
| `/clear` | Clear conversation |
| `/compact` | Summarize and compact context |
| `/cost` | Show token usage and cost |
| `/doctor` | Check configuration health |
| `/init` | Create CLAUDE.md for project |
| `/memory` | Edit CLAUDE.md memory |
| `/review` | Review code changes |
| `/terminal-setup` | Install shell integration |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Cancel current generation |
| `Ctrl+C` | Interrupt / Exit |
| `Up/Down` | Navigate history |
| `Tab` | Accept autocomplete |

## Flags

```bash
# Output format
claude -p --output-format json "query"

# Model selection
claude --model claude-sonnet-4-20250514

# Max turns for agentic loop
claude --max-turns 10

# Allowed tools
claude --allowedTools "Bash,Read,Write"

# Disable tools
claude --disallowedTools "Bash"
```
