---
title: "Prompt Templates"
description: "Reusable prompt patterns for common Claude Code tasks"
category: "Prompts"
order: 1
---

# Prompt Templates

## Code Review

```
Review this code for:
1. Security vulnerabilities
2. Performance issues
3. Readability concerns
4. Missing edge cases

Be specific. Quote the problematic lines.
```

## Bug Investigation

```
There's a bug where [describe symptom].

1. Read the relevant files
2. Identify the root cause
3. Explain why it happens
4. Propose a fix with minimal changes
```

## Feature Implementation

```
Implement [feature description].

Requirements:
- [requirement 1]
- [requirement 2]

Constraints:
- Follow existing patterns in the codebase
- No new dependencies unless necessary
- Include error handling
```

## Refactoring

```
Refactor [target] to [goal].

Keep:
- Same public API
- All existing tests passing
- No behavioral changes

Improve:
- [specific improvement]
```

## Documentation

```
Write documentation for [target].

Include:
- Purpose and when to use it
- API reference with parameters
- Usage examples
- Common pitfalls
```
