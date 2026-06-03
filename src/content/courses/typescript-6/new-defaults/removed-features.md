---
title: "Removed & Deprecated Features"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "new-defaults"
moduleTitle: "New Defaults"
moduleDescription: "TypeScript 6 ships with strict mode, ES2025 target, and bundler resolution as defaults — learn what changed and why."
lessonId: "typescript-6/new-defaults/removed-features"
duration: "10 min"
order: 104
moduleOrder: 1
lessonOrder: 4
color: "blue"
---
# Removed & Deprecated Features

TypeScript 6 takes the opportunity of a major version bump to remove long-deprecated features and clean up the compiler surface. Knowing what was removed helps you migrate smoothly.

## Removed Features

### 1. The `namespace` Keyword for Value Declarations

The `namespace` keyword used for organizing code into internal modules has been removed as a value-space construct. You can still use `namespace` for type-level declarations (declaration merging), but runtime namespace blocks are gone:

```typescript
// REMOVED — this no longer compiles
namespace MyApp {
  export function init() {}
}

// Use ES modules instead
export function init() {}
```

### 2. The `out` and `outDir` Combined with `outFile`

The `outFile` option, which concatenated output into a single file, has been removed. Modern bundlers handle bundling far more effectively. Use `outDir` to specify the output directory and let your bundler handle the rest:

```json
{
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### 3. Triple-Slash Directives for Module Resolution

Triple-slash reference directives like `/// <reference path="..." />` for module loading are no longer supported. Use `import` statements instead:

```typescript
// REMOVED
/// <reference path="./legacy-types.d.ts" />

// Use imports
import type { LegacyType } from './legacy-types';
```

Note: `/// <reference types="..." />` for global type augmentation still works.

### 4. `keyofStringsOnly` and `suppressImplicitAnyIndexErrors`

These compatibility flags have been removed entirely. Their behavior was already discouraged in TypeScript 5.x.

## Deprecated Patterns

These patterns still work in TypeScript 6 but emit deprecation warnings and will be removed in a future version:

### 1. `enum` with Computed Members

Enums with computed values are deprecated. Use `const` objects with `as const` instead:

```typescript
// Deprecated
enum Direction {
  Up = "UP".toLowerCase(),
}

// Preferred
const Direction = {
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
} as const;

type Direction = (typeof Direction)[keyof typeof Direction];
```

### 2. `import = require()` Syntax

The `import x = require('module')` syntax is deprecated in favor of standard ES module imports:

```typescript
// Deprecated
import fs = require('fs');

// Preferred
import fs from 'node:fs';
// or
import { readFileSync } from 'node:fs';
```

### 3. `declare global` in Non-Module Files

Using `declare global` in a script file (one without imports or exports) is deprecated. Add an empty export to make it a module:

```typescript
// Deprecated (script file with declare global)
declare global {
  interface Window {
    myFlag: boolean;
  }
}

// Preferred (module file)
export {};
declare global {
  interface Window {
    myFlag: boolean;
  }
}
```

## Migration Checklist

1. Search for `namespace` blocks used as runtime code and convert them to ES modules.
2. Remove any `outFile` usage from `tsconfig.json`.
3. Replace triple-slash reference path directives with `import` statements.
4. Replace `import = require()` with standard `import` syntax.
5. Convert computed enums to `as const` objects.
6. Run `tsc --noEmit` to verify your project compiles cleanly under TypeScript 6.
