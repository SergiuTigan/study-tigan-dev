---
title: "PlainDate & PlainTime"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "temporal-api"
moduleTitle: "Temporal API"
moduleDescription: "The Temporal API replaces the broken Date object — learn PlainDate, ZonedDateTime, Duration, and migration strategies."
lessonId: "typescript-6/temporal-api/plain-date-time"
duration: "10 min"
order: 301
moduleOrder: 3
lessonOrder: 1
color: "blue"
---
# PlainDate & PlainTime

The Temporal API introduces `Temporal.PlainDate` and `Temporal.PlainTime` as first-class types for representing calendar dates and wall-clock times without timezone ambiguity. These replace the most common uses of the legacy `Date` object.

## The Problem with `Date`

The JavaScript `Date` object conflates calendar dates, wall-clock times, and precise instants. When you create a "date," it actually stores a UTC timestamp, which leads to timezone bugs:

```typescript
// Legacy Date — timezone confusion
const date = new Date('2025-06-15');
console.log(date.getDate()); // Might be 14 or 15, depending on timezone!
```

## Creating a PlainDate

`Temporal.PlainDate` represents a calendar date with no time or timezone attached:

```typescript
// From components
const date = new Temporal.PlainDate(2025, 6, 15);

// From ISO string
const parsed = Temporal.PlainDate.from('2025-06-15');

// From an object
const fromObj = Temporal.PlainDate.from({ year: 2025, month: 6, day: 15 });

console.log(date.year);      // 2025
console.log(date.month);     // 6
console.log(date.day);       // 15
console.log(date.dayOfWeek); // 7 (Sunday)
console.log(date.toString()); // '2025-06-15'
```

There is no timezone conversion. June 15 is June 15, everywhere.

## Creating a PlainTime

`Temporal.PlainTime` represents a wall-clock time with no date or timezone:

```typescript
const time = new Temporal.PlainTime(14, 30, 0);

const parsed = Temporal.PlainTime.from('14:30:00');

console.log(time.hour);   // 14
console.log(time.minute);  // 30
console.log(time.second);  // 0
console.log(time.toString()); // '14:30:00'
```

## Comparing Dates and Times

Temporal types use `Temporal.PlainDate.compare()` for ordering and `.equals()` for equality:

```typescript
const a = Temporal.PlainDate.from('2025-06-15');
const b = Temporal.PlainDate.from('2025-12-25');

// Comparison returns -1, 0, or 1
console.log(Temporal.PlainDate.compare(a, b)); // -1 (a is before b)

// Equality check
console.log(a.equals(b)); // false

// Sorting an array
const dates = [b, a];
dates.sort(Temporal.PlainDate.compare);
// [2025-06-15, 2025-12-25]
```

The same API applies to `PlainTime`:

```typescript
const morning = Temporal.PlainTime.from('09:00');
const evening = Temporal.PlainTime.from('18:00');

console.log(Temporal.PlainTime.compare(morning, evening)); // -1
```

## Formatting

Temporal types support locale-aware formatting through `toLocaleString()`:

```typescript
const date = Temporal.PlainDate.from('2025-06-15');

console.log(date.toLocaleString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}));
// 'Sunday, June 15, 2025'

console.log(date.toLocaleString('de-DE', {
  dateStyle: 'full',
}));
// 'Sonntag, 15. Juni 2025'
```

## PlainDateTime

When you need both a date and a time but still no timezone, use `Temporal.PlainDateTime`:

```typescript
const dt = Temporal.PlainDateTime.from('2025-06-15T14:30:00');

console.log(dt.year);    // 2025
console.log(dt.hour);    // 14
console.log(dt.toString()); // '2025-06-15T14:30:00'

// You can also combine a PlainDate and PlainTime
const date = Temporal.PlainDate.from('2025-06-15');
const time = Temporal.PlainTime.from('14:30');
const combined = date.toPlainDateTime(time);
```

`PlainDate` and `PlainTime` are the correct choice for most user-facing date and time values — birthdays, appointment times, deadlines, and calendar events where the timezone is either irrelevant or handled separately.
