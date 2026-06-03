---
title: "Module Resolution Strategies"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "module-system"
moduleTitle: "Module System"
moduleDescription: "Modern module resolution with subpath imports, ESM-first architecture, and package.json exports."
lessonId: "typescript-6/module-system/module-resolution"
duration: "8 min"
order: 404
moduleOrder: 4
lessonOrder: 4
color: "blue"
---
# Module Resolution Strategies

TypeScript offers several module resolution strategies, and choosing the right one is critical for your project. TypeScript 6 supports `bundler`, `node16`, and `nodenext` as the recommended options. The older `node` (aka `node10`) and `classic` strategies are deprecated.

## The Three Modern Strategies

### `nodenext`

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext"
  }
}
```

This mirrors Node.js resolution exactly. It requires:
- File extensions in relative imports (`./utils.js`, not `./utils`)
- Respects the `exports` and `imports` fields in `package.json`
- Distinguishes between ESM and CJS based on file extension and `type` field
- Enforces `import`/`require` correctness

Use `nodenext` when you are building for **Node.js directly** without a bundler.

### `node16`

```json
{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16"
  }
}
```

Functionally identical to `nodenext` but pinned to the Node.js 16 resolution algorithm. In practice, there is currently no difference between `node16` and `nodenext`. The `nodenext` option will evolve with future Node.js changes, while `node16` remains fixed.

### `bundler`

```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

This is the most permissive modern strategy. It:
- Does **not** require file extensions on relative imports
- Respects `exports` and `imports` fields
- Does not enforce ESM/CJS correctness (since the bundler handles that)
- Allows extensionless imports like `./utils`

Use `bundler` when your code is processed by **Vite, webpack, esbuild, Rollup**, or any similar tool.

## Comparison Table

| Feature | `nodenext` | `node16` | `bundler` |
|---------|-------------|----------|------------|
| File extensions required | Yes | Yes | No |
| Reads `exports` field | Yes | Yes | Yes |
| Reads `imports` field | Yes | Yes | Yes |
| ESM/CJS enforcement | Strict | Strict | None |
| Best for | Node.js apps | Node.js apps | Bundled apps |

## Common Pitfalls

### Missing File Extensions

```typescript
// nodenext: Error -- relative import must include extension
import { parse } from './parser';

// nodenext: Correct
import { parse } from './parser.js';

// bundler: Both forms work
import { parse } from './parser';
```

### Library Authors: Dual Strategy

If you publish a library consumed by both Node.js and bundler users, configure your project with `nodenext`. It is the strictest mode, and code that works under `nodenext` will also work under `bundler`. The reverse is not true.

### The `node10` Trap

The `"moduleResolution": "node"` setting (now called `node10`) is the legacy default. It does **not** support `exports`, does not understand ESM, and should not be used in new projects. If you see it in an older codebase, plan to migrate:

```json
// Legacy -- avoid in new projects
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}

// Modern -- use one of these instead
{
  "compilerOptions": {
    "moduleResolution": "nodenext"
  }
}
```

## Decision Flowchart

1. **Are you using a bundler (Vite, webpack, etc.)?** Use `bundler`.
2. **Are you building a Node.js application or CLI tool?** Use `nodenext`.
3. **Are you publishing a library?** Use `nodenext` for maximum compatibility.
4. **Are you unsure?** Start with `bundler` -- it is the most forgiving and you can tighten later.
