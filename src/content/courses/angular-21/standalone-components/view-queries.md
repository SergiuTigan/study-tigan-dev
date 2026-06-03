---
title: "View Queries"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "standalone-components"
moduleTitle: "Standalone Components"
moduleDescription: "Build components with the latest signal-based APIs for inputs, outputs, queries, and lifecycle."
lessonId: "angular-21/standalone-components/view-queries"
duration: "10 min"
order: 304
moduleOrder: 3
lessonOrder: 4
color: "red"
---
# View Queries

Angular 21 provides signal-based view queries: `viewChild()`, `viewChildren()`, `contentChild()`, and `contentChildren()`. These replace the `@ViewChild`, `@ViewChildren`, `@ContentChild`, and `@ContentChildren` decorators.

## viewChild()

```typescript
import { Component, viewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-search',
  template: `<input #searchInput placeholder="Search..." />`,
})
export class SearchComponent {
  searchInput = viewChild.required<ElementRef>('searchInput');

  focusInput(): void {
    this.searchInput().nativeElement.focus();
  }
}
```

`viewChild()` returns a signal. For required queries, the signal is guaranteed to have a value after the view initializes. For optional queries, it may be `undefined`.

## viewChildren()

```typescript
import { Component, viewChildren } from '@angular/core';
import { ChartComponent } from './chart.component';

@Component({
  selector: 'app-dashboard',
  template: `
    @for (data of datasets(); track data.id) {
      <app-chart [data]="data" />
    }
  `,
  imports: [ChartComponent],
})
export class DashboardComponent {
  datasets = signal([...]);
  charts = viewChildren(ChartComponent);

  refreshAll(): void {
    for (const chart of this.charts()) {
      chart.refresh();
    }
  }
}
```

`viewChildren()` returns a signal of an array. The array updates automatically when items are added or removed.

## Content Queries

`contentChild()` and `contentChildren()` work the same way but query projected content instead of view content:

```typescript
@Component({
  selector: 'app-tab-group',
  template: `
    <div class="tabs">
      @for (tab of tabs(); track tab.label()) {
        <button (click)="selectTab(tab)">{{ tab.label() }}</button>
      }
    </div>
    <ng-content />
  `,
})
export class TabGroupComponent {
  tabs = contentChildren(TabComponent);
  activeTab = linkedSignal(() => this.tabs()[0]);
}
```

## Benefits Over Decorators

Signal-based queries are reactive: you can use them in `computed()` and `effect()` expressions. They also have better type safety and do not require lifecycle hooks like `ngAfterViewInit`.
