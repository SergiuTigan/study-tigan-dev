---
title: "ZonedDateTime"
course: "typescript-6"
courseTitle: "TypeScript 6"
module: "temporal-api"
moduleTitle: "Temporal API"
moduleDescription: "The Temporal API replaces the broken Date object — learn PlainDate, ZonedDateTime, Duration, and migration strategies."
lessonId: "typescript-6/temporal-api/zoned-datetime"
duration: "10 min"
order: 302
moduleOrder: 3
lessonOrder: 2
color: "blue"
---
# ZonedDateTime

`Temporal.ZonedDateTime` represents a precise moment in time, associated with a specific timezone. It is the Temporal equivalent of "a `Date` that knows what timezone it is in" — but done correctly.

## Creating a ZonedDateTime

```typescript
// From an ISO string with timezone annotation
const meeting = Temporal.ZonedDateTime.from(
  '2025-06-15T14:30:00[America/New_York]'
);

// From components
const event = Temporal.ZonedDateTime.from({
  year: 2025,
  month: 6,
  day: 15,
  hour: 14,
  minute: 30,
  timeZone: 'America/New_York',
});

console.log(meeting.timeZoneId);  // 'America/New_York'
console.log(meeting.hour);        // 14
console.log(meeting.offsetNanoseconds); // UTC offset in nanoseconds
console.log(meeting.offset);      // '-04:00' (EDT)
```

## Converting Between Timezones

One of the most common operations is converting a moment from one timezone to another:

```typescript
const nyMeeting = Temporal.ZonedDateTime.from(
  '2025-06-15T14:30:00[America/New_York]'
);

// Convert to London time
const londonTime = nyMeeting.withTimeZone('Europe/London');
console.log(londonTime.toString());
// '2025-06-15T19:30:00+01:00[Europe/London]'

// Convert to Tokyo time
const tokyoTime = nyMeeting.withTimeZone('Asia/Tokyo');
console.log(tokyoTime.toString());
// '2025-06-16T03:30:00+09:00[Asia/Tokyo]'
```

The underlying instant is preserved — only the local representation changes.

## Handling Daylight Saving Time

DST transitions are a classic source of bugs. Temporal handles them explicitly:

```typescript
// Spring forward: 2:00 AM jumps to 3:00 AM in US Eastern
const springForward = Temporal.ZonedDateTime.from({
  year: 2025,
  month: 3,
  day: 9,
  hour: 2,
  minute: 30,
  timeZone: 'America/New_York',
}, { disambiguation: 'compatible' });

// 'compatible' (default) — adjusts to the nearest valid time
console.log(springForward.hour); // 3

// Fall back: 1:00 AM occurs twice
const fallBack = Temporal.ZonedDateTime.from({
  year: 2025,
  month: 11,
  day: 2,
  hour: 1,
  minute: 30,
  timeZone: 'America/New_York',
}, { disambiguation: 'earlier' });
// Selects the first occurrence (EDT, before the clocks fall back)
```

The `disambiguation` option controls what happens when a local time is ambiguous or nonexistent:

| Option         | Behavior                                         |
|----------------|--------------------------------------------------|
| `'compatible'` | Match legacy `Date` behavior (default)           |
| `'earlier'`    | Pick the earlier of two possible instants         |
| `'later'`      | Pick the later of two possible instants           |
| `'reject'`     | Throw a `RangeError` if the time is ambiguous     |

## From Instant to ZonedDateTime

If you have a UTC timestamp, convert it to a timezone-aware representation:

```typescript
const instant = Temporal.Instant.from('2025-06-15T18:30:00Z');

const inNewYork = instant.toZonedDateTimeISO('America/New_York');
console.log(inNewYork.hour); // 14 (UTC-4 in summer)

const inTokyo = instant.toZonedDateTimeISO('Asia/Tokyo');
console.log(inTokyo.hour);  // 3 (next day, UTC+9)
```

## Extracting Components

You can extract a `PlainDate`, `PlainTime`, or `PlainDateTime` from a `ZonedDateTime`:

```typescript
const zdt = Temporal.ZonedDateTime.from(
  '2025-06-15T14:30:00[America/New_York]'
);

const date = zdt.toPlainDate();       // 2025-06-15
const time = zdt.toPlainTime();       // 14:30:00
const dateTime = zdt.toPlainDateTime(); // 2025-06-15T14:30:00
const instant = zdt.toInstant();      // exact UTC moment
```

`ZonedDateTime` is the right choice when you need to track a specific moment in time (API timestamps, scheduling, logging) and display it in a human-readable local time.
