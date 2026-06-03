---
title: "Utility Types Deep Dive"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "inference-utilities"
moduleTitle: "Inference & Utilities"
moduleDescription: "Leverage advanced type inference with NoInfer, satisfies, and the full utility type toolkit."
lessonId: "typescript-6/inference-utilities/utility-types"
duration: "10 min"
order: 503
moduleOrder: 5
lessonOrder: 3
color: "blue"
---
# Utility Types Deep Dive

TypeScript ships with a comprehensive set of utility types that transform existing types into new ones. Mastering these eliminates the need for redundant type definitions and keeps your codebase DRY.

## Object Type Utilities

### Partial<T> and Required<T>

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

// All properties become optional
type UserUpdate = Partial<User>;
// { id?: number; name?: string; email?: string; avatar?: string }

// All properties become required -- even avatar
type StrictUser = Required<User>;
// { id: number; name: string; email: string; avatar: string }
```

### Pick<T, K> and Omit<T, K>

```typescript
// Select specific properties
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: number; name: string }

// Remove specific properties
type UserWithoutId = Omit<User, 'id'>;
// { name: string; email: string; avatar?: string }
```

### Record<K, V>

```typescript
type Role = 'admin' | 'editor' | 'viewer';

const permissions: Record<Role, string[]> = {
  admin: ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
};
```

### Readonly<T>

```typescript
type FrozenUser = Readonly<User>;
// All properties are readonly

const user: FrozenUser = { id: 1, name: 'Ada', email: 'ada@example.com' };
// Error: Cannot assign to 'name' because it is a read-only property
user.name = 'Grace';
```

## Union Type Utilities

### Extract<T, U> and Exclude<T, U>

```typescript
type Event = 'click' | 'scroll' | 'mousemove' | 'keydown' | 'keyup';

// Keep only mouse-related events
type MouseEvent = Extract<Event, 'click' | 'scroll' | 'mousemove'>;
// 'click' | 'scroll' | 'mousemove'

// Remove keyboard events
type NonKeyboardEvent = Exclude<Event, 'keydown' | 'keyup'>;
// 'click' | 'scroll' | 'mousemove'
```

### NonNullable<T>

```typescript
type MaybeUser = User | null | undefined;

type DefiniteUser = NonNullable<MaybeUser>;
// User
```

## Function Type Utilities

### ReturnType<T> and Parameters<T>

```typescript
function createOrder(product: string, quantity: number, price: number) {
  return {
    product,
    quantity,
    total: quantity * price,
    createdAt: new Date(),
  };
}

type Order = ReturnType<typeof createOrder>;
// { product: string; quantity: number; total: number; createdAt: Date }

type OrderParams = Parameters<typeof createOrder>;
// [product: string, quantity: number, price: number]
```

### ConstructorParameters<T>

```typescript
class HttpClient {
  constructor(baseUrl: string, timeout: number) {}
}

type ClientArgs = ConstructorParameters<typeof HttpClient>;
// [baseUrl: string, timeout: number]
```

### Awaited<T>

```typescript
type AsyncResult = Promise<Promise<string>>;

type Resolved = Awaited<AsyncResult>;
// string -- unwraps all layers of Promise
```

## String Utilities

```typescript
type Greeting = 'hello world';

type Upper = Uppercase<Greeting>;    // 'HELLO WORLD'
type Lower = Lowercase<Greeting>;    // 'hello world'
type Cap   = Capitalize<Greeting>;   // 'Hello world'
type Uncap = Uncapitalize<'Hello'>;  // 'hello'
```

## Composing Utility Types

The real power comes from combining them:

```typescript
// A type for updating a user: all fields optional except id which is required
type UserPatch = Partial<Omit<User, 'id'>> & Pick<User, 'id'>;

// A read-only version of a subset of user fields
type UserCard = Readonly<Pick<User, 'name' | 'avatar'>>;

// Extract function types from a mixed union
type Fn = Extract<string | number | (() => void) | ((x: number) => string), Function>;
// (() => void) | ((x: number) => string)
```

These compositions let you derive precise types from existing ones without duplicating definitions.
