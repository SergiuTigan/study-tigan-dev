---
title: "Functional Guards & Resolvers"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "routing"
moduleTitle: "Modern Routing"
moduleDescription: "Configure routing with lazy loading, functional guards, and component input binding."
lessonId: "angular-21/routing/guards-resolvers"
duration: "10 min"
order: 403
moduleOrder: 4
lessonOrder: 3
color: "red"
---
# Functional Guards & Resolvers

Angular 21 favors functional guards and resolvers over class-based ones. They are simpler, more composable, and tree-shakable.

## Functional Guards

```typescript
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
```

Usage in routes:

```typescript
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
  canActivate: [authGuard],
}
```

## Composing Guards

Since guards are just functions, composition is straightforward:

```typescript
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() && auth.hasRole('admin');
};

// Use multiple guards -- all must return true
{
  path: 'admin',
  canActivate: [authGuard, adminGuard],
}
```

## Functional Resolvers

Resolvers prefetch data before a route activates:

```typescript
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from './user.service';
import { User } from './user.model';

export const userResolver: ResolveFn<User> = (route) => {
  const userService = inject(UserService);
  return userService.getUser(route.paramMap.get('id')!);
};
```

Usage:

```typescript
{
  path: 'users/:id',
  loadComponent: () => import('./user-detail.component').then(m => m.UserDetailComponent),
  resolve: { user: userResolver },
}
```

With `withComponentInputBinding()`, the resolved data is automatically available as an input in the component.

## CanDeactivate Guards

Prevent users from leaving a page with unsaved changes:

```typescript
export const unsavedChangesGuard: CanDeactivateFn<{ hasUnsavedChanges: () => boolean }> = (component) => {
  return component.hasUnsavedChanges()
    ? confirm('You have unsaved changes. Leave anyway?')
    : true;
};
```
