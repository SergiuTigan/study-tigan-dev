---
title: "httpResource()"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "http-data"
moduleTitle: "HTTP & Data"
moduleDescription: "Fetch, cache, and manage data with httpResource(), interceptors, and modern patterns."
lessonId: "angular-21/http-data/http-resource"
duration: "12 min"
order: 601
moduleOrder: 6
lessonOrder: 1
color: "red"
---
# httpResource()

`httpResource()` is a specialized version of `resource()` that uses Angular's `HttpClient` under the hood. It provides a declarative, signal-based API for HTTP data fetching with automatic caching and request cancellation.

## Basic Usage

```typescript
import { httpResource } from '@angular/common/http';
import { signal } from '@angular/core';

@Component({ ... })
export class UserListComponent {
  usersResource = httpResource<User[]>({
    url: '/api/users',
  });

  // Template usage
  // @if (usersResource.isLoading()) { <spinner /> }
  // @for (user of usersResource.value() ?? []; track user.id) { ... }
}
```

## Dynamic URLs with Reactive Parameters

```typescript
userId = input.required<string>();

userResource = httpResource<User>({
  url: () => `/api/users/${this.userId()}`,
});
```

When `userId` changes, the previous request is cancelled and a new one is issued. The resource automatically tracks the signal dependency.

## Request Configuration

```typescript
searchResource = httpResource<SearchResult[]>({
  url: '/api/search',
  method: 'POST',
  body: () => ({ query: this.searchTerm(), filters: this.filters() }),
  headers: { 'Content-Type': 'application/json' },
});
```

## Parsing and Transformation

Use the `parse` option to validate or transform the response:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

userResource = httpResource<User>({
  url: () => `/api/users/${this.userId()}`,
  parse: (data) => UserSchema.parse(data),
});
```

## Manual Refresh

```typescript
refreshUsers(): void {
  this.usersResource.reload();
}
```

`httpResource()` is the recommended way to fetch data in Angular 21 components. It eliminates boilerplate around loading states, error handling, and request lifecycle management.
