---
title: "signal() Basics"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "signals"
moduleTitle: "Signals Deep Dive"
moduleDescription: "Master Angular signals: the reactive primitive that powers modern Angular applications."
lessonId: "angular-21/signals/signal-basics"
duration: "10 min"
order: 201
moduleOrder: 2
lessonOrder: 1
color: "red"
---
# signal() Basics

Signals are reactive values that notify consumers when they change. They are the foundation of Angular's modern reactivity model, replacing Zone.js-based change detection for most use cases.

## Creating a Signal

```typescript
import { signal } from '@angular/core';

const count = signal(0);          // WritableSignal<number>
const name = signal('Angular');   // WritableSignal<string>
const items = signal<string[]>([]); // WritableSignal<string[]>
```

A signal holds a value and provides methods to read and update it.

## Reading a Signal

Signals are functions. Call them to read their current value:

```typescript
console.log(count());  // 0
console.log(name());   // 'Angular'
```

In templates, Angular automatically tracks signal reads and re-renders only the affected parts of the DOM:

```html
<p>Count: {{ count() }}</p>
<p>Name: {{ name() }}</p>
```

## Updating a Signal

There are three ways to update a writable signal:

```typescript
// .set() replaces the value
count.set(5);

// .update() derives the new value from the current one
count.update(current => current + 1);

// .update() is essential for immutable updates on objects/arrays
items.update(list => [...list, 'new item']);
```

## Equality

By default, signals use `Object.is()` to determine if a value has changed. You can provide a custom equality function:

```typescript
const user = signal(
  { name: 'Ada', age: 30 },
  { equal: (a, b) => a.name === b.name && a.age === b.age }
);
```

When the equality function returns `true`, dependents are not notified, preventing unnecessary re-renders.
