---
title: "Complex Forms"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "signal-forms"
moduleTitle: "Signal Forms"
moduleDescription: "Build forms using Angular's new signal-based forms API."
lessonId: "angular-21/signal-forms/complex-forms"
duration: "12 min"
order: 503
moduleOrder: 5
lessonOrder: 3
color: "red"
---
# Complex Forms

Real applications require forms with nested groups, dynamic arrays, and cross-field validation. Signal Forms handle these scenarios elegantly.

## Nested Groups

```typescript
const form = sfb.group({
  name: sfb.field('', [Validators.required]),
  address: sfb.group({
    street: sfb.field('', [Validators.required]),
    city: sfb.field('', [Validators.required]),
    zip: sfb.field('', [Validators.required, Validators.pattern(/^\\d{5}$/)]),
  }),
});

// Access nested values
const city = form.fields.address.fields.city;
console.log(city.value()); // signal
```

## Dynamic Field Arrays

```typescript
const form = sfb.group({
  title: sfb.field('', [Validators.required]),
  tags: sfb.array([
    sfb.field('angular'),
    sfb.field('signals'),
  ]),
});

// Add a new tag
form.fields.tags.push(sfb.field(''));

// Remove a tag
form.fields.tags.removeAt(0);

// Iterate in template
// @for (tag of form.fields.tags.fields(); track $index) {
//   <input [formField]="tag" />
// }
```

## Cross-Field Validation

Validate relationships between fields at the group level:

```typescript
const passwordMatch: ValidatorFn<{ password: string; confirm: string }> = (value) => {
  return value.password === value.confirm
    ? null
    : { passwordMismatch: { message: 'Passwords do not match' } };
};

const form = sfb.group(
  {
    password: sfb.field('', [Validators.required, Validators.minLength(8)]),
    confirm: sfb.field('', [Validators.required]),
  },
  { validators: [passwordMatch] },
);
```

## Resetting and Patching

```typescript
// Reset to initial values
form.reset();

// Patch specific fields
form.patchValue({
  name: 'New Name',
  address: { city: 'New York' },
});
```

Both operations update the signals, triggering reactive updates throughout the template and any dependent computed values.
