---
title: "Introduction to Signal Forms"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "signal-forms"
moduleTitle: "Signal Forms"
moduleDescription: "Build forms using Angular's new signal-based forms API."
lessonId: "angular-21/signal-forms/introduction"
duration: "12 min"
order: 501
moduleOrder: 5
lessonOrder: 1
color: "red"
---
# Introduction to Signal Forms

Angular 21 introduces a new signal-based forms API that complements (and will eventually replace) the existing Reactive Forms and Template-Driven Forms. Signal Forms integrate natively with Angular's signal system, providing a simpler and more type-safe way to handle forms.

## Why Signal Forms?

The existing `ReactiveFormsModule` has served Angular well, but it has pain points:

- Weak type safety (`FormControl<any>` was common before typed forms)
- Complex API surface (`FormGroup`, `FormArray`, `FormControl`, `FormBuilder`)
- Poor integration with signals (requires `toSignal()` adapters)
- Verbose validation setup

Signal Forms address all of these issues.

## Basic Signal Form

```typescript
import { Component } from '@angular/core';
import { SignalFormBuilder, Validators } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  template: `
    <form (ngSubmit)="submit()">
      <input [formField]="email" placeholder="Email" />
      @if (email.errors().required) {
        <span class="error">Email is required</span>
      }

      <input [formField]="password" type="password" placeholder="Password" />

      <button type="submit" [disabled]="!form.valid()">Login</button>
    </form>
  `,
})
export class LoginComponent {
  private sfb = inject(SignalFormBuilder);

  form = this.sfb.group({
    email: this.sfb.field('', [Validators.required, Validators.email]),
    password: this.sfb.field('', [Validators.required, Validators.minLength(8)]),
  });

  email = this.form.fields.email;
  password = this.form.fields.password;

  submit(): void {
    if (this.form.valid()) {
      console.log(this.form.value());
      // { email: 'user@example.com', password: '12345678' }
    }
  }
}
```

## Key Concepts

- **`field()`** creates a single form field (analogous to `FormControl`)
- **`group()`** creates a group of fields (analogous to `FormGroup`)
- **`form.value()`** is a signal that returns the current form value
- **`form.valid()`** is a signal that returns the current validation state
- **`field.errors()`** is a signal that returns the current errors

Everything is a signal, so it integrates naturally with `computed()`, `effect()`, and Angular templates.
