---
title: "withComponentInputBinding()"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "routing"
moduleTitle: "Modern Routing"
moduleDescription: "Configure routing with lazy loading, functional guards, and component input binding."
lessonId: "angular-21/routing/input-binding"
duration: "8 min"
order: 402
moduleOrder: 4
lessonOrder: 2
color: "red"
---
# withComponentInputBinding()

`withComponentInputBinding()` automatically binds route parameters, query parameters, and data to component inputs. This eliminates the need to inject `ActivatedRoute` and subscribe to params.

## Setup

Enable it in your application configuration:

```typescript
import { provideRouter, withComponentInputBinding } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
  ],
};
```

## Route Parameters as Inputs

```typescript
// Route definition
{ path: 'users/:id', loadComponent: () => import('./user-detail.component').then(m => m.UserDetailComponent) }

// Component
@Component({ ... })
export class UserDetailComponent {
  // Automatically bound from :id route parameter
  id = input.required<string>();
}
```

The `id` input is automatically populated with the value from the URL. No `ActivatedRoute` injection needed.

## Query Parameters

Query parameters work the same way:

```typescript
// URL: /search?q=angular&page=2

@Component({ ... })
export class SearchComponent {
  q = input('');
  page = input('1');
}
```

## Route Data and Resolver Results

Static route data and resolver results are also bound:

```typescript
// Route
{
  path: 'admin',
  loadComponent: () => import('./admin.component').then(m => m.AdminComponent),
  data: { title: 'Admin Panel' },
  resolve: { user: userResolver },
}

// Component
@Component({ ... })
export class AdminComponent {
  title = input('');     // Bound from route data
  user = input<User>();  // Bound from resolver
}
```

## Binding Priority

When the same name exists in multiple sources, the binding priority is: route data > path params > query params. Be mindful of naming conflicts.
