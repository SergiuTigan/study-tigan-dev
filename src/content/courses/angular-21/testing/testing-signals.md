---
title: "Testing Signals"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "testing"
moduleTitle: "Testing with Vitest"
moduleDescription: "Test Angular applications with Vitest, the modern test runner that replaced Karma."
lessonId: "angular-21/testing/testing-signals"
duration: "10 min"
order: 704
moduleOrder: 7
lessonOrder: 4
color: "red"
---
# Testing Signals

Signals are synchronous reactive values, which makes them straightforward to test. However, there are specific patterns to be aware of when testing signal-based code.

## Testing Writable Signals

```typescript
import { signal, computed } from '@angular/core';

describe('Cart', () => {
  it('should compute total from items', () => {
    const items = signal([
      { name: 'Widget', price: 10, qty: 2 },
      { name: 'Gadget', price: 25, qty: 1 },
    ]);

    const total = computed(() =>
      items().reduce((sum, item) => sum + item.price * item.qty, 0)
    );

    expect(total()).toBe(45);

    items.update(list => [...list, { name: 'Doohickey', price: 5, qty: 3 }]);
    expect(total()).toBe(60);
  });
});
```

## Testing Effects

Effects require an injection context and run asynchronously. Use `TestBed` to provide the context:

```typescript
import { TestBed } from '@angular/core/testing';
import { effect, signal } from '@angular/core';

describe('effect', () => {
  it('should run when signal changes', () => {
    TestBed.configureTestingModule({});

    const name = signal('Alice');
    const log: string[] = [];

    TestBed.runInInjectionContext(() => {
      effect(() => {
        log.push(name());
      });
    });

    TestBed.flushEffects();
    expect(log).toEqual(['Alice']);

    name.set('Bob');
    TestBed.flushEffects();
    expect(log).toEqual(['Alice', 'Bob']);
  });
});
```

`TestBed.flushEffects()` synchronously executes pending effects, making them testable without async utilities.

## Testing Components with Signals

```typescript
it('should reactively update the view', () => {
  const fixture = TestBed.createComponent(CounterComponent);
  const component = fixture.componentInstance;

  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('0');

  component.count.set(5);
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('5');
});
```

## Testing resource()

```typescript
it('should load data via resource', async () => {
  const fixture = TestBed.createComponent(UserListComponent);
  fixture.detectChanges();

  // For httpResource, use HttpTestingController
  const httpTesting = TestBed.inject(HttpTestingController);
  httpTesting.expectOne('/api/users').flush([{ id: 1, name: 'Test' }]);

  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Test');
});
```

The key takeaway: signals are synchronous, so most signal tests do not require async utilities. Use `fixture.detectChanges()` to trigger Angular's change detection and `TestBed.flushEffects()` for effects.
