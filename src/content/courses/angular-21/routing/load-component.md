---
title: "loadComponent()"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "routing"
moduleTitle: "Modern Routing"
moduleDescription: "Configure routing with lazy loading, functional guards, and component input binding."
lessonId: "angular-21/routing/load-component"
duration: "10 min"
order: 401
moduleOrder: 4
lessonOrder: 1
color: "red"
---
# loadComponent()

Lazy loading in Angular 21 is done at the component level using `loadComponent` in route definitions. This replaces the older `loadChildren` with NgModule approach.

## Basic Lazy Loading

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component')
      .then(m => m.SettingsComponent),
  },
];
```

Each route lazily loads a standalone component. The component (and its dependencies) are only downloaded when the user navigates to that route.

## Lazy Loading with Child Routes

For features with nested routes, use `loadChildren` with a routes file:

```typescript
export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES),
  },
];

// admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout.component')
      .then(m => m.AdminLayoutComponent),
    children: [
      { path: 'users', loadComponent: () => import('./users.component').then(m => m.UsersComponent) },
      { path: 'roles', loadComponent: () => import('./roles.component').then(m => m.RolesComponent) },
    ],
  },
];
```

## Default Exports Shorthand

If your component uses a default export, the syntax is even shorter:

```typescript
{
  path: 'profile',
  loadComponent: () => import('./profile.component'),
}
```

## Preloading Strategies

Angular provides preloading strategies to load lazy routes in the background after the initial page load:

```typescript
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
};
```

This ensures users experience instant navigation to lazy routes after the initial load.
