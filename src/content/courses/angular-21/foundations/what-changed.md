---
title: "What Changed in Angular 21"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "foundations"
moduleTitle: "Foundations"
moduleDescription: "Understand the modern Angular landscape, project setup, application structure, and current best practices."
lessonId: "angular-21/foundations/what-changed"
duration: "12 min"
order: 101
moduleOrder: 1
lessonOrder: 1
color: "red"
---
# What Changed in Angular 21

Angular 21 represents the culmination of several years of incremental modernization. The framework has moved decisively away from the NgModule-centric architecture toward a signals-first, standalone-by-default development model. If you are coming from Angular 14 or earlier, the differences are substantial.

## Key Changes

The most impactful changes in Angular 21 include:

- **Signals are the primary reactive primitive.** The `signal()`, `computed()`, and `effect()` APIs have replaced RxJS for most component-level state management. RxJS is still available and fully supported, but it is no longer the default recommendation for UI state.
- **Standalone components are the default.** The `standalone: true` flag is no longer needed because all components, directives, and pipes are standalone by default. NgModules still exist for backward compatibility but are no longer required.
- **Zoneless change detection** is stable. You can now run Angular applications without Zone.js, relying on signal-based notifications to trigger change detection.
- **Signal-based forms** provide a new approach to form handling that integrates natively with signals.
- **`httpResource()`** offers a declarative, signal-friendly way to fetch data.

## The Migration Path

Angular provides a set of schematics to help migrate existing applications:

```bash
ng generate @angular/core:signal-input-migration
ng generate @angular/core:signal-queries-migration
ng generate @angular/core:output-migration
```

These schematics convert decorator-based inputs, outputs, and view queries to their signal-based equivalents. The migration is incremental -- you do not need to convert your entire application at once.

## Why It Matters

The shift to signals eliminates an entire class of bugs related to change detection timing. Components update predictably and efficiently, and the mental model for reactivity is simpler. Angular 21 is faster, lighter, and easier to reason about than any previous version.
