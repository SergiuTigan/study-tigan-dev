---
title: "Content Projection"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "standalone-components"
moduleTitle: "Standalone Components"
moduleDescription: "Build components with the latest signal-based APIs for inputs, outputs, queries, and lifecycle."
lessonId: "angular-21/standalone-components/content-projection"
duration: "10 min"
order: 303
moduleOrder: 3
lessonOrder: 3
color: "red"
---
# Content Projection

Content projection allows you to pass template content into a component from the outside. Angular supports single-slot, multi-slot, and conditional content projection.

## Single-Slot Projection

```typescript
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <ng-content />
    </div>
  `,
})
export class CardComponent {}
```

Usage:

```html
<app-card>
  <h2>Card Title</h2>
  <p>Card content goes here.</p>
</app-card>
```

## Multi-Slot Projection

Use the `select` attribute on `<ng-content>` to project content into specific slots:

```typescript
@Component({
  selector: 'app-dialog',
  template: `
    <div class="dialog">
      <header><ng-content select="[dialog-title]" /></header>
      <main><ng-content /></main>
      <footer><ng-content select="[dialog-actions]" /></footer>
    </div>
  `,
})
export class DialogComponent {}
```

Usage:

```html
<app-dialog>
  <h2 dialog-title>Confirm Delete</h2>
  <p>Are you sure you want to delete this item?</p>
  <div dialog-actions>
    <button (click)="cancel()">Cancel</button>
    <button (click)="confirm()">Delete</button>
  </div>
</app-dialog>
```

## Conditional Projection with @if

You can conditionally render projected content, but note that `<ng-content>` always instantiates the projected content. For truly lazy content, use `<ng-template>` with `@defer` or structural directives:

```typescript
@Component({
  selector: 'app-expandable',
  template: `
    <button (click)="open.set(!open())">Toggle</button>
    @if (open()) {
      <div class="panel">
        <ng-content />
      </div>
    }
  `,
})
export class ExpandableComponent {
  open = signal(false);
}
```

## Default Content

You can provide fallback content inside `<ng-content>` that renders when nothing is projected:

```html
<ng-content select="[icon]">
  <span class="default-icon">★</span>
</ng-content>
```

This makes components more flexible and usable without requiring every slot to be filled.
