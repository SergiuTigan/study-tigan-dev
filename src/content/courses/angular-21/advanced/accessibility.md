---
title: "Angular Aria & Accessibility"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "advanced"
moduleTitle: "Advanced"
moduleDescription: "Deep dive into zoneless internals, accessibility, performance, and server-side rendering."
lessonId: "angular-21/advanced/accessibility"
duration: "12 min"
order: 802
moduleOrder: 8
lessonOrder: 2
color: "red"
---
# Angular Aria & Accessibility

Building accessible applications is a responsibility and a legal requirement in many jurisdictions. Angular provides tools and patterns to build inclusive UIs.

## Angular CDK Accessibility

The Angular CDK (Component Dev Kit) includes an `a11y` module with essential utilities:

```typescript
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  imports: [A11yModule],
  template: `
    <div cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
      <h2>Modal Dialog</h2>
      <input placeholder="Name" />
      <button (click)="close()">Close</button>
    </div>
  `,
})
export class ModalComponent {}
```

Key CDK utilities:
- **`FocusTrap`**: Constrains tab focus within a container (essential for modals).
- **`LiveAnnouncer`**: Announces messages to screen readers via ARIA live regions.
- **`FocusMonitor`**: Tracks how an element was focused (mouse, keyboard, programmatic).

## ARIA Attributes with Signal Binding

```typescript
@Component({
  template: `
    <button
      [attr.aria-expanded]="isOpen()"
      [attr.aria-controls]="panelId"
      (click)="toggle()"
    >
      {{ isOpen() ? 'Collapse' : 'Expand' }}
    </button>

    <div [id]="panelId" role="region" [attr.aria-hidden]="!isOpen()">
      <ng-content />
    </div>
  `,
})
export class ExpandablePanelComponent {
  isOpen = signal(false);
  panelId = `panel-${crypto.randomUUID()}`;
  toggle(): void { this.isOpen.update(v => !v); }
}
```

## LiveAnnouncer for Dynamic Content

```typescript
import { LiveAnnouncer } from '@angular/cdk/a11y';

export class SearchComponent {
  private announcer = inject(LiveAnnouncer);

  onResultsLoaded(count: number): void {
    this.announcer.announce(`${count} results found`);
  }
}
```

## Checklist

- All interactive elements are keyboard accessible.
- Focus is managed properly in modals and drawers.
- Images have `alt` text; decorative images use `alt=""`.
- Color is not the only means of conveying information.
- Form fields have associated labels.
- Dynamic content changes are announced to screen readers.
- The page has a logical heading hierarchy.

Accessibility is not an afterthought. Build it in from the start.
