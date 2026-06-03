---
title: "Conditional Types"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "type-system"
moduleTitle: "Type System"
moduleDescription: "Master the refined type system with improved inference, narrowing, and discriminated unions."
lessonId: "typescript-6/type-system/conditional-types"
duration: "10 min"
order: 205
moduleOrder: 2
lessonOrder: 5
color: "blue"
---
# Conditional Types

Conditional types let you express type-level logic using a syntax similar to the ternary operator. They are the `if`/`else` of the TypeScript type system.

## Basic Syntax

A conditional type follows the pattern `T extends U ? X : Y`:

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<42>;      // false
```

The condition `T extends U` checks if `T` is assignable to `U`. If so, the type resolves to `X`; otherwise, it resolves to `Y`.

## The `infer` Keyword

The `infer` keyword declares a type variable within a conditional type that TypeScript infers from the structure of the checked type:

```typescript
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;

type A = ReturnOf<() => string>;         // string
type B = ReturnOf<(x: number) => boolean>; // boolean
type C = ReturnOf<string>;                // never
```

You can use `infer` to extract types from any structural position:

```typescript
type ElementOf<T> = T extends (infer E)[] ? E : never;

type X = ElementOf<string[]>;   // string
type Y = ElementOf<number[]>;   // number
type Z = ElementOf<boolean>;    // never
```

```typescript
type UnwrapPromise<T> = T extends Promise<infer V> ? V : T;

type A = UnwrapPromise<Promise<string>>; // string
type B = UnwrapPromise<number>;          // number
```

## Distributive Conditional Types

When a conditional type acts on a **naked type parameter** that is a union, it distributes over each member of the union:

```typescript
type ToArray<T> = T extends any ? T[] : never;

type Distributed = ToArray<string | number>;
// string[] | number[]  (NOT (string | number)[])
```

Each member of the union is evaluated independently. This is the default behavior and it is extremely useful for mapping over unions.

To prevent distribution, wrap both sides in a tuple:

```typescript
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type NonDistributed = ToArrayNonDist<string | number>;
// (string | number)[]
```

## Practical Utilities

### Exclude and Extract

The built-in `Exclude` and `Extract` types are conditional types:

```typescript
// Built-in definitions:
type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;

type Numbers = Extract<string | number | boolean, number>;  // number
type WithoutNull = Exclude<string | null | undefined, null | undefined>; // string
```

### Deep Readonly

```typescript
type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

interface Config {
  db: { host: string; port: number };
  debug: boolean;
}

type FrozenConfig = DeepReadonly<Config>;
// { readonly db: { readonly host: string; readonly port: number }; readonly debug: boolean }
```

### Flatten Union of Arrays

```typescript
type Flatten<T> = T extends (infer E)[] ? E : T;

type Flat = Flatten<string[] | number[] | boolean>;
// string | number | boolean
```

### Conditional Return Types

```typescript
function process<T extends string | number>(
  value: T
): T extends string ? string[] : number[] {
  if (typeof value === 'string') {
    return value.split('') as any;
  }
  return [value, value * 2] as any;
}

const strings = process('hello');  // string[]
const numbers = process(42);       // number[]
```

Note: The implementation requires a type assertion (`as any`) because TypeScript cannot narrow generic conditional return types inside the function body. This is a known limitation.

## Combining Conditional Types

Conditional types compose naturally. You can chain them, nest them, and combine them with mapped types, template literal types, and recursive types to express sophisticated type transformations:

```typescript
type NonNullableDeep<T> = T extends object
  ? { [K in keyof T]: NonNullableDeep<NonNullable<T[K]>> }
  : NonNullable<T>;
```

Conditional types are the backbone of advanced TypeScript. Understanding them unlocks the ability to write type-safe libraries, validated APIs, and self-documenting code.
