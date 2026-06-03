---
title: "@defer & Performance"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "advanced"
moduleTitle: "Advanced"
moduleDescription: "Deep dive into zoneless internals, accessibility, performance, and server-side rendering."
lessonId: "angular-21/advanced/defer-performance"
duration: "12 min"
order: 803
moduleOrder: 8
lessonOrder: 3
color: "red"
---
# @defer & Performance

`@defer` is Angular's built-in lazy loading mechanism for template content. It lets you defer rendering of heavy components until they are needed, dramatically improving initial load performance.

## Basic Defer

```html
@defer {
  <app-heavy-chart [data]="chartData()" />
} @placeholder {
  <div class="skeleton">Loading chart...</div>
} @loading (minimum 500ms) {
  <app-spinner />
} @error {
  <p>Failed to load the chart component.</p>
}
```

The `@placeholder` content renders immediately. When the deferred block triggers, Angular lazy-loads the component, shows the `@loading` template, and finally swaps in the real content.

## Trigger Conditions

```html
<!-- Load when the element enters the viewport -->
@defer (on viewport) {
  <app-comments />
}

<!-- Load when the user interacts with a trigger -->
@defer (on interaction) {
  <app-emoji-picker />
} @placeholder {
  <button>Add emoji</button>
}

<!-- Load after a delay -->
@defer (on timer(3s)) {
  <app-analytics-widget />
}

<!-- Load when idle -->
@defer (on idle) {
  <app-recommendations />
}

<!-- Load when a condition is true -->
@defer (when showDetails()) {
  <app-details [item]="selectedItem()" />
}
```

## Prefetching

You can prefetch the component code before it is needed:

```html
@defer (on interaction; prefetch on idle) {
  <app-settings-panel />
} @placeholder {
  <button>Open Settings</button>
}
```

This prefetches the JavaScript bundle when the browser is idle, so the component loads instantly when the user clicks.

## Performance Budgets

Angular CLI supports performance budgets in `angular.json`:

```json
{
  "budgets": [
    { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
    { "type": "anyComponentStyle", "maximumWarning": "4kB" }
  ]
}
```

Combine `@defer` with performance budgets to keep your initial bundle small and your application fast.
