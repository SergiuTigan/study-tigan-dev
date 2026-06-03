---
title: "Component Lifecycle"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "standalone-components"
moduleTitle: "Standalone Components"
moduleDescription: "Build components with the latest signal-based APIs for inputs, outputs, queries, and lifecycle."
lessonId: "angular-21/standalone-components/lifecycle"
duration: "10 min"
order: 305
moduleOrder: 3
lessonOrder: 5
color: "red"
---
# Component Lifecycle

Angular components go through a well-defined lifecycle from creation to destruction. Angular 21 introduces the `afterRender` and `afterNextRender` APIs alongside the classic lifecycle hooks.

## Classic Lifecycle Hooks

The traditional hooks still work and are implemented as interface methods:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({ ... })
export class MyComponent implements OnInit, OnDestroy {
  ngOnInit(): void {
    // Component initialized, inputs are set
  }

  ngOnDestroy(): void {
    // Component about to be destroyed
  }
}
```

The full lifecycle order is: `ngOnChanges` -> `ngOnInit` -> `ngDoCheck` -> `ngAfterContentInit` -> `ngAfterContentChecked` -> `ngAfterViewInit` -> `ngAfterViewChecked` -> `ngOnDestroy`.

## afterRender() and afterNextRender()

For DOM manipulation that needs to happen after Angular has rendered the view, use these new APIs:

```typescript
import { afterRender, afterNextRender, Component } from '@angular/core';

@Component({ ... })
export class ChartComponent {
  constructor() {
    // Runs after every render cycle
    afterRender(() => {
      this.updateChartDimensions();
    });

    // Runs once after the next render
    afterNextRender(() => {
      this.initializeThirdPartyLib();
    });
  }
}
```

These APIs are SSR-safe: they only run in the browser, never on the server.

## Lifecycle with Signals

With signals, many lifecycle hooks become unnecessary. For example, instead of `ngOnChanges` to react to input changes, use `computed()` or `effect()`:

```typescript
@Component({ ... })
export class UserCardComponent {
  userId = input.required<number>();

  // Replaces ngOnChanges for derived state
  userLabel = computed(() => `User #${this.userId()}`);

  // Replaces ngOnChanges for side effects
  private logEffect = effect(() => {
    console.log('User changed to:', this.userId());
  });
}
```

## DestroyRef

`DestroyRef` provides a way to register cleanup callbacks without implementing `OnDestroy`:

```typescript
import { DestroyRef, inject } from '@angular/core';

export class MyComponent {
  constructor() {
    const destroyRef = inject(DestroyRef);
    const sub = someObservable.subscribe(/* ... */);
    destroyRef.onDestroy(() => sub.unsubscribe());
  }
}
```

This is particularly useful in utility functions that need to register cleanup logic.
