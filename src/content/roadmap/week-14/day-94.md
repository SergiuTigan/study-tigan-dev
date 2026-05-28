---
title: "Day 94 — Frontend Scaffold"
week: 14
day: 94
phase: 4
phaseLabel: "Portfolio"
order: 1494
type: "day"
---
# Day 94 — Frontend Scaffold

> *"Good UI makes AI feel intelligent. Bad UI makes it feel broken."*

**Date:** Wednesday, 20 August 2025
**Hours:** 2h · Evening session
**Topic:** Frontend Pages, Components & Layout
**Phase:** Faza 4 — Portfolio + Job Hunt · Week 14

---

## What You're Doing

Today you build the shell your users will see. Pages, layout, components, basic styling. By the end of this session, you should have a navigable app that looks like a product — even if the AI integration isn't wired up yet.

Think of today as building a movie set. It needs to look real from the front, even if the back is plywood.

## The Work

### 1. Install UI Primitives (10 min)

```bash
npx shadcn@latest init
npx shadcn@latest add button input card textarea scroll-area
```

This gives you production-quality components instantly. Don't build custom buttons. Ever.

### 2. Layout Structure (25 min)

Build your app shell:

```typescript
// src/app/layout.tsx — global layout
// Header with logo + nav
// Main content area
// Optional: sidebar for history/navigation
```

Key decisions:
- **Full-width chat layout** (like ChatGPT) — good for conversational apps
- **Dashboard layout** (sidebar + main) — good for tools with multiple views
- **Single-page app** (hero + interaction) — good for focused tools

Pick one. Commit. Move on.

### 3. Core Pages (40 min)

Build the pages from your wireframe:

**Main interaction page** (this is 80% of your time):
- Input area (text input, textarea, or form)
- Response display area
- Loading states
- Empty states ("Start a conversation" or similar)

**Landing page** (optional but impressive):
- Hero section: what it does in one line
- 3 features/benefits
- CTA button → main app

**Any secondary pages:**
- History, settings, about — keep minimal

### 4. Component Library (30 min)

Build your app-specific components:

```
ChatInput.tsx — user input with send button
ChatMessage.tsx — single message bubble (user vs AI)
ChatHistory.tsx — scrollable message list
LoadingIndicator.tsx — streaming/thinking state
EmptyState.tsx — when no conversation exists
```

Each component should:
- Accept props with TypeScript interfaces
- Handle its own loading/error states
- Look good with Tailwind defaults

### 5. Basic Styling Pass (15 min)

- Consistent spacing (use Tailwind's spacing scale)
- Typography hierarchy (headings, body, captions)
- Color scheme (stick to 2-3 colors max)
- Dark mode support (if easy — Tailwind makes this trivial)

## Tips for Efficiency

- **Copy shadcn/ui examples directly.** Their docs have full component examples. Adapt, don't invent.
- **Use placeholder data.** Hardcode fake messages, fake responses. It helps you design the layout without needing the backend.
- **Mobile-first.** Start with mobile layout, add desktop breakpoints. It's easier this direction.
- **Don't touch fonts.** System font stack or Inter. That's it.

## Key Insight

The frontend doesn't need to be connected to the backend yet. Tomorrow you'll wire everything together. Today's goal is: if someone opened this in a browser, they'd think "this looks like a real product" — even with hardcoded data.

## Done When

- [ ] App layout complete (header, main area, optional sidebar)
- [ ] Main interaction page built with all components
- [ ] Landing page exists (even if minimal)
- [ ] All components render without errors
- [ ] Placeholder/hardcoded data shows the UI working
- [ ] Basic responsive design (doesn't break on mobile)
- [ ] It looks like a product, not a tutorial exercise

---

*Tomorrow: The critical day. You'll connect frontend to backend and get the full AI flow working end-to-end.*
