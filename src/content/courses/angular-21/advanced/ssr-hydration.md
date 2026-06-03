---
title: "SSR & Hydration"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "advanced"
moduleTitle: "Advanced"
moduleDescription: "Deep dive into zoneless internals, accessibility, performance, and server-side rendering."
lessonId: "angular-21/advanced/ssr-hydration"
duration: "12 min"
order: 804
moduleOrder: 8
lessonOrder: 4
color: "red"
---
# SSR & Hydration

Server-Side Rendering (SSR) renders your Angular application on the server, sending fully formed HTML to the browser. Hydration then attaches Angular's interactivity to the existing DOM without re-rendering it.

## Enabling SSR

```bash
ng new my-app --ssr
# or add to existing project
ng add @angular/ssr
```

This generates a `server.ts` entry point and configures the build to produce both a browser and server bundle.

## How Hydration Works

Without hydration, Angular SSR would:
1. Send rendered HTML from the server
2. The browser displays it (fast first paint)
3. Angular bootstraps and re-renders everything from scratch (flash of content)

With hydration, Angular:
1. Sends rendered HTML with serialized state
2. The browser displays it
3. Angular attaches event listeners to the existing DOM nodes without re-creating them

```typescript
// app.config.server.ts
import { provideClientHydration } from '@angular/platform-browser';

export const serverConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
  ],
};
```

## Incremental Hydration

Angular 21 supports incremental hydration, where parts of the page hydrate on demand:

```html
@defer (hydrate on viewport) {
  <app-comments />
}

@defer (hydrate on interaction) {
  <app-interactive-widget />
}
```

Components are rendered on the server as HTML but only hydrated (made interactive) when the trigger condition is met. This provides the performance of static HTML with on-demand interactivity.

## SSR-Safe Code

Some browser APIs are not available on the server. Use platform checks:

```typescript
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

export class StorageService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getItem(key: string): string | null {
    return this.isBrowser ? localStorage.getItem(key) : null;
  }
}
```

Alternatively, use `afterNextRender()` for browser-only initialization code, which automatically skips execution on the server.

## Benefits

- **Faster First Contentful Paint:** Users see content immediately.
- **SEO:** Search engines index the fully rendered HTML.
- **Social sharing:** Meta tags and Open Graph data are available in the initial HTML.
- **Perceived performance:** The app feels instant even on slow connections.
