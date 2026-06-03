---
title: "Migration from Date"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "temporal-api"
moduleTitle: "Temporal API"
moduleDescription: "The Temporal API replaces the broken Date object — learn PlainDate, ZonedDateTime, Duration, and migration strategies."
lessonId: "typescript-6/temporal-api/migration-from-date"
duration: "10 min"
order: 304
moduleOrder: 3
lessonOrder: 4
color: "blue"
---
# Migration from Date

Moving from the legacy `Date` object to the Temporal API is a significant but worthwhile effort. This lesson covers practical strategies for migrating existing codebases.

## Common Replacements

Here is a mapping of common `Date` operations to their Temporal equivalents:

| Legacy `Date`                           | Temporal Equivalent                                    |
|------------------------------------------|--------------------------------------------------------|
| `new Date()`                            | `Temporal.Now.zonedDateTimeISO()`                     |
| `new Date('2025-06-15')`               | `Temporal.PlainDate.from('2025-06-15')`               |
| `date.getFullYear()`                    | `plainDate.year`                                      |
| `date.getMonth() + 1`                   | `plainDate.month` (already 1-based!)                  |
| `date.getTime()`                        | `instant.epochMilliseconds`                           |
| `date1 - date2`                         | `date1.until(date2)`                                  |

## Step-by-Step Migration

### Step 1: Identify Date Usage Patterns

Audit your codebase for how `Date` is used. The most common patterns are:

```typescript
// Pattern 1: Display dates (no timezone needed)
const birthday = new Date('1990-05-20');
// Replace with: Temporal.PlainDate.from('1990-05-20')

// Pattern 2: Timestamps (precise moments)
const created = new Date();
// Replace with: Temporal.Now.instant()

// Pattern 3: Date arithmetic
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
// Replace with: Temporal.Now.plainDateISO().add({ days: 1 })

// Pattern 4: Formatting
const formatted = date.toLocaleDateString('en-US');
// Replace with: plainDate.toLocaleString('en-US')
```

### Step 2: Create an Adapter Layer

For large codebases, introduce a utility module that wraps Temporal and provides the API your application needs:

```typescript
// date-utils.ts
export function today(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO();
}

export function now(): Temporal.ZonedDateTime {
  return Temporal.Now.zonedDateTimeISO();
}

export function parseDate(iso: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(iso);
}

export function formatDate(
  date: Temporal.PlainDate,
  locale = 'en-US'
): string {
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function daysUntil(
  from: Temporal.PlainDate,
  to: Temporal.PlainDate
): number {
  return from.until(to, { largestUnit: 'day' }).days;
}
```

### Step 3: Handle Serialization

APIs and databases often use ISO strings or Unix timestamps. Here is how to convert:

```typescript
// From ISO string (API response)
const dateStr = '2025-06-15';
const date = Temporal.PlainDate.from(dateStr);

// To ISO string (API request)
const isoString = date.toString(); // '2025-06-15'

// From Unix timestamp (database)
const timestamp = 1750000000000;
const instant = Temporal.Instant.fromEpochMilliseconds(timestamp);
const zdt = instant.toZonedDateTimeISO('America/New_York');

// To Unix timestamp (database)
const epoch = zdt.toInstant().epochMilliseconds;
```

### Step 4: Library Interop

Many libraries still expect `Date` objects. Create bridge functions:

```typescript
// Temporal -> Date
function toDate(temporal: Temporal.ZonedDateTime): Date {
  return new Date(temporal.toInstant().epochMilliseconds);
}

function toDateFromPlain(date: Temporal.PlainDate): Date {
  // Warning: this creates a Date at midnight UTC, which may shift the day
  return new Date(date.toString() + 'T00:00:00Z');
}

// Date -> Temporal
function fromDate(date: Date): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime());
}

function fromDateToPlain(date: Date, tz: string): Temporal.PlainDate {
  const instant = Temporal.Instant.fromEpochMilliseconds(date.getTime());
  return instant.toZonedDateTimeISO(tz).toPlainDate();
}
```

## Migration Checklist

1. Install TypeScript 6 and ensure `target` is set to `"ES2025"` or later.
2. Audit all `Date` usage and categorize by pattern (display, timestamp, arithmetic, formatting).
3. Create adapter utilities for your most common operations.
4. Migrate module by module, starting with new code and working backward.
5. Add bridge functions for third-party libraries that still require `Date`.
6. Remove `Date` usage from your linting rules once migration is complete.

The Temporal API is verbose compared to `Date`, but that verbosity is intentional — it forces you to be explicit about what kind of date/time value you are working with, eliminating the ambiguity that caused bugs in the first place.
