---
title: "Template Literal Types"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "type-system"
moduleTitle: "Type System"
moduleDescription: "Master the refined type system with improved inference, narrowing, and discriminated unions."
lessonId: "typescript-6/type-system/template-literal-types"
duration: "10 min"
order: 204
moduleOrder: 2
lessonOrder: 4
color: "blue"
---
# Template Literal Types

Template literal types let you construct new string literal types by combining existing types with template literal syntax. They bring the power of string interpolation to the type system.

## Basic Construction

A template literal type uses the same backtick syntax as runtime template literals, but operates on types:

```typescript
type Greeting = `Hello, ${string}`;

const valid: Greeting = 'Hello, World';     // OK
const invalid: Greeting = 'Goodbye, World'; // Error
```

You can combine literal types to generate all possible combinations:

```typescript
type Color = 'red' | 'blue' | 'green';
type Size = 'sm' | 'md' | 'lg';

type ClassName = `${Color}-${Size}`;
// 'red-sm' | 'red-md' | 'red-lg' | 'blue-sm' | 'blue-md' | 'blue-lg' | 'green-sm' | 'green-md' | 'green-lg'
```

## Inference with Template Literals

TypeScript can infer parts of a template literal type using the `infer` keyword in conditional types:

```typescript
type ExtractId<T extends string> =
  T extends `user_${infer Id}` ? Id : never;

type UserId = ExtractId<'user_abc123'>; // 'abc123'
type Nothing = ExtractId<'order_456'>;  // never
```

This is powerful for parsing string-based APIs at the type level:

```typescript
type ParseRoute<T extends string> =
  T extends `/${infer Segment}/${infer Rest}`
    ? Segment | ParseRoute<`/${Rest}`>
    : T extends `/${infer Segment}`
      ? Segment
      : never;

type Segments = ParseRoute<'/users/123/posts'>;
// 'users' | '123' | 'posts'
```

## Utility Types for Strings

TypeScript provides built-in utility types that operate on string literal types:

```typescript
type Upper = Uppercase<'hello'>;       // 'HELLO'
type Lower = Lowercase<'HELLO'>;       // 'hello'
type Cap = Capitalize<'hello'>;        // 'Hello'
type Uncap = Uncapitalize<'Hello'>;    // 'hello'
```

These combine naturally with template literal types:

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickHandler = EventName<'click'>;       // 'onClick'
type SubmitHandler = EventName<'submit'>;      // 'onSubmit'
type KeyDownHandler = EventName<'keyDown'>;    // 'onKeyDown'
```

## Practical Applications

### Type-Safe CSS Classes

```typescript
type Spacing = 1 | 2 | 4 | 8;
type Direction = 't' | 'r' | 'b' | 'l' | 'x' | 'y';
type SpacingClass = `m${Direction}-${Spacing}` | `p${Direction}-${Spacing}`;

function addClass(el: HTMLElement, cls: SpacingClass) {
  el.classList.add(cls);
}

addClass(document.body, 'mt-4');   // OK
addClass(document.body, 'px-8');   // OK
addClass(document.body, 'mz-3');   // Error — 'z' is not a valid Direction
```

### Type-Safe Object Key Mapping

```typescript
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

### API Route Typing

```typescript
type ApiRoutes = '/users' | '/users/:id' | '/posts' | '/posts/:id/comments';

type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type UserParams = ExtractParams<'/users/:id'>;  // 'id'
type CommentParams = ExtractParams<'/posts/:id/comments'>; // 'id'
```

Template literal types are a cornerstone of type-safe string manipulation. They enable compile-time validation of string patterns that would otherwise require runtime checks.
