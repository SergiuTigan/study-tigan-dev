---
title: "Hook Recipes"
description: "Copy-paste hook configurations for common automation needs"
category: "Automation"
order: 3
---

# Hook Recipes

## Auto-Format on File Write

Format files with Prettier whenever Claude writes to them.

```json
{
  "PostToolUse": [
    {
      "matcher": "Write",
      "hooks": [
        {
          "type": "command",
          "command": "npx prettier --write $CLAUDE_FILE_PATH 2>/dev/null || true"
        }
      ]
    }
  ]
}
```

## Lint on File Changes

Run ESLint after file modifications.

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "npx eslint --fix $CLAUDE_FILE_PATH 2>/dev/null || true"
        }
      ]
    }
  ]
}
```

## Desktop Notification on Completion

Get notified when Claude finishes (macOS).

```json
{
  "Stop": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "osascript -e 'display notification \"Task complete\" with title \"Claude Code\"'"
        }
      ]
    }
  ]
}
```

## Prevent Accidental Deletions

Block `rm -rf` commands.

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'rm -rf'; then echo 'BLOCKED: rm -rf detected' >&2; exit 1; fi"
        }
      ]
    }
  ]
}
```

## Auto-Test After Changes

Run tests after modifying source files.

```json
{
  "PostToolUse": [
    {
      "matcher": "Write",
      "hooks": [
        {
          "type": "command",
          "command": "if echo $CLAUDE_FILE_PATH | grep -q 'src/'; then npm test 2>&1 | tail -5; fi"
        }
      ]
    }
  ]
}
```
