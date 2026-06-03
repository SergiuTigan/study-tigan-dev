---
title: "Form Patterns"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "signal-forms"
moduleTitle: "Signal Forms"
moduleDescription: "Build forms using Angular's new signal-based forms API."
lessonId: "angular-21/signal-forms/form-patterns"
duration: "10 min"
order: 504
moduleOrder: 5
lessonOrder: 4
color: "red"
---
# Form Patterns

This lesson covers practical patterns for building production forms with Signal Forms, including multi-step wizards, auto-save, and integration with backend APIs.

## Multi-Step Wizard

```typescript
@Component({ ... })
export class WizardComponent {
  private sfb = inject(SignalFormBuilder);

  currentStep = signal(0);

  steps = [
    this.sfb.group({
      firstName: this.sfb.field('', [Validators.required]),
      lastName: this.sfb.field('', [Validators.required]),
    }),
    this.sfb.group({
      email: this.sfb.field('', [Validators.required, Validators.email]),
      phone: this.sfb.field(''),
    }),
    this.sfb.group({
      plan: this.sfb.field('free', [Validators.required]),
      terms: this.sfb.field(false, [Validators.requiredTrue]),
    }),
  ];

  currentForm = computed(() => this.steps[this.currentStep()]);
  canProceed = computed(() => this.currentForm().valid());

  next(): void {
    if (this.canProceed()) {
      this.currentStep.update(s => s + 1);
    }
  }

  back(): void {
    this.currentStep.update(s => Math.max(0, s - 1));
  }
}
```

## Auto-Save with Debounce

```typescript
export class EditorComponent {
  form = this.sfb.group({
    title: this.sfb.field(''),
    content: this.sfb.field(''),
  });

  private autoSave = effect(() => {
    const value = this.form.value();
    // effect runs on every change; use untracked + debounce in practice
    untracked(() => this.saveDebounced(value));
  });

  private saveDebounced = debounce((value: any) => {
    this.api.save(value);
  }, 1000);
}
```

## Loading Form Data from API

```typescript
export class EditUserComponent {
  userId = input.required<string>();
  private api = inject(UserService);

  userResource = resource({
    request: () => this.userId(),
    loader: async ({ request: id }) => this.api.getUser(id),
  });

  form = this.sfb.group({
    name: this.sfb.field('', [Validators.required]),
    email: this.sfb.field('', [Validators.required, Validators.email]),
  });

  // Populate form when data loads
  private populateForm = effect(() => {
    const user = this.userResource.value();
    if (user) {
      this.form.patchValue({ name: user.name, email: user.email });
    }
  });
}
```

These patterns demonstrate how Signal Forms integrate cleanly with the rest of Angular 21's signal-based architecture.
