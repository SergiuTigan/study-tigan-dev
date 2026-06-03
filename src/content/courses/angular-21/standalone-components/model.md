---
title: "model()"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "standalone-components"
moduleTitle: "Standalone Components"
moduleDescription: "Build components with the latest signal-based APIs for inputs, outputs, queries, and lifecycle."
lessonId: "angular-21/standalone-components/model"
duration: "10 min"
order: 302
moduleOrder: 3
lessonOrder: 2
color: "red"
---
# model()

`model()` creates a two-way bindable signal. It combines an input and an output into a single API, enabling Angular's `[()]` banana-in-a-box syntax with signals.

## Basic Usage

```typescript
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-toggle',
  template: `
    <button (click)="checked.set(!checked())">
      {{ checked() ? 'ON' : 'OFF' }}
    </button>
  `,
})
export class ToggleComponent {
  checked = model(false);
}
```

The parent component uses two-way binding:

```html
<app-toggle [(checked)]="isEnabled" />
```

When the child calls `checked.set(true)`, it updates both the internal state and emits the new value to the parent via the implicit `checkedChange` output.

## Required Models

Like inputs, models can be required:

```typescript
value = model.required<string>();
```

## How It Works Under the Hood

A `model()` creates:
1. A signal input (so the parent can pass a value down)
2. An implicit output named `{property}Change` (so the parent receives updates)
3. A writable signal (so the child component can call `.set()` or `.update()`)

This means the parent can also listen to changes explicitly:

```html
<app-toggle [checked]="isEnabled" (checkedChange)="onToggle($event)" />
```

## Building Custom Form Controls

`model()` is ideal for building reusable form-like components:

```typescript
@Component({
  selector: 'app-rating',
  template: `
    @for (star of stars; track star) {
      <span
        [class.filled]="star <= value()"
        (click)="value.set(star)"
      >★</span>
    }
  `,
})
export class RatingComponent {
  value = model(0);
  max = input(5);
  stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));
}
```

Usage: `<app-rating [(value)]="userRating" [max]="10" />`
