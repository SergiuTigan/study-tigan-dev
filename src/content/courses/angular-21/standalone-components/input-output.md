---
title: "input() & output()"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "standalone-components"
moduleTitle: "Standalone Components"
moduleDescription: "Build components with the latest signal-based APIs for inputs, outputs, queries, and lifecycle."
lessonId: "angular-21/standalone-components/input-output"
duration: "10 min"
order: 301
moduleOrder: 3
lessonOrder: 1
color: "red"
---
# input() & output()

Angular 21 replaces the `@Input()` and `@Output()` decorators with signal-based `input()` and `output()` functions. These new APIs provide better type safety, simpler syntax, and native integration with the signals system.

## Signal Inputs

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ name() }}!</h1>`,
})
export class GreetingComponent {
  // Optional input with default value
  name = input('World');

  // Required input -- parent must provide this
  userId = input.required<number>();

  // Input with transform
  disabled = input(false, {
    transform: (value: boolean | string) => typeof value === 'string' ? value !== 'false' : value,
  });
}
```

Signal inputs are read-only signals. You read them with `this.name()` and use them in `computed()` or `effect()` like any other signal.

## Outputs

```typescript
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `<button (click)="clicked.emit()">Click me</button>`,
})
export class ButtonComponent {
  clicked = output<void>();
  valueChange = output<string>();
}
```

In the parent template:

```html
<app-button (clicked)="handleClick()" (valueChange)="onValueChange($event)" />
```

## Aliasing

Both `input()` and `output()` support aliasing for backward compatibility:

```typescript
name = input('', { alias: 'userName' });
clicked = output<void>({ alias: 'onClick' });
```

## Migration from Decorators

The Angular CLI provides a schematic to automatically convert decorator-based inputs and outputs:

```bash
ng generate @angular/core:signal-input-migration
ng generate @angular/core:output-migration
```

These schematics update your component code and all template references.
