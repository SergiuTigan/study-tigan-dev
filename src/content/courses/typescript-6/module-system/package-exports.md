---
title: "Package.json Exports"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "module-system"
moduleTitle: "Module System"
moduleDescription: "Modern module resolution with subpath imports, ESM-first architecture, and package.json exports."
lessonId: "typescript-6/module-system/package-exports"
duration: "8 min"
order: 403
moduleOrder: 4
lessonOrder: 3
color: "blue"
---
# Package.json Exports

The `exports` field in `package.json` is the modern way to define your package's public API. It controls what consumers can import from your package, supports conditional loading, and enables TypeScript to resolve types correctly.

## Basic Exports Configuration

A simple library might expose a single entry point:

```json
{
  "name": "my-utils",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

The `"types"` condition must come first. TypeScript uses it to find the type declarations. The `"import"` condition is used when consumers use ESM `import`, and `"require"` is used for CommonJS `require()` calls.

## Subpath Exports

You can expose multiple entry points from a single package:

```json
{
  "name": "my-utils",
  "exports": {
    ".": "./dist/index.js",
    "./math": {
      "types": "./dist/math/index.d.ts",
      "import": "./dist/math/index.js"
    },
    "./string": {
      "types": "./dist/string/index.d.ts",
      "import": "./dist/string/index.js"
    }
  }
}
```

Consumers can now import specific subpaths:

```typescript
import { add } from 'my-utils/math';
import { capitalize } from 'my-utils/string';
```

Any path **not** listed in `exports` is inaccessible. This means consumers cannot reach into `my-utils/dist/internal/secret.js` -- the `exports` field acts as an encapsulation boundary.

## Subpath Patterns

For packages with many files to expose, use wildcard patterns:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./components/*": {
      "types": "./dist/components/*.d.ts",
      "import": "./dist/components/*.js"
    }
  }
}
```

This allows:

```typescript
import { Button } from 'my-utils/components/Button';
import { Modal } from 'my-utils/components/Modal';
```

## Conditional Exports

Conditions can target different environments:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "node": {
        "import": "./dist/node/index.js",
        "require": "./dist/node/index.cjs"
      },
      "browser": "./dist/browser/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

Node.js recognizes conditions like `node`, `import`, `require`, and `default`. Bundlers may support additional conditions like `browser`, `development`, and `production`.

## TypeScript Configuration for Exports

When consuming packages that use `exports`, make sure your `tsconfig.json` has a compatible `moduleResolution`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

Both `bundler` and `nodenext` respect the `exports` field. The older `node` resolution (also called `node10`) does **not** -- it falls back to `main` and `types` fields only.

## Best Practices

- Always put `"types"` first in each condition block.
- Use `"default"` as the last fallback condition.
- Test your package with both ESM and CJS consumers.
- Use tools like `publint` and `arethetypeswrong` to validate your configuration.
