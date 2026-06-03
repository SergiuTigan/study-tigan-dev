---
title: "computed()"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "signals"
moduleTitle: "Signals Deep Dive"
moduleDescription: "Master Angular signals: the reactive primitive that powers modern Angular applications."
lessonId: "angular-21/signals/computed"
duration: "10 min"
order: 202
moduleOrder: 2
lessonOrder: 2
color: "red"
---
# computed()

Computed signals derive their value from other signals. They are lazy, memoized, and automatically track their dependencies.

## Creating a Computed Signal

```typescript
import { signal, computed } from '@angular/core';

const firstName = signal('Ada');
const lastName = signal('Lovelace');

const fullName = computed(() => `${firstName()} ${lastName()}`);
```

When you read `fullName()`, Angular evaluates the computation function. The result is cached until one of the dependencies (`firstName` or `lastName`) changes.

## Lazy Evaluation

Computed signals are lazy. The computation does not run until something reads the signal. If the computed value is never read, the computation never executes. This is important for performance -- you can define many computed signals without paying any cost until they are actually needed.

```typescript
const expensiveResult = computed(() => {
  console.log('Computing...');
  return heavyCalculation(data());
});

// Nothing logged yet

console.log(expensiveResult()); // "Computing..." logged, result returned
console.log(expensiveResult()); // No log -- cached result returned
```

## Dependency Tracking

Angular automatically tracks which signals are read during the computation. You do not need to declare dependencies explicitly:

```typescript
const showFullName = signal(true);
const firstName = signal('Ada');
const lastName = signal('Lovelace');

const displayName = computed(() => {
  if (showFullName()) {
    return `${firstName()} ${lastName()}`;
  }
  return firstName();
});
```

When `showFullName()` is `false`, the computed signal only depends on `firstName`. Changing `lastName` will not trigger a recomputation. This dynamic dependency tracking is a key advantage of the signals model.

## Chaining Computeds

Computed signals can depend on other computed signals, forming a reactive graph:

```typescript
const price = signal(100);
const quantity = signal(3);
const subtotal = computed(() => price() * quantity());
const tax = computed(() => subtotal() * 0.2);
const total = computed(() => subtotal() + tax());
```

Angular ensures that when `price` changes, `subtotal`, `tax`, and `total` are all updated in the correct order with no glitches.
