---
title: "Hooks Reference"
description: "Claude Code hooks for automating workflows and enforcing rules"
category: "Configuration"
order: 4
lastUpdated: "2026-05-28"
---

# Hooks Reference

Hooks run shell commands in response to Claude Code events. Configure in `.claude/settings.json`.

## Hook Types

| Hook | Trigger |
|------|---------|
| `PreToolUse` | Before a tool executes |
| `PostToolUse` | After a tool executes |
| `Notification` | When Claude sends a notification |
| `Stop` | When Claude finishes a turn |

## Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'About to run bash command'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $CLAUDE_FILE_PATH"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "terminal-notifier -message 'Claude finished' -title 'Claude Code'"
          }
        ]
      }
    ]
  }
}
```

## Environment Variables

Hooks receive context via environment variables:

| Variable | Description |
|----------|-------------|
| `CLAUDE_FILE_PATH` | File being operated on |
| `CLAUDE_TOOL_NAME` | Name of tool being used |
| `CLAUDE_TOOL_INPUT` | JSON input to tool |
| `CLAUDE_TOOL_OUTPUT` | JSON output (PostToolUse only) |

## Recipes

### Auto-format on write
```json
{
  "matcher": "Write",
  "hooks": [{ "type": "command", "command": "npx prettier --write $CLAUDE_FILE_PATH" }]
}
```

### Lint check before commit
```json
{
  "matcher": "Bash",
  "hooks": [{ "type": "command", "command": "if echo $CLAUDE_TOOL_INPUT | grep -q 'git commit'; then npm run lint; fi" }]
}
```

### Notification on completion
```json
{
  "matcher": "",
  "hooks": [{ "type": "command", "command": "say 'Claude is done'" }]
}
```
