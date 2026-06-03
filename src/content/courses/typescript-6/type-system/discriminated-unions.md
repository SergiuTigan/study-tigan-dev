---
title: "Discriminated Unions Deep Dive"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "type-system"
moduleTitle: "Type System"
moduleDescription: "Master the refined type system with improved inference, narrowing, and discriminated unions."
lessonId: "typescript-6/type-system/discriminated-unions"
duration: "10 min"
order: 203
moduleOrder: 2
lessonOrder: 3
color: "blue"
---
# Discriminated Unions Deep Dive

Discriminated unions are one of the most powerful patterns in TypeScript. They combine union types with a shared literal property (the "discriminant") to enable safe, exhaustive pattern matching.

## The Pattern

A discriminated union has three parts:

1. A **common property** that exists on every member of the union (the discriminant).
2. A **literal type** for that property in each member.
3. **Type narrowing** using the discriminant value.

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return 0.5 * shape.base * shape.height;
  }
}
```

Inside each `case` branch, TypeScript knows the exact shape of the object.

## Exhaustiveness Checking

TypeScript can verify that you handle every member of a discriminated union. The classic technique uses the `never` type:

```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function describe(shape: Shape): string {
  switch (shape.kind) {
    case 'circle':
      return `Circle with radius ${shape.radius}`;
    case 'rectangle':
      return `Rectangle ${shape.width}x${shape.height}`;
    case 'triangle':
      return `Triangle with base ${shape.base}`;
    default:
      return assertNever(shape);
      // If you add a new shape kind and forget to handle it,
      // TypeScript will error here at compile time.
  }
}
```

TypeScript 6 also supports the `satisfies` operator for exhaustiveness in object mappings:

```typescript
const shapeLabels = {
  circle: 'Circle',
  rectangle: 'Rectangle',
  triangle: 'Triangle',
} satisfies Record<Shape['kind'], string>;
```

If you add a new kind to the `Shape` union, this `satisfies` check will produce a compile error until you add the corresponding entry.

## Real-World Patterns

### API Response Handling

```typescript
type ApiResult<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function renderResult<T>(result: ApiResult<T>, renderData: (data: T) => string): string {
  switch (result.status) {
    case 'idle':
      return 'Ready';
    case 'loading':
      return 'Loading...';
    case 'success':
      return renderData(result.data);
    case 'error':
      return `Error: ${result.error}`;
  }
}
```

### Action / Reducer Pattern

```typescript
type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; payload: number };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    case 'SET':
      return action.payload;
  }
}
```

### AST / Tree Node Pattern

```typescript
type Expr =
  | { type: 'literal'; value: number }
  | { type: 'add'; left: Expr; right: Expr }
  | { type: 'multiply'; left: Expr; right: Expr };

function evaluate(expr: Expr): number {
  switch (expr.type) {
    case 'literal':
      return expr.value;
    case 'add':
      return evaluate(expr.left) + evaluate(expr.right);
    case 'multiply':
      return evaluate(expr.left) * evaluate(expr.right);
  }
}
```

Discriminated unions are the preferred way to model "one of many" shapes in TypeScript. They are more type-safe than class hierarchies, more composable than interfaces, and they work naturally with pattern matching.
