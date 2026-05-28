---
title: "Day 98 — README + Demo Video + Ship"
week: 14
day: 98
phase: 4
phaseLabel: "Portfolio"
order: 1498
type: "day"
---
# Day 98 — README + Demo Video + Ship

> *"Your README is your project's handshake. Your demo video is the pitch. Make both count."*

**Date:** Sunday, 24 August 2025
**Hours:** 6h · Full session
**Topic:** Project Documentation & Presentation
**Phase:** Faza 4 — Portfolio + Job Hunt · Week 14

---

## What You're Doing

Today you package your project for the world. The code is done. The app is deployed. Now you make it presentable. A stellar README and a 2-3 minute demo video will do more for your job search than another feature ever could.

This is marketing day. You're selling your skills through this project.

## The Work

### Hours 1-2: Professional README (120 min)

Your README should follow this structure:

```markdown
# Project Name

One-line description of what it does.

[Live Demo](https://...) · [Demo Video](https://...) · [Blog Post](https://...)

![Screenshot or GIF of the app](./docs/screenshot.png)

## What It Does

2-3 sentences. What problem does it solve? Who is it for?

## Key Features

- Feature 1: brief description
- Feature 2: brief description
- Feature 3: brief description

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, shadcn/ui
- **AI:** OpenAI GPT-4o / Anthropic Claude via Vercel AI SDK
- **Database:** Supabase / Prisma
- **Deployment:** Vercel

## Architecture

Brief description + architecture diagram (use Mermaid or an image).

## Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key (or Anthropic)

### Installation
\```bash
git clone https://github.com/yourusername/project-name
cd project-name
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
\```

## AI Implementation Details

This is your differentiator. Describe:
- What AI model(s) you use and why
- How you handle context/memory
- Prompt engineering approach
- Any RAG, tool use, or agent patterns
- Performance metrics if available

## What I Learned

3-5 bullet points about technical insights gained.

## Future Improvements

3-5 things you'd add with more time (shows you think about products, not just code).

## License

MIT
```

**Quality Checks for README:**
- [ ] Screenshot/GIF is above the fold
- [ ] Live demo link works
- [ ] Getting started actually works (clone and test it yourself)
- [ ] No typos
- [ ] Reads well in under 2 minutes
- [ ] `.env.example` file exists with placeholder values

### Hours 3-4: Demo Video (120 min)

Record a 2-3 minute Loom video. Structure:

**0:00-0:15 — Hook**
"This is [Project Name], an AI-powered [description]. Let me show you how it works."

**0:15-1:30 — Core Demo**
Walk through the main user flow. Show the AI doing its thing. Highlight the magic moment.

**1:30-2:15 — Technical Highlight**
"Under the hood, this uses [architecture point]. I designed it this way because [reasoning]."

**2:15-2:45 — Results/Impact**
"The system handles [edge case], maintains [quality metric], and costs [$/interaction]."

**2:45-3:00 — Close**
"Built in one week as part of my AI engineering portfolio. Code is on GitHub, link in the description."

**Video Tips:**
- Script it first. Don't wing it.
- Record your screen + camera (Loom makes this easy)
- Use a clean browser (no bookmarks bar, no notifications)
- Zoom in so text is readable
- Edit out mistakes (Loom has basic editing)
- Record 3 takes. Use the best one.

### Hours 5-6: Final Push + Verify (120 min)

**Code Cleanup**
- [ ] Remove all `console.log` statements
- [ ] Remove commented-out code
- [ ] Ensure consistent code formatting
- [ ] Add JSDoc comments to complex functions
- [ ] Verify no API keys in code

**Repository Polish**
- [ ] `.gitignore` is complete
- [ ] `.env.example` file exists
- [ ] License file exists
- [ ] No large files committed (check `.git` size)

**Final Verification**
- [ ] Clone repo to a new folder
- [ ] Follow your own README instructions
- [ ] Does it work from scratch?
- [ ] Production URL still working?
- [ ] Demo video link accessible?

**Ship It**
- [ ] Push final commit
- [ ] Pin repo on GitHub profile
- [ ] Share on Twitter/X: "Just shipped [Project Name] — [what it does]. Built with [stack]. [Live URL]"
- [ ] Bookmark everything for Week 17 (branding week)

## Key Insight

The README and demo video will get 10x more views than your code. Hiring managers watch the video, skim the README, and maybe glance at one or two files. Invest accordingly. A mediocre app with a great README beats a great app with no README every single time.

## Done When

- [ ] README is complete, polished, and includes screenshot
- [ ] Demo video recorded, edited, and uploaded
- [ ] Code is clean, well-commented, and organized
- [ ] `.env.example` exists and README instructions work
- [ ] Final commit pushed, repo pinned on GitHub
- [ ] You've shared it somewhere public
- [ ] Project #1 is SHIPPED

---

*Next week: Project #2. Same cadence, different project. You know the drill now.*
