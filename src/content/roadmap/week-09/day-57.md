---
title: "Day 57 -- React Speed-Run for Angular Veterans"
week: 9
day: 57
phase: 3
phaseLabel: "Production"
order: 957
type: "day"
---
# Day 57 -- React Speed-Run for Angular Veterans

> *"I've been mass-producing chandeliers for eight years and someone just handed me a flashlight. It's... weirdly effective."*

**Date:** Luni, 14 Iulie 2025
**Hours:** 2h · Evening session
**Topic:** React Fundamentals via Angular Translation
**Phase:** Faza 3 -- Production · Week 9

---

## What You're Doing

Today you are learning React in two hours. That sounds absurd, but it is not -- because you are not learning React from zero. You are translating eight years of Angular knowledge into React syntax. The concepts are identical. The implementation is different.

React will feel both liberating and unsettling. Liberating because there is no NgModule, no dependency injection, no decorators, no separate template files. Unsettling because all of that structure you relied on is just... gone. A React component is a function. It takes props. It returns JSX. That is it.

Your Angular instincts will serve you well for understanding component composition, data flow, and lifecycle management. They will betray you when you reach for services, observables, or module-level configuration. React does not have those things. React has hooks.

## The Work

### The Translation Table

This is the single most important reference for your transition. Print it. Bookmark it. Tattoo it.

```
┌──────────────────────────┬──────────────────────────────┐
│ Angular                  │ React                        │
├──────────────────────────┼──────────────────────────────┤
│ @Component({...})        │ function ComponentName() {}  │
│ template: `<div>...</div>`│ return <div>...</div>  (JSX)│
│ *ngIf="condition"        │ {condition && <div/>}        │
│ *ngIf="x; else other"   │ {x ? <A/> : <B/>}           │
│ *ngFor="let i of items"  │ {items.map(i => <X key={}/>)}│
│ @Input() name: string    │ function Comp({ name })      │
│ @Output() clicked = new  │ function Comp({ onClick })   │
│   EventEmitter()         │   // just call onClick()     │
│ Service + DI             │ useState + useEffect (local) │
│                          │ Context or Zustand (global)  │
│ BehaviorSubject          │ useState                     │
│ ngOnInit                 │ useEffect(() => {}, [])      │
│ ngOnDestroy              │ useEffect return cleanup     │
│ ngOnChanges              │ useEffect(() => {}, [dep])   │
│ ChangeDetection.OnPush   │ React.memo()                 │
│ Pipe (transform)         │ Regular function in JSX      │
│ [ngClass]                │ className={`...`} or clsx()  │
│ [(ngModel)]              │ value={x} onChange={set}      │
│ HttpClient               │ fetch() in useEffect or SWR  │
│ Router                   │ Next.js file-based routing   │
│ Lazy loading modules     │ React.lazy() + Suspense      │
└──────────────────────────┴──────────────────────────────┘
```

### The Only 4 Hooks You Need

React has many hooks. You need four. Maybe five if you are fancy.

```typescript
// 1. useState -- your BehaviorSubject replacement
const [count, setCount] = useState(0);
// No .next(), no .subscribe(). Just value and setter.

// 2. useEffect -- your ngOnInit, ngOnChanges, ngOnDestroy all in one
useEffect(() => {
  // This runs after render (like ngOnInit for [])
  const subscription = someStream.subscribe();

  return () => {
    // This runs on unmount (like ngOnDestroy)
    subscription.unsubscribe();
  };
}, [dependency]); // This array = ngOnChanges trigger list

// 3. useRef -- DOM access + mutable value that doesn't trigger re-render
const inputRef = useRef<HTMLInputElement>(null);
// Like @ViewChild('input') but simpler

// 4. useMemo / useCallback -- performance optimization
const expensive = useMemo(() => computeHeavy(data), [data]);
const handler = useCallback(() => doThing(id), [id]);
// Like Angular's pure pipes -- only recompute when deps change
```

### Your First React Component (Angular Comparison)

**The Angular version you know:**

```typescript
// counter.component.ts
@Component({
  selector: 'app-counter',
  template: `
    <div>
      <h2>Count: {{ count }}</h2>
      <button (click)="increment()">+1</button>
      <ul>
        <li *ngFor="let item of items">{{ item }}</li>
      </ul>
    </div>
  `
})
export class CounterComponent implements OnInit {
  count = 0;
  items: string[] = [];

  ngOnInit() {
    this.loadItems();
  }

  increment() {
    this.count++;
  }

  async loadItems() {
    this.items = await this.itemService.getAll();
  }

  constructor(private itemService: ItemService) {}
}
```

**The React equivalent:**

```tsx
// Counter.tsx
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    // ngOnInit equivalent
    fetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(data));
  }, []); // empty array = run once on mount

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default Counter;
```

Notice: no class, no decorator, no constructor, no DI, no separate template file. Just a function.

### Practice Exercise (30 minutes max)

Build a todo list. Not because it is interesting, but because it confirms your intuition transfers:

```tsx
// TodoApp.tsx
import { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input, done: false }]);
    setInput('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div>
      <h1>Todos</h1>
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <span
              style={{ textDecoration: todo.done ? 'line-through' : 'none' }}
              onClick={() => toggleTodo(todo.id)}
            >
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>X</button>
          </li>
        ))}
      </ul>
      <p>{todos.filter(t => !t.done).length} remaining</p>
    </div>
  );
}
```

If you can write this without looking at the example, your Angular knowledge has transferred. Move on.

### The Mental Model Shift

The biggest difference is not syntax. It is rendering philosophy.

**Angular:** Change detection runs, walks the component tree, updates the DOM where bindings changed. You think in terms of "when does change detection run?"

**React:** When you call setState, React re-renders that component and its children. The entire function runs again. JSX produces a new virtual DOM. React diffs it with the previous one and patches the real DOM.

This means: in React, your component function is called on every render. Variables declared inside it are recreated. Only `useState` values persist between renders. This is why hooks exist -- they are the mechanism for persisting things across renders.

```tsx
function Counter() {
  // This ENTIRE function runs on every render
  const [count, setCount] = useState(0); // useState preserves value across renders
  const doubled = count * 2; // Recomputed every render (like a pipe)

  console.log('Rendered!'); // You'll see this on every state change

  return <div>{count} x 2 = {doubled}</div>;
}
```

## Key Insight

React is Angular minus opinions. No module system, no DI, no RxJS, no CLI-enforced structure. This is both its strength (flexibility, simplicity) and weakness (every project looks different). For AI applications, this simplicity is an advantage -- you want thin, fast UIs that get out of the way of the AI functionality. You do not need Angular's enterprise architecture for a chat interface.

## Resources

- [React docs - Learn](https://react.dev/learn) -- the official tutorial, genuinely excellent
- [React docs - Thinking in React](https://react.dev/learn/thinking-in-react) -- the mental model page
- [React for Angular developers](https://reactforAngular.dev/) -- if it exists, great reference
- [TypeScript + React cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Done When

- [ ] You can write a React component from memory without looking at examples
- [ ] You understand useState, useEffect, useRef, and useMemo
- [ ] The translation table is burned into your brain
- [ ] You built the todo list (or something equivalent) in under 30 minutes
- [ ] You can explain why React re-renders and how useState persists values

---

*Tomorrow: Next.js App Router -- the biggest mental shift of this week. Components that run on the server. No, really.*
