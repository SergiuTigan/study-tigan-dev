---
title: "Testing Components"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "testing"
moduleTitle: "Testing with Vitest"
moduleDescription: "Test Angular applications with Vitest, the modern test runner that replaced Karma."
lessonId: "angular-21/testing/testing-components"
duration: "12 min"
order: 702
moduleOrder: 7
lessonOrder: 2
color: "red"
---
# Testing Components

Component testing in Angular 21 with Vitest follows the same patterns as before, but with signal-aware techniques.

## Basic Component Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { GreetingComponent } from './greeting.component';

describe('GreetingComponent', () => {
  let fixture: ComponentFixture<GreetingComponent>;
  let component: GreetingComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GreetingComponent],
    });
    fixture = TestBed.createComponent(GreetingComponent);
    component = fixture.componentInstance;
  });

  it('should display the greeting', () => {
    fixture.componentRef.setInput('name', 'Angular');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Hello, Angular!');
  });
});
```

## Testing Signal Inputs

Use `fixture.componentRef.setInput()` to set signal inputs from tests:

```typescript
it('should update when input changes', () => {
  fixture.componentRef.setInput('name', 'World');
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('World');

  fixture.componentRef.setInput('name', 'Angular');
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Angular');
});
```

## Testing Outputs

```typescript
it('should emit on button click', () => {
  const spy = vi.fn();
  component.clicked.subscribe(spy);

  const button = fixture.nativeElement.querySelector('button');
  button.click();

  expect(spy).toHaveBeenCalled();
});
```

## Testing with Dependencies

```typescript
describe('UserProfileComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        {
          provide: UserService,
          useValue: { getUser: vi.fn().mockReturnValue(of({ name: 'Test' })) },
        },
      ],
    });
  });
});
```

## Snapshot Testing

Vitest supports snapshot testing for component templates:

```typescript
it('should match snapshot', () => {
  fixture.componentRef.setInput('name', 'Angular');
  fixture.detectChanges();
  expect(fixture.nativeElement.innerHTML).toMatchSnapshot();
});
```
