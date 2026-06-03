---
title: "effect()"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "signals"
moduleTitle: "Signals Deep Dive"
moduleDescription: "Master Angular signals: the reactive primitive that powers modern Angular applications."
lessonId: "angular-21/signals/effect"
duration: "12 min"
order: 203
moduleOrder: 2
lessonOrder: 3
color: "red"
---
# effect()

Effects run side effects in response to signal changes. They are the escape hatch for when you need to synchronize signal state with something outside Angular's reactive graph, such as localStorage, logging, or third-party libraries.

## Creating an Effect

```typescript
import { signal, effect } from '@angular/core';

const theme = signal('light');

effect(() => {
  document.body.classList.toggle('dark', theme() === 'dark');
  console.log('Theme changed to:', theme());
});
```

The effect function runs once immediately, and then re-runs whenever any signal it reads changes. Like `computed()`, dependency tracking is automatic.

## Effect Cleanup

Effects can return a cleanup function that runs before the next execution and when the effect is destroyed:

```typescript
effect((onCleanup) => {
  const id = setInterval(() => tick(), interval());

  onCleanup(() => clearInterval(id));
});
```

This pattern is essential for managing subscriptions, timers, and event listeners.

## When to Use Effects

Effects should be used sparingly. The Angular team recommends these use cases:

- Logging and analytics
- Synchronizing with `localStorage` or `sessionStorage`
- Integrating with non-Angular DOM APIs (e.g., D3, Google Maps)
- Custom rendering outside Angular's template system

Avoid using effects to set other signals -- use `computed()` instead. If you find yourself writing `effect(() => { someSignal.set(...) })`, it is usually a sign that a `computed()` or `linkedSignal()` would be more appropriate.

## Injection Context

Effects must be created in an injection context (inside a constructor, a field initializer, or within `runInInjectionContext()`):

```typescript
@Component({ ... })
export class MyComponent {
  private theme = signal('light');

  // Field initializer -- has injection context
  private themeEffect = effect(() => {
    document.body.className = this.theme();
  });
}
```

The effect is automatically cleaned up when the component is destroyed.
