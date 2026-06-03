---
title: "Error Handling"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "http-data"
moduleTitle: "HTTP & Data"
moduleDescription: "Fetch, cache, and manage data with httpResource(), interceptors, and modern patterns."
lessonId: "angular-21/http-data/error-handling"
duration: "10 min"
order: 604
moduleOrder: 6
lessonOrder: 4
color: "red"
---
# Error Handling

Robust error handling is essential for production applications. Angular 21 provides multiple layers for handling HTTP errors.

## Resource-Level Error Handling

`httpResource()` exposes error state as a signal:

```typescript
usersResource = httpResource<User[]>({ url: '/api/users' });

// In template
// @if (usersResource.error(); as error) {
//   <app-error-message [error]="error" />
// }
```

The `error()` signal contains the `HttpErrorResponse` object with status code, message, and body.

## Global Error Interceptor

Handle common error patterns across the entire application:

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          router.navigate(['/login']);
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('The requested resource was not found.');
          break;
        case 500:
          toast.error('An unexpected server error occurred.');
          break;
        case 0:
          toast.error('Network error. Please check your connection.');
          break;
      }
      return throwError(() => error);
    }),
  );
};
```

## Error Boundary Pattern

Create a reusable error boundary component:

```typescript
@Component({
  selector: 'app-error-boundary',
  template: `
    @if (error()) {
      <div class="error-container">
        <h3>Something went wrong</h3>
        <p>{{ error()!.message }}</p>
        <button (click)="retry.emit()">Try Again</button>
      </div>
    } @else {
      <ng-content />
    }
  `,
})
export class ErrorBoundaryComponent {
  error = input<HttpErrorResponse | null>(null);
  retry = output<void>();
}
```

## Typed Error Responses

Define interfaces for your API error responses:

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// In your error handler
const apiError = error.error as ApiError;
console.log(apiError.code, apiError.message);
```

Always handle errors gracefully. Users should see meaningful messages and have a path to recovery.
