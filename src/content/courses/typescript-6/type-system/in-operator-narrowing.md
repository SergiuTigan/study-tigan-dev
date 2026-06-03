---
title: "In-Operator Narrowing"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "type-system"
moduleTitle: "Type System"
moduleDescription: "Master the refined type system with improved inference, narrowing, and discriminated unions."
lessonId: "typescript-6/type-system/in-operator-narrowing"
duration: "8 min"
order: 202
moduleOrder: 2
lessonOrder: 2
color: "blue"
---
# In-Operator Narrowing

The `in` operator is one of the most practical tools for narrowing union types in TypeScript. TypeScript 6 improves how the compiler narrows types when you check for the existence of a property using `in`.

## Basic `in` Narrowing

The `in` operator checks whether an object has a property with the given name. TypeScript uses this check to narrow union types:

```typescript
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ('swim' in animal) {
    animal.swim();  // TypeScript knows this is Fish
  } else {
    animal.fly();   // TypeScript knows this is Bird
  }
}
```

## Narrowing with Optional Properties

TypeScript 6 handles optional properties more precisely. The `in` check now correctly narrows even when some union members have the property as optional:

```typescript
type Admin = {
  role: 'admin';
  permissions: string[];
};

type Guest = {
  role: 'guest';
  permissions?: undefined;
};

function checkAccess(user: Admin | Guest) {
  if ('permissions' in user && user.permissions) {
    // TypeScript 6 narrows to Admin here
    console.log(user.permissions.join(', '));
  }
}
```

## Using `in` as a Type Guard

You can use the `in` operator inside custom type guard functions for reusable narrowing logic:

```typescript
interface HttpError {
  status: number;
  message: string;
}

interface NetworkError {
  code: string;
  retryable: boolean;
}

function isHttpError(err: HttpError | NetworkError): err is HttpError {
  return 'status' in err;
}

function handleError(err: HttpError | NetworkError) {
  if (isHttpError(err)) {
    console.log(`HTTP ${err.status}: ${err.message}`);
  } else {
    console.log(`Network error ${err.code}, retryable: ${err.retryable}`);
  }
}
```

## Narrowing with `Record` Types

TypeScript 6 also improves narrowing for indexed types and record patterns:

```typescript
type StringMap = Record<string, string>;
type NumberMap = Record<string, number>;

function processMap(map: StringMap | NumberMap) {
  const value = map['key'];
  if (typeof value === 'string') {
    // Narrowed: value is string
    console.log(value.toUpperCase());
  } else {
    // Narrowed: value is number
    console.log(value.toFixed(2));
  }
}
```

## Practical Patterns

Combine `in` narrowing with other checks for robust runtime type discrimination:

```typescript
type ApiResponse =
  | { status: 'success'; data: unknown }
  | { status: 'error'; error: string }
  | { status: 'loading' };

function render(response: ApiResponse) {
  if ('data' in response) {
    renderData(response.data);  // narrowed to success
  } else if ('error' in response) {
    renderError(response.error);  // narrowed to error
  } else {
    renderSpinner();  // narrowed to loading
  }
}
```

The `in` operator is especially useful when you do not have a discriminant property (like `status`) and need to rely on structural differences between types.
