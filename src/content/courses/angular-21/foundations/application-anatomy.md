---
title: "Application Anatomy"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "foundations"
moduleTitle: "Foundations"
moduleDescription: "Understand the modern Angular landscape, project setup, application structure, and current best practices."
lessonId: "angular-21/foundations/application-anatomy"
duration: "10 min"
order: 103
moduleOrder: 1
lessonOrder: 3
color: "red"
---
# Application Anatomy

Understanding how an Angular 21 application bootstraps and renders is essential for building and debugging your apps. The process is simpler than in previous versions.

## The Bootstrap Process

Everything starts in `main.ts`:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

`bootstrapApplication()` takes a root component and an application configuration object. It creates the Angular platform, instantiates the root component, and kicks off the first round of change detection.

## Components Are the Building Blocks

In Angular 21, every component is standalone. A typical component looks like this:

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <h2>Count: {{ count() }}</h2>
    <button (click)="increment()">+1</button>
  `,
})
export class CounterComponent {
  count = signal(0);

  increment(): void {
    this.count.update(c => c + 1);
  }
}
```

There is no `standalone: true` because that is the default. There is no `imports` array needed unless the template uses other components, directives, or pipes.

## The Dependency Injection Tree

Angular builds a hierarchical injector tree starting from the root. Providers registered in `app.config.ts` are available throughout the application. Components can register their own providers to scope services to a subtree. The `inject()` function is the modern way to request dependencies:

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export class DataService {
  private http = inject(HttpClient);
}
```

This pattern replaces constructor injection and works in components, services, directives, pipes, and guards alike.
