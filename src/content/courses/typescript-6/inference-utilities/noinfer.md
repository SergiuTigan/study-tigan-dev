---
title: "NoInfer<T>"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "inference-utilities"
moduleTitle: "Inference & Utilities"
moduleDescription: "Leverage advanced type inference with NoInfer, satisfies, and the full utility type toolkit."
lessonId: "typescript-6/inference-utilities/noinfer"
duration: "8 min"
order: 501
moduleOrder: 5
lessonOrder: 1
color: "blue"
---
# NoInfer<T>

`NoInfer<T>` is a utility type that blocks TypeScript from using a particular type parameter position during type inference. It forces the compiler to infer the generic type from other positions in the function signature, preventing unwanted type widening.

## The Problem

Consider a function that creates a finite state machine:

```typescript
function createMachine<S extends string>(
  initialState: S,
  states: S[]
): { state: S } {
  return { state: initialState };
}

// TypeScript infers S as "idle" | "loading" | "error" | "unknown"
const machine = createMachine('idle', ['idle', 'loading', 'error', 'unknown']);
```

What if you want `initialState` to be constrained to only the values in `states`? Currently, TypeScript infers `S` from **both** parameters, so any string you pass as `initialState` is accepted as long as it appears somewhere.

The real issue shows up when you want to catch mistakes:

```typescript
// This should be an error, but TypeScript accepts it
// because "oops" becomes part of the inferred union
function createFSM<S extends string>(states: S[], initial: S): void {}

createFSM(['idle', 'loading'], 'oops');
// S is inferred as "idle" | "loading" | "oops" -- no error!
```

## The Solution: NoInfer

Wrap the parameter that should **not** contribute to inference:

```typescript
function createFSM<S extends string>(
  states: S[],
  initial: NoInfer<S>
): void {}

// Error: Argument of type '"oops"' is not assignable
// to parameter of type '"idle" | "loading"'
createFSM(['idle', 'loading'], 'oops');

// Works correctly
createFSM(['idle', 'loading'], 'idle');
```

Now TypeScript infers `S` only from the `states` array. The `initial` parameter must match one of those inferred values.

## Practical Use Cases

### Event System

```typescript
type EventMap = {
  click: { x: number; y: number };
  keydown: { key: string };
  scroll: { top: number };
};

function on<K extends keyof EventMap>(
  event: K,
  handler: (payload: NoInfer<EventMap[K]>) => void
): void {}

// TypeScript infers K from the event name only
on('click', (payload) => {
  // payload is correctly typed as { x: number; y: number }
  console.log(payload.x, payload.y);
});
```

### Default Values

```typescript
function withDefault<T>(
  values: T[],
  fallback: NoInfer<T>
): T {
  return values.length > 0 ? values[0] : fallback;
}

// Error: 0 is not assignable to type string
withDefault(['a', 'b'], 0);

// Correct
withDefault(['a', 'b'], 'default');
```

## How It Works

`NoInfer<T>` is an intrinsic type -- it is handled by the compiler directly. It does not change the type at all; `NoInfer<string>` is just `string`. Its only effect is during the inference phase: it tells TypeScript to skip that position when collecting candidates for the type parameter.

## When to Use NoInfer

Use `NoInfer` when:
- A function has multiple parameters sharing a generic type
- One parameter should define the type and others should be constrained by it
- You want to prevent inference from "polluting" the type with extra values
- Default or fallback values should match but not influence the inferred type
