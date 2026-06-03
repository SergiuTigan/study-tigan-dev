---
title: "resource()"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "signals"
moduleTitle: "Signals Deep Dive"
moduleDescription: "Master Angular signals: the reactive primitive that powers modern Angular applications."
lessonId: "angular-21/signals/resource"
duration: "12 min"
order: 205
moduleOrder: 2
lessonOrder: 5
color: "red"
---
# resource()

`resource()` is Angular's signal-based primitive for asynchronous data fetching. It wraps a `Promise` or `Observable` and exposes the result, loading state, and errors as signals.

## Basic Usage

```typescript
import { resource, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const userId = signal(1);

const userResource = resource({
  request: () => ({ id: userId() }),
  loader: async ({ request }) => {
    const response = await fetch(`/api/users/${request.id}`);
    return response.json();
  },
});
```

The `request` function defines the reactive parameters. Whenever `userId` changes, the loader re-executes automatically.

## Reading Resource State

A resource exposes several signals:

```typescript
userResource.value();    // The loaded data (or undefined)
userResource.status();   // ResourceStatus: Idle | Loading | Resolved | Error
userResource.error();    // The error (or undefined)
userResource.isLoading(); // boolean shorthand
```

In a template:

```html
@if (userResource.isLoading()) {
  <app-spinner />
} @else if (userResource.error(); as error) {
  <p>Error: {{ error.message }}</p>
} @else if (userResource.value(); as user) {
  <h2>{{ user.name }}</h2>
  <p>{{ user.email }}</p>
}
```

## Refresh and Cancel

You can manually trigger a reload or cancel an in-progress request:

```typescript
userResource.reload();  // Re-run the loader with the same request
userResource.destroy(); // Cancel and clean up
```

If the `request` signal changes while a previous load is still in progress, the previous request is automatically cancelled (for fetch-based loaders using AbortSignal).

## rxResource()

For RxJS-based loaders, use `rxResource()`:

```typescript
import { rxResource } from '@angular/core/rxjs-interop';

const userResource = rxResource({
  request: () => ({ id: userId() }),
  loader: ({ request }) => this.http.get(`/api/users/${request.id}`),
});
```

This returns an Observable-compatible resource that integrates with Angular's existing HTTP infrastructure and interceptors.
