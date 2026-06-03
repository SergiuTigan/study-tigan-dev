---
title: "Native Go Compiler"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "ts7-bridge"
moduleTitle: "TS6\u2192TS7 Bridge"
moduleDescription: "Prepare for the future \u2014 understand the native Go compiler and what TypeScript 7 brings."
lessonId: "typescript-6/ts7-bridge/native-compiler"
duration: "10 min"
order: 601
moduleOrder: 6
lessonOrder: 1
color: "blue"
---
# Native Go Compiler

The TypeScript team announced in March 2025 that TypeScript 7 will ship with a native compiler written in Go. This is the most significant architectural change in TypeScript's history. The current compiler, written in TypeScript itself, is being ported to Go for dramatic performance improvements.

## Why Go?

The decision to use Go was driven by several factors:

- **Performance.** Go compiles to native machine code and manages memory with a garbage collector optimized for low-latency workloads. The Go port targets a 10x speedup in type-checking and compilation.
- **Concurrency.** Go's goroutines and channels make it straightforward to parallelize type-checking across files, something that is difficult to retrofit into the current single-threaded JavaScript compiler.
- **Memory efficiency.** The Go compiler uses significantly less memory than the Node.js-based compiler, which matters for large monorepos with millions of lines of TypeScript.
- **Portability.** Go cross-compiles to every major platform without external dependencies. No more relying on Node.js being installed.

## What Changes for Users

For the vast majority of TypeScript users, the compiler change is transparent:

```bash
# Before (TypeScript 6)
npx tsc --build

# After (TypeScript 7) -- same command, native binary
npx tsc --build
```

The TypeScript team has committed to **behavioral compatibility**. The same source code should produce the same type errors and the same JavaScript output. The new compiler is not a rewrite of the type system -- it is a port of the existing logic from TypeScript to Go.

### What stays the same:
- The TypeScript language and syntax
- Type-checking behavior and error messages
- The `tsconfig.json` format and all compiler options
- The `.d.ts` declaration file format
- Integration with editors via the Language Server Protocol (LSP)

### What changes:
- **Startup time** drops from seconds to milliseconds
- **Full project type-checking** is 10x faster on benchmarks
- **Memory usage** drops significantly for large projects
- The compiler binary is a standalone executable, not a Node.js package
- Editor tooling (autocomplete, go-to-definition) becomes noticeably faster

## Timeline

The TypeScript team has published the following roadmap:

- **TypeScript 6.x** (current): The stable JavaScript-based compiler. This is what you should use in production today.
- **TypeScript 7.0 preview**: The native compiler reaches feature parity with the JS compiler and enters public preview.
- **TypeScript 7.0 stable**: The native compiler becomes the default.

The native compiler is being developed in the open at the TypeScript GitHub repository. You can follow progress, run benchmarks, and file issues.

## Impact on the Ecosystem

Build tools, linters, and editor extensions that shell out to `tsc` will benefit automatically. Tools that import TypeScript's API programmatically (like custom transformers or language service plugins) will need updates, as the Go compiler exposes a different programmatic interface.

The TypeScript team is working on compatibility layers, but some ecosystem tools will require migration effort. If your project relies on the TypeScript compiler API directly, start tracking the migration guides now.
