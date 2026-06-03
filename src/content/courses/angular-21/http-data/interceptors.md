---
title: "Interceptors"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "http-data"
moduleTitle: "HTTP & Data"
moduleDescription: "Fetch, cache, and manage data with httpResource(), interceptors, and modern patterns."
lessonId: "angular-21/http-data/interceptors"
duration: "10 min"
order: 602
moduleOrder: 6
lessonOrder: 2
color: "red"
---
# Interceptors

Angular 21 uses functional interceptors to inspect and transform HTTP requests and responses. They are registered as provider functions and execute in order.

## Creating an Interceptor

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }

  return next(req);
};
```

## Registering Interceptors

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, loggingInterceptor, retryInterceptor]),
    ),
  ],
};
```

Interceptors execute in the order they are listed.

## Logging Interceptor

```typescript
import { tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = performance.now();
  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          const elapsed = performance.now() - started;
          console.log(`${req.method} ${req.url} - ${elapsed.toFixed(0)}ms`);
        }
      },
      error: (err) => {
        console.error(`${req.method} ${req.url} - ERROR`, err);
      },
    }),
  );
};
```

## Retry Interceptor

```typescript
import { retry, timer } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    retry({
      count: 3,
      delay: (error, retryCount) => {
        if (error.status === 429 || error.status >= 500) {
          return timer(retryCount * 1000);
        }
        throw error;
      },
    }),
  );
};
```

Functional interceptors are more composable and tree-shakable than the older class-based `HTTP_INTERCEPTORS` token approach.
