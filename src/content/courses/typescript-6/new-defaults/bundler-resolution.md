---
title: "Bundler Module Resolution"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "new-defaults"
moduleTitle: "New Defaults"
moduleDescription: "TypeScript 6 ships with strict mode, ES2025 target, and bundler resolution as defaults — learn what changed and why."
lessonId: "typescript-6/new-defaults/bundler-resolution"
duration: "8 min"
order: 103
moduleOrder: 1
lessonOrder: 3
color: "blue"
---
# Bundler Module Resolution

TypeScript 6 changes the default `moduleResolution` to `"bundler"`. This aligns TypeScript's module resolution with how modern bundlers like Vite, esbuild, webpack, and Rollup actually resolve imports.

## What Changed

In previous versions, the default module resolution was `"node"` (for CommonJS) or `"node16"`/`"nodenext"` (for ESM in Node.js). Each of these had limitations when used with bundlers:

| Resolution     | Designed For          | Extension Required? | `exports` Field |
|----------------|-----------------------|---------------------|------------------|
| `node`        | CommonJS in Node.js   | No                  | No               |
| `node16`      | ESM in Node.js        | Yes (`.js`)        | Yes              |
| `bundler`     | Modern bundlers       | No                  | Yes              |

The `"bundler"` strategy gives you the best of both worlds: you do not need to write file extensions in your imports, but the resolver still respects the `exports` field in `package.json`.

## How It Works

With bundler resolution, TypeScript resolves imports using these rules:

1. **Relative imports** are resolved by looking for the file directly, trying `.ts`, `.tsx`, `.js`, `.jsx`, and `index` files in that order.
2. **Bare specifiers** (like `import { z } from 'zod'`) are resolved through `node_modules`, respecting the `exports` map in `package.json`.
3. **File extensions are optional** in import paths — you can write `import { foo } from './utils'` instead of `import { foo } from './utils.js'`.
4. **Path mappings** from `tsconfig.json` (`paths` and `baseUrl`) are fully supported.

```typescript
// All of these work with bundler resolution:
import { helper } from './utils';          // resolves to ./utils.ts
import { Button } from './ui/Button';      // resolves to ./ui/Button.tsx
import { z } from 'zod';                   // uses package.json exports
import { cn } from '@/lib/utils';          // uses tsconfig paths
```

## Comparison with `node16` Resolution

The `node16` resolution mode requires explicit `.js` extensions for relative imports, even when the source file is `.ts`:

```typescript
// node16 — you must write .js even for .ts files
import { helper } from './utils.js';

// bundler — extension is optional
import { helper } from './utils';
```

The `node16` mode is still the correct choice if you are writing a library that will run directly in Node.js without a bundler. But for applications built with Vite, Next.js, or similar tools, `"bundler"` is the right default.

## When to Override

You should switch away from bundler resolution in these cases:

- **Node.js libraries without a build step** — Use `"nodenext"` so your imports match what Node.js expects at runtime.
- **Deno or Bun projects** — These runtimes have their own resolution rules; check their TypeScript documentation.

```json
{
  "compilerOptions": {
    "moduleResolution": "nodenext",
    "module": "nodenext"
  }
}
```

For the vast majority of frontend and full-stack projects, the new bundler default is the correct choice and eliminates a common source of configuration confusion.
