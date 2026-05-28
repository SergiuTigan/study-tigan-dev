---
title: "Keyboard Shortcuts"
description: "Essential keyboard shortcuts for Claude Code"
category: "CLI"
order: 5
lastUpdated: "2026-05-28"
---

# Keyboard Shortcuts

## In Conversation

| Shortcut | Action |
|----------|--------|
| `Escape` | Cancel current generation |
| `Ctrl+C` | Interrupt current operation |
| `Ctrl+D` | Exit Claude Code |
| `Up Arrow` | Previous message in history |
| `Down Arrow` | Next message in history |
| `Tab` | Accept autocomplete suggestion |
| `Shift+Tab` | Cycle autocomplete options |

## Multi-line Input

| Shortcut | Action |
|----------|--------|
| `Shift+Enter` | New line (in supported terminals) |
| `\\` at end of line | Continue on next line |

## During Tool Execution

| Shortcut | Action |
|----------|--------|
| `Escape` | Cancel tool execution |
| `y` / `Enter` | Approve tool use |
| `n` | Reject tool use |
| `a` | Always approve this tool |

## VS Code Integration

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+P` → Claude | Open Claude Code panel |
| `Cmd+L` | Focus Claude Code input |

## Terminal Tips

- Use `Ctrl+R` in your shell to search Claude Code command history
- Pipe with `|` to feed output directly: `git diff | claude "review"`
- Use `!!` to repeat last command context
