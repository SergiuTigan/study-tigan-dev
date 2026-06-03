---
title: "satisfies Operator"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "inference-utilities"
moduleTitle: "Inference & Utilities"
moduleDescription: "Leverage advanced type inference with NoInfer, satisfies, and the full utility type toolkit."
lessonId: "typescript-6/inference-utilities/satisfies-operator"
duration: "10 min"
order: 502
moduleOrder: 5
lessonOrder: 2
color: "blue"
---
# satisfies Operator

The `satisfies` operator validates that an expression matches a type without changing the inferred type of the expression. This gives you the best of both worlds: type safety from validation and precise types from inference.

## The Problem with Type Annotations

Consider a color palette configuration:

```typescript
type Color = string | { r: number; g: number; b: number };
type Palette = Record<string, Color>;

// Using a type annotation
const palette: Palette = {
  primary: '#ff0000',
  secondary: { r: 0, g: 255, b: 0 },
  accent: '#0000ff',
};

// Error: Property 'toUpperCase' does not exist on type 'Color'
palette.primary.toUpperCase();
```

The type annotation `Palette` widens every value to `Color` (which is `string | { r, g, b }`), so TypeScript loses track of which keys have string values and which have object values.

## The satisfies Solution

```typescript
const palette = {
  primary: '#ff0000',
  secondary: { r: 0, g: 255, b: 0 },
  accent: '#0000ff',
} satisfies Palette;

// Works -- TypeScript knows primary is a string
palette.primary.toUpperCase();

// Works -- TypeScript knows secondary is an object
palette.secondary.r;

// Error: Property 'unknown' does not exist
palette.unknown;
```

The `satisfies` operator checks that the object matches `Palette`, but the **inferred type** preserves the exact shape: `primary` is `string`, `secondary` is `{ r: number; g: number; b: number }`.

## Preserving Literal Types

```typescript
type Route = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
};

// With type annotation -- method is widened to the union
const route: Route = { path: '/users', method: 'GET' };
// route.method is 'GET' | 'POST' | 'PUT' | 'DELETE'

// With satisfies -- method stays as the literal 'GET'
const route2 = { path: '/users', method: 'GET' } satisfies Route;
// route2.method is 'GET'
```

## Catching Errors at Declaration

Without `satisfies`, errors might only surface when the value is used. With `satisfies`, errors appear immediately:

```typescript
type Config = {
  port: number;
  host: string;
  debug: boolean;
};

// Error caught immediately: 'yes' is not assignable to boolean
const config = {
  port: 3000,
  host: 'localhost',
  debug: 'yes',
} satisfies Config;
```

## Real-World Patterns

### Exhaustive Configuration Objects

```typescript
type StatusMessages = Record<'success' | 'error' | 'pending', string>;

const messages = {
  success: 'Operation completed',
  error: 'Something went wrong',
  pending: 'Please wait...',
} satisfies StatusMessages;

// Error: missing 'pending' key would be caught immediately
```

### Type-Safe Constants

```typescript
type Endpoint = {
  url: string;
  method: 'GET' | 'POST';
  auth: boolean;
};

const API = {
  getUsers: { url: '/api/users', method: 'GET', auth: true },
  createUser: { url: '/api/users', method: 'POST', auth: true },
  health: { url: '/api/health', method: 'GET', auth: false },
} satisfies Record<string, Endpoint>;

// Full autocomplete on keys: API.getUsers, API.createUser, API.health
// Each value retains its specific literal types
```

### Combining with `as const`

```typescript
const PERMISSIONS = {
  admin: ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
} as const satisfies Record<string, readonly string[]>;

// Type is deeply readonly with literal string values
// PERMISSIONS.admin is readonly ["read", "write", "delete"]
```

## satisfies vs Type Annotation

| Feature | `: Type` | `satisfies Type` |
|---------|---------|------------------|
| Validates against type | Yes | Yes |
| Widens inferred type | Yes | No |
| Preserves literal types | No | Yes |
| Catches excess properties | Yes | Yes |
| Catches missing properties | Yes | Yes |

Use `satisfies` when you want both validation and precise inference. Use a type annotation when you want to enforce a wider contract.
