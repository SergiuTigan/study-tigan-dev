# Day 97 — Polish + Deploy

> *"Deployed beats perfect. But deployed AND polished beats everything."*

**Date:** Saturday, 23 August 2025
**Hours:** 4h · Deep work session
**Topic:** Error Handling, UI Polish & Deployment
**Phase:** Faza 4 — Portfolio + Job Hunt · Week 14

---

## What You're Doing

Today you transform a working prototype into a deployed product. You have 4 hours — split them wisely: 2 hours polishing, 1 hour on edge cases, 1 hour deploying.

A hiring manager will spend 30 seconds on your project. In those 30 seconds, they'll notice: Does it load fast? Does it look professional? Does it handle errors? Is it on a real URL? Today makes those 30 seconds count.

## The Work

### Hour 1-2: UI Polish (120 min)

**Visual Polish**
- [ ] Consistent spacing throughout (8px grid)
- [ ] Typography hierarchy clear (h1 > h2 > body > caption)
- [ ] Color palette consistent (max 3 colors + neutrals)
- [ ] Loading states for every async action
- [ ] Empty states that guide the user
- [ ] Hover/focus states on interactive elements

**Responsive Design**
- [ ] Mobile layout works (test at 375px width)
- [ ] Tablet layout works (test at 768px)
- [ ] Desktop layout works (test at 1440px)
- [ ] No horizontal scrolling at any breakpoint
- [ ] Touch targets are large enough on mobile (min 44px)

**Micro-interactions**
- [ ] Button feedback on click
- [ ] Smooth transitions between states
- [ ] Scroll behavior is smooth
- [ ] AI response appears with subtle animation

### Hour 3: Edge Cases & Error Handling (60 min)

**Input Edge Cases**
- [ ] Empty input → prevented or handled
- [ ] Very long input → truncated or warned
- [ ] Special characters → handled correctly
- [ ] Rapid submissions → debounced
- [ ] Double-click send → prevented

**Error States**
- [ ] API failure → user-friendly error message + retry
- [ ] Rate limit hit → "Please wait" message
- [ ] Network offline → detected and communicated
- [ ] Slow response → timeout after 30s with message

**AI Edge Cases**
- [ ] AI returns empty response → fallback
- [ ] AI response very long → scrollable container
- [ ] Markdown in AI response → rendered properly
- [ ] Code blocks in response → syntax highlighted

### Hour 4: Deploy to Vercel (60 min)

**Pre-deploy Checklist**
- [ ] All environment variables listed
- [ ] No API keys in code
- [ ] Build passes locally: `npm run build`
- [ ] No TypeScript errors
- [ ] No console.log statements in production code

**Deploy**
```bash
# If not already connected:
npx vercel link
# Deploy:
npx vercel --prod
```

Or push to GitHub and connect via Vercel dashboard (recommended — enables auto-deploys).

**Post-deploy Verification**
- [ ] Site loads at production URL
- [ ] AI features work with production API keys
- [ ] Database connects in production
- [ ] No CORS or mixed content errors
- [ ] Open Graph meta tags set (for link previews)
- [ ] Favicon exists

**Custom Domain (optional bonus)**
If you have a domain, add it. `project-name.yourdomain.com` looks more professional than `project-name.vercel.app`.

## Tips for Efficiency

- **Polish the demo flow first.** The path you'll show in your video should be flawless. Other paths can be good-enough.
- **Use Lighthouse.** Run a quick audit. Aim for 90+ performance, 100 accessibility.
- **Screenshot before/after.** You'll want these for your README and blog post.
- **If deploy fails, check build logs.** 90% of Vercel deploy failures are missing env vars or build errors that don't show locally.

## Key Insight

The difference between a student project and a portfolio piece is polish. Not complexity. Not AI sophistication. Polish. A simple app that handles every edge case and looks beautiful beats a complex app that crashes on mobile.

## Done When

- [ ] UI looks professional at all screen sizes
- [ ] All edge cases handled gracefully
- [ ] No console errors in production
- [ ] Deployed to Vercel with production URL
- [ ] All features work in production
- [ ] You'd be comfortable showing this to an interviewer right now

---

*Tomorrow: README, demo video, and ship. The packaging that makes the product.*
