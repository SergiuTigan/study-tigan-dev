---
title: "Subpath Imports"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "module-system"
moduleTitle: "Module System"
moduleDescription: "Modern module resolution with subpath imports, ESM-first architecture, and package.json exports."
lessonId: "typescript-6/module-system/subpath-imports"
duration: "8 min"
order: 401
moduleOrder: 4
lessonOrder: 1
color: "blue"
---
# Subpath Imports

Relative import paths like `../../../utils/logger` are a maintenance nightmare. TypeScript 6 embraces Node.js subpath imports as a first-class solution to this problem. Subpath imports use the `#` prefix and are configured directly in your `package.json`.

## Why Not Path Aliases?

The traditional TypeScript approach was to configure `paths` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

This works at compile time, but the `paths` mapping is **not emitted** into the output JavaScript. You need additional tooling (like `tsconfig-paths` or bundler configuration) to make it work at runtime. Subpath imports solve this because they are part of the Node.js resolution algorithm itself.

## Configuring Subpath Imports

Add an `imports` field to your `package.json`:

```json
{
  "name": "my-app",
  "type": "module",
  "imports": {
    "#utils/*": "./src/utils/*",
    "#components/*": "./src/components/*",
    "#config": "./src/config/index.js",
    "#db": {
      "development": "./src/db/sqlite.js",
      "production": "./src/db/postgres.js"
    }
  }
}
```

Now you can import using the `#` prefix:

```typescript
import { logger } from '#utils/logger';
import { Button } from '#components/Button';
import { dbConfig } from '#config';
```

## TypeScript Configuration

For TypeScript to understand these imports, set `moduleResolution` to `node16`, `nodenext`, or `bundler`:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext"
  }
}
```

TypeScript reads the `imports` field from `package.json` and resolves types accordingly. No additional `paths` configuration is needed.

## Benefits Over Relative Paths

- **Refactoring safety.** Moving a file does not break imports across the project because the mapping is centralized.
- **Runtime compatibility.** The `#` imports work natively in Node.js without any transform step.
- **Conditional resolution.** You can map the same import to different files based on conditions like `development` vs `production`.
- **Self-documenting.** A glance at `package.json` tells you every import alias available in the project.

## Important Constraints

Subpath imports must start with `#`. The name `#` alone is reserved. The mappings must point to relative paths starting with `./`. Unlike `paths` in `tsconfig.json`, these are resolved by the runtime, so the target files must actually exist at the mapped locations.
