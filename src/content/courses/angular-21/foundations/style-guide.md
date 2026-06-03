---
title: "2025 Style Guide"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "foundations"
moduleTitle: "Foundations"
moduleDescription: "Understand the modern Angular landscape, project setup, application structure, and current best practices."
lessonId: "angular-21/foundations/style-guide"
duration: "8 min"
order: 104
moduleOrder: 1
lessonOrder: 4
color: "red"
---
# 2025 Style Guide

The Angular community style guide has evolved to reflect the new APIs and patterns. Following these conventions keeps your codebase consistent and aligned with the ecosystem.

## File Naming

The convention remains the same: `feature-name.type.ts`. For example:

- `user-profile.component.ts`
- `auth.service.ts`
- `admin.guard.ts`
- `user.model.ts`

## Component Conventions

Modern Angular components follow these guidelines:

```typescript
// Prefer signal-based state
count = signal(0);
name = input.required<string>();
clicked = output<void>();

// Prefer inject() over constructor injection
private router = inject(Router);
private userService = inject(UserService);

// Prefer computed() for derived state
fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
```

Key rules:
- Use `signal()` for component state, not class properties.
- Use `input()` and `output()` instead of `@Input()` and `@Output()` decorators.
- Use `inject()` instead of constructor parameters.
- Use `computed()` for any value derived from other signals.
- Keep components small and focused on a single responsibility.

## Folder Structure

Organize by feature, not by type:

```
src/app/
├── features/
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.routes.ts
│   │   └── widgets/
│   ├── users/
│   │   ├── user-list.component.ts
│   │   ├── user-detail.component.ts
│   │   └── user.service.ts
├── shared/
│   ├── ui/
│   └── utils/
└── core/
    ├── auth/
    └── http/
```

## RxJS Usage

RxJS is still valuable for event streams, WebSocket connections, and complex async orchestration. However, for simple component state and HTTP calls, signals and `httpResource()` are preferred. The rule of thumb: use signals for state, use RxJS for streams.
