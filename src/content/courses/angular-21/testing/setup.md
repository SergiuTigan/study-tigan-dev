---
title: "Setup & Configuration"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "testing"
moduleTitle: "Testing with Vitest"
moduleDescription: "Test Angular applications with Vitest, the modern test runner that replaced Karma."
lessonId: "angular-21/testing/setup"
duration: "8 min"
order: 701
moduleOrder: 7
lessonOrder: 1
color: "red"
---
# Setup & Configuration

Angular 21 uses Vitest as its default test runner, replacing the legacy Karma + Jasmine setup. Vitest is faster, supports modern ESM, and integrates seamlessly with the Vite-based build pipeline.

## Default Setup

New Angular 21 projects come with Vitest pre-configured. The relevant files are:

```typescript
// vite.config.ts (or vitest.config.ts)
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
  },
});
```

```typescript
// src/test-setup.ts
import '@analogjs/vite-plugin-angular/setup-vitest';
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run specific file
npm test -- src/app/services/auth.service.spec.ts

# Run with coverage
npm test -- --coverage
```

## Key Differences from Karma/Jasmine

Vitest uses a Jest-compatible API, but the functions are largely the same:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyService', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

The main differences:
- `spyOn` becomes `vi.spyOn`
- `jasmine.createSpy` becomes `vi.fn()`
- Tests run in Node with jsdom, not in a real browser
- Execution is significantly faster due to Vite's transform pipeline

## Angular Testing Utilities

The same Angular testing utilities (`TestBed`, `ComponentFixture`, etc.) work with Vitest:

```typescript
import { TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyComponent],
    });
  });
});
```
