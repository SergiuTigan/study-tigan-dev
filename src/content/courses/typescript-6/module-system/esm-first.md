---
title: "ESM-First Architecture"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "module-system"
moduleTitle: "Module System"
moduleDescription: "Modern module resolution with subpath imports, ESM-first architecture, and package.json exports."
lessonId: "typescript-6/module-system/esm-first"
duration: "10 min"
order: 402
moduleOrder: 4
lessonOrder: 2
color: "blue"
---
# ESM-First Architecture

TypeScript 6 treats ECMAScript Modules (ESM) as the default module format. The ecosystem has shifted decisively toward ESM, and TypeScript now reflects that reality with first-class ESM support and clearer interop semantics for CommonJS.

## Setting Up ESM

The foundation of an ESM-first project is the `type` field in `package.json`:

```json
{
  "name": "my-library",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

With `"type": "module"`, all `.js` files in your package are treated as ESM. This changes how Node.js loads your code -- `import` and `export` work natively, and top-level `await` is available.

## File Extensions Matter

In ESM mode, TypeScript respects file extensions strictly:

| Extension | Meaning |
|-----------|---------|
| `.ts`     | ESM (when `type: "module"`) |
| `.mts`    | Always ESM, regardless of `type` |
| `.cts`    | Always CommonJS, regardless of `type` |
| `.js`     | ESM (when `type: "module"`) |
| `.mjs`    | Always ESM |
| `.cjs`    | Always CommonJS |

When using `node16` or `nodenext` module resolution, **you must include file extensions in your import paths**:

```typescript
// Correct -- note the .js extension even though the source is .ts
import { format } from './utils/format.js';

// Incorrect -- will fail at runtime in Node.js ESM
import { format } from './utils/format';
```

TypeScript resolves `./utils/format.js` to `./utils/format.ts` during compilation but emits the `.js` extension in the output so Node.js can find it.

## CommonJS Interop

When you need to consume a CommonJS module from ESM code, TypeScript handles the interop:

```typescript
// Default import from CJS module
import chalk from 'chalk';

// Named imports may work depending on the CJS module's shape
import { readFileSync } from 'node:fs';

// When named imports fail, use the default and destructure
import pkg from 'some-cjs-package';
const { helper } = pkg;
```

## The `verbatimModuleSyntax` Flag

TypeScript 6 encourages `verbatimModuleSyntax`, which enforces that your import syntax matches the module system:

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

With this flag, type-only imports must use the `type` keyword explicitly:

```typescript
// Correct with verbatimModuleSyntax
import type { User } from './models.js';
import { createUser, type Role } from './auth.js';

// Error -- importing a type without the type keyword
import { User } from './models.js';
```

This eliminates ambiguity about which imports are erased at runtime versus which have side effects that must be preserved.

## Migrating from CJS to ESM

The migration checklist:
1. Add `"type": "module"` to `package.json`
2. Set `"module": "nodenext"` in `tsconfig.json`
3. Add `.js` extensions to all relative imports
4. Convert any `require()` calls to `import` statements
5. Replace `__dirname` and `__filename` with `import.meta.url`
6. Enable `verbatimModuleSyntax` and add `type` to type-only imports
