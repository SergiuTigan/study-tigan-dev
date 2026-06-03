---
title: "linkedSignal()"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "signals"
moduleTitle: "Signals Deep Dive"
moduleDescription: "Master Angular signals: the reactive primitive that powers modern Angular applications."
lessonId: "angular-21/signals/linked-signal"
duration: "10 min"
order: 204
moduleOrder: 2
lessonOrder: 4
color: "red"
---
# linkedSignal()

`linkedSignal()` creates a writable signal whose value is derived from other signals but can also be manually overridden. It bridges the gap between `computed()` (read-only, derived) and `signal()` (writable, independent).

## The Problem It Solves

Consider a component that displays a selected item from a list. When the list changes, the selection should reset. But the user can also change the selection manually:

```typescript
import { signal, linkedSignal } from '@angular/core';

const items = signal(['Apple', 'Banana', 'Cherry']);

// Resets to the first item whenever `items` changes,
// but can also be set manually
const selectedItem = linkedSignal(() => items()[0]);
```

## Reading and Writing

`linkedSignal()` returns a `WritableSignal`, so you can read and write it like any other signal:

```typescript
console.log(selectedItem()); // 'Apple'

selectedItem.set('Cherry');  // Manual override
console.log(selectedItem()); // 'Cherry'

items.set(['Date', 'Elderberry']); // Source changes
console.log(selectedItem()); // 'Date' -- reset by the linked computation
```

## Advanced Usage with Previous Value

The full form of `linkedSignal()` gives you access to the previous source and value, enabling more sophisticated reset logic:

```typescript
const page = linkedSignal({
  source: searchQuery,
  computation: (query, previous) => {
    // Only reset to page 1 if the query actually changed
    if (previous && previous.source === query) {
      return previous.value;
    }
    return 1;
  },
});
```

## Common Use Cases

- **Pagination:** Reset to page 1 when filters change but allow the user to navigate pages.
- **Form defaults:** Initialize a form field from data but allow edits.
- **Tab selection:** Default to the first tab when tabs change but let the user pick.

`linkedSignal()` eliminates the need for many `effect()` calls that were previously used to synchronize writable state with derived state.
