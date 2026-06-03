---
title: "Zoneless Internals"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "advanced"
moduleTitle: "Advanced"
moduleDescription: "Deep dive into zoneless internals, accessibility, performance, and server-side rendering."
lessonId: "angular-21/advanced/zoneless"
duration: "14 min"
order: 801
moduleOrder: 8
lessonOrder: 1
color: "red"
---
# Zoneless Internals

Angular 21 supports running without Zone.js. Understanding how zoneless change detection works helps you write more efficient applications and debug performance issues.

## Enabling Zoneless Mode

```typescript
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
  ],
};
```

Remove Zone.js from your polyfills as well. This reduces bundle size by roughly 15KB gzipped.

## How Zone.js Worked

Previously, Zone.js monkey-patched browser APIs (`setTimeout`, `Promise.then`, `addEventListener`, etc.) to detect when async operations completed. After each async task, Angular ran change detection across the entire component tree.

This was simple but wasteful: every `setTimeout` or HTTP response triggered a full change detection cycle, even if no data changed.

## How Zoneless Works

Without Zone.js, Angular relies on explicit notifications. Change detection runs when:

1. **A signal changes** that is read in a template.
2. **`markForCheck()`** is called (for OnPush components).
3. **An event binding** fires (clicks, keypresses, etc. in templates).
4. **`ApplicationRef.tick()`** is called manually.

```typescript
@Component({
  template: `
    <p>{{ count() }}</p>
    <button (click)="increment()">+1</button>
  `,
})
export class CounterComponent {
  count = signal(0);

  increment(): void {
    this.count.update(n => n + 1);
    // Angular knows to re-render because:
    // 1. The click event binding triggers change detection
    // 2. The signal used in the template has changed
  }
}
```

## Common Pitfalls

Code that relied on Zone.js implicit detection needs updating:

```typescript
// This will NOT trigger change detection in zoneless mode:
constructor() {
  setTimeout(() => {
    this.title = 'Updated'; // Plain property, no signal
  }, 1000);
}

// Fix: use a signal
title = signal('Initial');
constructor() {
  setTimeout(() => {
    this.title.set('Updated'); // Signal notifies Angular
  }, 1000);
}
```

Zoneless mode makes your application faster and more predictable. Change detection only runs when data actually changes, not on every async event.
