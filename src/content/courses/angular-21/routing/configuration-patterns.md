---
title: "Route Configuration Patterns"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "routing"
moduleTitle: "Modern Routing"
moduleDescription: "Configure routing with lazy loading, functional guards, and component input binding."
lessonId: "angular-21/routing/configuration-patterns"
duration: "10 min"
order: 404
moduleOrder: 4
lessonOrder: 4
color: "red"
---
# Route Configuration Patterns

Well-structured routing is crucial for large Angular applications. This lesson covers patterns for organizing routes, handling layouts, and managing feature areas.

## Layout Routes

Use pathless routes for layout components that wrap child routes:

```typescript
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./home.component').then(m => m.HomeComponent) },
      { path: 'about', loadComponent: () => import('./about.component').then(m => m.AboutComponent) },
    ],
  },
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./register.component').then(m => m.RegisterComponent) },
    ],
  },
];
```

## Feature Route Files

Each feature area exports its own routes:

```typescript
// features/users/users.routes.ts
export const USER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./user-list.component').then(m => m.UserListComponent) },
  { path: ':id', loadComponent: () => import('./user-detail.component').then(m => m.UserDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./user-edit.component').then(m => m.UserEditComponent) },
];

// app.routes.ts
export const routes: Routes = [
  { path: 'users', loadChildren: () => import('./features/users/users.routes').then(m => m.USER_ROUTES) },
];
```

## Redirect Patterns

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'old-path', redirectTo: 'new-path' },
  { path: '**', loadComponent: () => import('./not-found.component').then(m => m.NotFoundComponent) },
];
```

## Route Title Strategy

Angular automatically sets the document title from route data:

```typescript
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
  title: 'Dashboard - My App',
}
```

For dynamic titles, use a resolver:

```typescript
{
  path: 'users/:id',
  title: (route) => `User ${route.paramMap.get('id')} - My App`,
}
```
