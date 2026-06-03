---
title: "Caching Strategies"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "http-data"
moduleTitle: "HTTP & Data"
moduleDescription: "Fetch, cache, and manage data with httpResource(), interceptors, and modern patterns."
lessonId: "angular-21/http-data/caching"
duration: "10 min"
order: 603
moduleOrder: 6
lessonOrder: 3
color: "red"
---
# Caching Strategies

Effective caching reduces network requests and improves perceived performance. Angular provides several approaches to caching HTTP data.

## In-Memory Cache with a Service

```typescript
@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, { data: unknown; expiry: number }>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set(key: string, data: unknown, ttlMs: number = 60_000): void {
    this.cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

## Cache Interceptor

Apply caching transparently to all GET requests:

```typescript
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(CacheService);

  if (req.method !== 'GET') {
    return next(req);
  }

  const cached = cache.get(req.urlWithParams);
  if (cached) {
    return of(new HttpResponse({ body: cached, status: 200 }));
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(req.urlWithParams, event.body);
      }
    }),
  );
};
```

## Stale-While-Revalidate

This pattern returns cached data immediately and fetches fresh data in the background:

```typescript
const usersResource = httpResource<User[]>({
  url: '/api/users',
});

// Return cached value while loading fresh data
const users = computed(() => usersResource.value() ?? cachedUsers());
```

## Cache Invalidation Patterns

The hardest problem in computer science. Common strategies:

- **Time-based:** Cache entries expire after a TTL.
- **Event-based:** Invalidate when a mutation (POST/PUT/DELETE) succeeds.
- **Manual:** Expose a `reload()` method for user-triggered refresh.

Choose the right strategy based on how frequently your data changes and how stale your users can tolerate.
