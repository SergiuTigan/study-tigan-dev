---
title: "Testing Services"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "testing"
moduleTitle: "Testing with Vitest"
moduleDescription: "Test Angular applications with Vitest, the modern test runner that replaced Karma."
lessonId: "angular-21/testing/testing-services"
duration: "10 min"
order: 703
moduleOrder: 7
lessonOrder: 3
color: "red"
---
# Testing Services

Services contain business logic and data access. Testing them ensures your application logic works correctly, independent of the UI.

## Basic Service Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CounterService } from './counter.service';

describe('CounterService', () => {
  let service: CounterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CounterService);
  });

  it('should start at zero', () => {
    expect(service.count()).toBe(0);
  });

  it('should increment', () => {
    service.increment();
    expect(service.count()).toBe(1);
  });
});
```

## Testing HTTP Services

Use `provideHttpClientTesting` to mock HTTP requests:

```typescript
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('UserService', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should fetch users', () => {
    const mockUsers = [{ id: 1, name: 'Alice' }];

    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpTesting.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  afterEach(() => {
    httpTesting.verify(); // Ensure no unexpected requests
  });
});
```

## Testing Services with Dependencies

```typescript
describe('AuthService', () => {
  let service: AuthService;
  const mockRouter = { navigate: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should redirect to login on logout', () => {
    service.logout();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
```

Keep service tests focused and fast. Mock external dependencies and test the service's own logic, not the behavior of its dependencies.
