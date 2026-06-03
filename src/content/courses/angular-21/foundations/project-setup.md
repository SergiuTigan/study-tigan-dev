---
title: "Project Setup & Tooling"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "foundations"
moduleTitle: "Foundations"
moduleDescription: "Understand the modern Angular landscape, project setup, application structure, and current best practices."
lessonId: "angular-21/foundations/project-setup"
duration: "10 min"
order: 102
moduleOrder: 1
lessonOrder: 2
color: "red"
---
# Project Setup & Tooling

Angular 21 uses the Angular CLI with Vite as the default build tool and esbuild for bundling. The development experience is significantly faster than the webpack-based builds of earlier Angular versions.

## Creating a New Project

```bash
npm install -g @angular/cli@21
ng new my-app
```

The CLI will prompt you for stylesheet format and SSR preferences. The generated project comes with:

- **Vite** as the dev server and build tool
- **esbuild** for production bundling
- **Vitest** as the default test runner (replacing Karma/Jasmine)
- **Standalone components** by default (no `app.module.ts`)

## Project Structure

A freshly scaffolded Angular 21 project looks like this:

```
my-app/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.css
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── tsconfig.json
├── package.json
└── vite.config.ts
```

Notice there is no `app.module.ts`. The application bootstrap happens in `main.ts` via `bootstrapApplication()`, and configuration is provided through `app.config.ts`.

## Key Configuration Files

The `app.config.ts` file is where you register providers, enable features, and configure the application:

```typescript
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

This functional configuration approach replaces the imperative `@NgModule({ imports: [...], providers: [...] })` pattern entirely.
