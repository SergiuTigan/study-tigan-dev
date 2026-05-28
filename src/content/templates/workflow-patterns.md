---
title: "Workflow Patterns"
description: "Efficient patterns for working with Claude Code on real projects"
category: "Workflows"
order: 4
---

# Workflow Patterns

## The Explore-Plan-Execute Pattern

Best for unfamiliar codebases or complex features.

```
1. "Explore the codebase and explain the architecture"
2. "Plan how to implement [feature]. Don't write code yet."
3. Review the plan, adjust if needed
4. "Execute step 1 of the plan"
5. Verify, then continue with next steps
```

## The Test-First Pattern

Write tests before implementation.

```
1. "Write failing tests for [feature]"
2. "Run the tests to confirm they fail"
3. "Implement the minimum code to make tests pass"
4. "Refactor if needed, keeping tests green"
```

## The Incremental Migration Pattern

For large refactors or framework migrations.

```
1. "List all files that need to change for [migration]"
2. "Migrate [single file] — keep everything else working"
3. "Run tests/build to verify"
4. Repeat for each file
5. "Clean up any compatibility shims"
```

## The Review-Fix Loop

```
1. Make your changes manually or with Claude
2. "Review all changes in this branch against main"
3. Claude identifies issues
4. "Fix issue #1" → "Fix issue #2" → ...
5. "Review again" until clean
```

## The Context-Priming Pattern

Start sessions with focused context.

```
# Instead of:
"Fix the bug"

# Do:
"Read src/auth/middleware.ts and src/auth/session.ts.
Users report 401 errors after token refresh.
The refresh token endpoint returns 200 but the new token isn't stored."
```

## Tips

- **Small commits.** Ask Claude to commit after each logical change.
- **Verify often.** Run builds and tests between steps.
- **Be specific.** Vague requests → vague results.
- **Use /compact.** Long sessions lose quality. Compact regularly.
