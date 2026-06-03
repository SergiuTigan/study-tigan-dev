---
title: "Advanced Patterns"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "inference-utilities"
moduleTitle: "Inference & Utilities"
moduleDescription: "Leverage advanced type inference with NoInfer, satisfies, and the full utility type toolkit."
lessonId: "typescript-6/inference-utilities/advanced-patterns"
duration: "12 min"
order: 504
moduleOrder: 5
lessonOrder: 4
color: "blue"
---
# Advanced Patterns

This lesson covers powerful type-level patterns that solve real architectural problems: branded types for domain safety, the builder pattern for fluent APIs, type-safe event systems, and mapped types with key remapping.

## Branded Types

Branded types prevent mixing up values that share the same underlying type. A `UserId` and an `OrderId` are both strings, but they are not interchangeable:

```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

function createUserId(id: string): UserId {
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

function getUser(id: UserId): void {}

const userId = createUserId('user-123');
const orderId = createOrderId('order-456');

getUser(userId);   // OK
getUser(orderId);  // Error: OrderId is not assignable to UserId
```

The `__brand` property never exists at runtime -- it is a phantom type that only exists in the type system. This pattern is especially valuable for IDs, currency amounts, validated strings, and other domain primitives.

## Builder Pattern

The builder pattern uses method chaining with generics to accumulate type information:

```typescript
type QueryConfig<T = unknown, S = unknown> = {
  table: string;
  selected: S;
  where: Array<(row: T) => boolean>;
};

class QueryBuilder<T, S = {}> {
  private config: QueryConfig;

  constructor(table: string) {
    this.config = { table, selected: {} as S, where: [] };
  }

  select<K extends keyof T>(...keys: K[]): QueryBuilder<T, Pick<T, K>> {
    return this as unknown as QueryBuilder<T, Pick<T, K>>;
  }

  where(predicate: (row: T) => boolean): this {
    this.config.where.push(predicate);
    return this;
  }

  build(): QueryConfig<T, S> {
    return this.config as QueryConfig<T, S>;
  }
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const query = new QueryBuilder<Product>('products')
  .select('name', 'price')
  .where((p) => p.price > 10)
  .build();
// query.selected is Pick<Product, 'name' | 'price'>
```

Each `select` call narrows the return type, so the final `build()` returns a precisely typed configuration.

## Type-Safe Event System

```typescript
type EventMap = {
  userCreated: { id: string; name: string };
  orderPlaced: { orderId: string; total: number };
  error: { code: number; message: string };
};

class TypedEventEmitter<Events extends Record<string, unknown>> {
  private handlers = new Map<string, Set<Function>>();

  on<K extends keyof Events & string>(
    event: K,
    handler: (payload: Events[K]) => void
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof Events & string>(
    event: K,
    payload: Events[K]
  ): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}

const emitter = new TypedEventEmitter<EventMap>();

emitter.on('userCreated', (payload) => {
  // payload is { id: string; name: string }
  console.log(payload.name);
});

// Error: { wrong: true } is not assignable to { id: string; name: string }
emitter.emit('userCreated', { wrong: true });
```

## Mapped Types with Key Remapping

TypeScript lets you transform object types by remapping keys during mapping:

```typescript
// Create getter functions for each property
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }
```

### Filtering Keys with Remapping

Return `never` from the key position to remove properties:

```typescript
// Keep only string-valued properties
type StringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  email: string;
  active: boolean;
}

type OnlyStrings = StringProps<Mixed>;
// { name: string; email: string }
```

### Grouping with Mapped Types

```typescript
type GroupByType<T> = {
  strings: { [K in keyof T as T[K] extends string ? K : never]: T[K] };
  numbers: { [K in keyof T as T[K] extends number ? K : never]: T[K] };
  booleans: { [K in keyof T as T[K] extends boolean ? K : never]: T[K] };
};

type Grouped = GroupByType<Mixed>;
// {
//   strings: { name: string; email: string };
//   numbers: { age: number };
//   booleans: { active: boolean };
// }
```

These patterns compose together. You can brand the IDs in your event system, use mapped types to generate handler interfaces, and use the builder pattern to assemble type-safe queries. The type system becomes a tool for encoding your domain rules.
