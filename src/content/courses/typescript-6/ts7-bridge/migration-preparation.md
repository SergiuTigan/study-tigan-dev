---
title: "Migration Preparation"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "ts7-bridge"
moduleTitle: "TS6\u2192TS7 Bridge"
moduleDescription: "Prepare for the future \u2014 understand the native Go compiler and what TypeScript 7 brings."
lessonId: "typescript-6/ts7-bridge/migration-preparation"
duration: "8 min"
order: 603
moduleOrder: 6
lessonOrder: 3
color: "blue"
---
# Migration Preparation

While TypeScript 7 aims for full behavioral compatibility with TypeScript 6, preparing your codebase now will make the transition smooth. This lesson covers what to do today to ensure you are ready.

## Enable Strict Mode

If you have not already, enable the full strict family of flags:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

The native compiler will enforce these flags identically. Code that passes strict checks in TS6 will pass in TS7. Code that relies on loose checking may behave differently in edge cases.

## Use Modern Module Resolution

Ensure your `moduleResolution` is set to a modern value:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext"
  }
}
```

Or for bundled applications:

```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

The legacy `"moduleResolution": "node"` (node10) is deprecated and may behave differently under the native compiler. Migrating now avoids surprises.

## Enable verbatimModuleSyntax

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

This flag ensures your import syntax is unambiguous. Type-only imports must be marked with `type`, and the compiler does not need to analyze whether an import is used as a value or type:

```typescript
// Explicit type imports
import type { User } from './models.js';
import { createUser, type Role } from './services.js';
```

The native compiler benefits from this explicitness because it simplifies the emit step.

## Audit Compiler API Usage

If your build pipeline uses the TypeScript compiler API programmatically, audit those usages:

```typescript
// This kind of code uses the JS compiler API directly
import ts from 'typescript';

const program = ts.createProgram({
  rootNames: ['./src/index.ts'],
  options: { strict: true },
});
const diagnostics = ts.getPreEmitDiagnostics(program);
```

The native Go compiler will provide a different programmatic API. If you use custom transformers, language service plugins, or tools that call `ts.createProgram()`, plan for updates.

### Common tools to audit:
- Custom webpack/Vite plugins that use the TS API
- `ts-morph` or `ts-node` usage
- Custom lint rules that traverse the AST via `typescript` package
- Code generation tools that use the compiler API

## Update Project References

If you use project references (monorepo setups), ensure they are clean:

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "references": [
    { "path": "../core" },
    { "path": "../shared" }
  ]
}
```

The native compiler's parallel architecture benefits significantly from well-structured project references. Each referenced project can be checked independently on a separate core.

## Run the Compatibility Checker

The TypeScript team is developing a compatibility checker that compares TS6 and TS7 output:

```bash
# Check for behavioral differences (when available)
npx tscompat check --project ./tsconfig.json
```

Run this tool on your codebase periodically as TS7 preview releases become available. It reports any differences in type errors, emitted JavaScript, or declaration files.

## Preparation Checklist

1. Enable `strict: true` and all additional strict flags
2. Use `nodenext` or `bundler` module resolution
3. Enable `verbatimModuleSyntax`
4. Add file extensions to all relative imports (if using `nodenext`)
5. Audit any direct usage of the TypeScript compiler API
6. Structure your monorepo with clean project references
7. Remove dependencies on deprecated compiler options
8. Test with TS7 preview releases as they become available
