---
title: "Duration & Calculations"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "temporal-api"
moduleTitle: "Temporal API"
moduleDescription: "The Temporal API replaces the broken Date object — learn PlainDate, ZonedDateTime, Duration, and migration strategies."
lessonId: "typescript-6/temporal-api/duration-calculations"
duration: "8 min"
order: 303
moduleOrder: 3
lessonOrder: 3
color: "blue"
---
# Duration & Calculations

`Temporal.Duration` represents a length of time — hours, minutes, days, months, and so on. Combined with the arithmetic methods on Temporal date and time types, it provides a complete and correct system for date math.

## Creating Durations

```typescript
// From an object
const twoWeeks = Temporal.Duration.from({ weeks: 2 });
const meeting = Temporal.Duration.from({ hours: 1, minutes: 30 });

// From an ISO 8601 duration string
const iso = Temporal.Duration.from('P2W');       // 2 weeks
const complex = Temporal.Duration.from('P1Y2M3DT4H5M'); // 1 year, 2 months, 3 days, 4 hours, 5 minutes

console.log(twoWeeks.days);  // 0 (weeks and days are separate fields)
console.log(twoWeeks.weeks); // 2
console.log(meeting.toString()); // 'PT1H30M'
```

## Date Arithmetic

All Temporal date and time types support `.add()` and `.subtract()` methods:

```typescript
const today = Temporal.PlainDate.from('2025-06-15');

// Add a duration
const nextWeek = today.add({ days: 7 });
console.log(nextWeek.toString()); // '2025-06-22'

// Subtract a duration
const lastMonth = today.subtract({ months: 1 });
console.log(lastMonth.toString()); // '2025-05-15'

// Chain operations
const future = today
  .add({ years: 1 })
  .add({ months: 3 })
  .add({ days: 10 });
console.log(future.toString()); // '2026-09-25'
```

Month arithmetic handles edge cases correctly:

```typescript
const jan31 = Temporal.PlainDate.from('2025-01-31');
const plusOneMonth = jan31.add({ months: 1 });
console.log(plusOneMonth.toString()); // '2025-02-28' (clamped, not March 3!)
```

## Calculating the Duration Between Two Dates

Use the `.until()` or `.since()` methods to calculate the difference between two Temporal values:

```typescript
const start = Temporal.PlainDate.from('2025-01-01');
const end = Temporal.PlainDate.from('2025-06-15');

const diff = start.until(end);
console.log(diff.toString()); // 'P165D'

// Specify which units you want
const detailed = start.until(end, { largestUnit: 'month' });
console.log(detailed.months); // 5
console.log(detailed.days);   // 14
console.log(detailed.toString()); // 'P5M14D'
```

The `largestUnit` option controls the largest unit used in the result:

```typescript
const a = Temporal.PlainTime.from('09:00');
const b = Temporal.PlainTime.from('17:30');

const workday = a.until(b);
console.log(workday.toString()); // 'PT8H30M'
console.log(workday.hours);     // 8
console.log(workday.minutes);   // 30
```

## Comparing and Rounding Durations

```typescript
const d1 = Temporal.Duration.from({ hours: 2, minutes: 30 });
const d2 = Temporal.Duration.from({ hours: 1, minutes: 45 });

// Compare requires a relativeTo for calendar-sensitive durations
console.log(Temporal.Duration.compare(d1, d2)); // 1 (d1 is longer)

// Round a duration
const precise = Temporal.Duration.from({ hours: 1, minutes: 23, seconds: 45 });
const rounded = precise.round({ smallestUnit: 'minute', roundingMode: 'halfExpand' });
console.log(rounded.toString()); // 'PT1H24M'
```

## Working with ZonedDateTime Arithmetic

Duration arithmetic on `ZonedDateTime` correctly handles DST transitions:

```typescript
const beforeDST = Temporal.ZonedDateTime.from(
  '2025-03-09T01:00:00[America/New_York]'
);

// Adding 2 hours crosses the spring-forward gap
const afterAdd = beforeDST.add({ hours: 2 });
console.log(afterAdd.hour); // 4 (1 AM + 2 hours = 4 AM because 2-3 AM was skipped)
```

This is one of the most important advantages of Temporal over manual date math with the legacy `Date` object. DST-safe arithmetic that "just works" eliminates an entire category of scheduling bugs.
