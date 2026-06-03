---
title: "Strict by Default"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "new-defaults"
moduleTitle: "New Defaults"
moduleDescription: "TypeScript 6 ships with strict mode, ES2025 target, and bundler resolution as defaults — learn what changed and why."
lessonId: "typescript-6/new-defaults/strict-default"
duration: "10 min"
order: 101
moduleOrder: 1
lessonOrder: 1
color: "blue"
---
# Strict by Default

TypeScript 6 makes `strict: true` the default for every new project. Previously, you had to opt in to strict mode explicitly in your `tsconfig.json`. Now, strict checking is active unless you explicitly disable it.

## What `strict` Enables

The `strict` flag is a shorthand that activates a collection of type-checking flags:

```json
{
  "compilerOptions": {
    "strict": true
    // This implicitly enables:
    // "strictNullChecks": true,
    // "strictFunctionTypes": true,
    // "strictBindCallApply": true,
    // "strictPropertyInitialization": true,
    // "noImplicitAny": true,
    // "noImplicitThis": true,
    // "alwaysStrict": true,
    // "useUnknownInCatchVariables": true
  }
}
```

Each of these flags addresses a specific category of potential bugs. Together, they form the backbone of safe TypeScript development.

## Impact on New Projects

When you run `tsc --init` in TypeScript 6, the generated `tsconfig.json` no longer includes a `strict` field at all, because the default is already `true`. A minimal config looks like this:

```json
{
  "compilerOptions": {
    "target": "ES2025",
    "module": "nodenext"
  }
}
```

This means new projects are strict from the very first line of code you write. There is no "easy mode" to grow out of later.

## Impact on Existing Projects

If your existing project already has `strict: true`, nothing changes. If your project relies on non-strict behavior, upgrading to TypeScript 6 will introduce errors unless you explicitly opt out:

```json
{
  "compilerOptions": {
    "strict": false
  }
}
```

You can also disable individual flags while keeping the rest of strict mode active:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictPropertyInitialization": false
  }
}
```

## Migration Tips

If you are migrating a large codebase that was not strict, consider an incremental approach:

1. **Enable strict mode project-wide** and count the errors.
2. **Fix the most common categories first.** `noImplicitAny` errors are usually the easiest — add explicit types to function parameters.
3. **Use `strictNullChecks` fixups** to handle `null` and `undefined` properly. The optional chaining operator (`?.`) and nullish coalescing (`??`) make this manageable.
4. **Address `strictPropertyInitialization`** by using definite assignment assertions (`!`) sparingly or by initializing properties in the constructor.

```typescript
// Before (non-strict)
function greet(name) {
  return "Hello, " + name.toUpperCase();
}

// After (strict — parameter needs a type)
function greet(name: string): string {
  return "Hello, " + name.toUpperCase();
}
```

Strict mode catches real bugs. The short-term cost of fixing type errors pays off in long-term reliability and maintainability.
