---
title: "ES2025 Target"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "new-defaults"
moduleTitle: "New Defaults"
moduleDescription: "TypeScript 6 ships with strict mode, ES2025 target, and bundler resolution as defaults — learn what changed and why."
lessonId: "typescript-6/new-defaults/es2025-target"
duration: "8 min"
order: 102
moduleOrder: 1
lessonOrder: 2
color: "blue"
---
# ES2025 Target

TypeScript 6 sets `target: "ES2025"` as the default compilation target. This means the compiler assumes your runtime supports all JavaScript features ratified through ECMAScript 2025, and it will emit modern syntax without down-leveling.

## What ES2025 Includes

The ES2025 specification finalizes several features that were previously at Stage 3 or Stage 4:

- **`Array.prototype.groupBy()` and `Map.groupBy()`** — Group array elements by a key function.
- **Set methods** — `union()`, `intersection()`, `difference()`, `symmetricDifference()`, `isSubsetOf()`, `isSupersetOf()`, `isDisjointFrom()`.
- **`Promise.withResolvers()`** — Create a promise alongside its resolve and reject functions.
- **RegExp v flag** — Unicode set notation for character classes.

## Using ES2025 Features

With the ES2025 target, you can use these features directly:

```typescript
// Array grouping
const inventory = [
  { name: 'asparagus', type: 'vegetable' },
  { name: 'banana', type: 'fruit' },
  { name: 'cherry', type: 'fruit' },
];

const grouped = Map.groupBy(inventory, (item) => item.type);
// Map { 'vegetable' => [{...}], 'fruit' => [{...}, {...}] }
```

```typescript
// Set methods
const frontend = new Set(['TypeScript', 'JavaScript', 'HTML', 'CSS']);
const backend = new Set(['TypeScript', 'JavaScript', 'Python', 'Go']);

const shared = frontend.intersection(backend);
// Set { 'TypeScript', 'JavaScript' }

const onlyFrontend = frontend.difference(backend);
// Set { 'HTML', 'CSS' }
```

```typescript
// Promise.withResolvers
const { promise, resolve, reject } = Promise.withResolvers<string>();

setTimeout(() => resolve('done'), 1000);

const result = await promise; // 'done'
```

## Output Differences

When targeting ES2025, the compiler will **not** downlevel:

- `async`/`await` (already ES2017)
- Class fields and private class members
- Top-level `await` (ES2022)
- `using` declarations (ES2025)

If you need to support older runtimes, you can lower the target:

```json
{
  "compilerOptions": {
    "target": "ES2020"
  }
}
```

But be aware that some ES2025 features cannot be polyfilled by the TypeScript compiler — you will need runtime polyfills for APIs like `Map.groupBy()` or Set methods.

## Why ES2025 Matters

By targeting the latest standard, TypeScript 6 produces smaller, faster output. There is no generator-based transform for `async`/`await`, no helper functions for class fields, and no synthetic `__spreadArray` calls. The emitted JavaScript is essentially what you wrote.
