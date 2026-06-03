---
title: "Validation"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "signal-forms"
moduleTitle: "Signal Forms"
moduleDescription: "Build forms using Angular's new signal-based forms API."
lessonId: "angular-21/signal-forms/validation"
duration: "10 min"
order: 502
moduleOrder: 5
lessonOrder: 2
color: "red"
---
# Validation

Signal Forms provide a streamlined validation API. Validators are functions that run reactively whenever the field value changes, and validation state is exposed as signals.

## Built-in Validators

```typescript
import { Validators } from '@angular/forms/signals';

const name = sfb.field('', [
  Validators.required,
  Validators.minLength(2),
  Validators.maxLength(50),
]);

const email = sfb.field('', [
  Validators.required,
  Validators.email,
]);

const age = sfb.field(0, [
  Validators.required,
  Validators.min(18),
  Validators.max(120),
]);
```

## Custom Validators

A custom validator is a function that receives the field value and returns an error object or `null`:

```typescript
import { ValidatorFn } from '@angular/forms/signals';

const passwordStrength: ValidatorFn<string> = (value) => {
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /\\d/.test(value);

  if (hasUpper && hasLower && hasDigit) {
    return null; // Valid
  }

  return {
    passwordStrength: {
      message: 'Password must contain uppercase, lowercase, and digit',
    },
  };
};

const password = sfb.field('', [Validators.required, passwordStrength]);
```

## Async Validators

For server-side validation (e.g., checking if a username is taken):

```typescript
const usernameAvailable: AsyncValidatorFn<string> = async (value) => {
  const taken = await fetch(`/api/check-username?name=${value}`).then(r => r.json());
  return taken ? { usernameTaken: { message: 'This username is already taken' } } : null;
};

const username = sfb.field('', [Validators.required], [usernameAvailable]);
```

## Displaying Errors in Templates

```html
<input [formField]="email" />

@if (email.touched() && email.errors(); as errors) {
  @if (errors.required) {
    <span class="error">Email is required</span>
  }
  @if (errors.email) {
    <span class="error">Please enter a valid email</span>
  }
}
```

The `touched()` signal prevents showing errors before the user has interacted with the field.
