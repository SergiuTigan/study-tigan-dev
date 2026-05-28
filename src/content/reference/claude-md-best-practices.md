---
title: "CLAUDE.md Best Practices"
description: "Guide to writing effective CLAUDE.md project memory files"
category: "Configuration"
order: 2
lastUpdated: "2026-05-28"
---

# CLAUDE.md Best Practices

CLAUDE.md is Claude Code's project memory. It persists context across sessions.

## File Locations

| Location | Scope |
|----------|-------|
| `~/.claude/CLAUDE.md` | Global — all projects |
| `./CLAUDE.md` | Project root — shared with team |
| `./src/CLAUDE.md` | Directory-specific context |

## Structure Template

```markdown
# Project Name

## Tech Stack
- Framework: Astro 6
- Language: TypeScript (strict)
- Styling: Tailwind CSS

## Architecture
Brief description of key patterns.

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm test` — run tests

## Conventions
- Use named exports
- Prefer composition over inheritance
- Keep components under 200 lines

## Important Files
- `src/content.config.ts` — content collection schemas
- `src/middleware.ts` — auth middleware

## Do NOT
- Never commit .env files
- Don't modify migration files
```

## Tips

- **Be concise.** Claude reads this every session. Long files waste context.
- **Update after changes.** Run `/memory` to edit when architecture evolves.
- **Layer specificity.** Global CLAUDE.md for personal prefs, project-level for team conventions.
- **Include build commands.** Claude needs to know how to verify its work.
- **List gotchas.** Known quirks save debugging time.
