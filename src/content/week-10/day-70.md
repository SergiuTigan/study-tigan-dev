# Day 70 -- Ship Portfolio Piece #4: Generative UI App

> *"A deployed application with a demo video is worth more than ten GitHub repos with README stubs."*

**Date:** Duminica, 27 Iulie 2025
**Hours:** 5h · Full session
**Topic:** Deployment, Documentation, Demo Recording
**Phase:** Faza 3 -- Production · Week 10

---

## What You're Doing

Today you ship. Not "finish coding." Ship. That means deployed on a public URL, documented with a README that tells a story, and demonstrated with a video that shows the app in action. This is your biggest portfolio piece -- the one that combines React, Next.js, AI SDK, streaming, tool use, and generative UI into a single, impressive application.

When a recruiter or hiring manager visits your GitHub profile, this is the project that stops them scrolling.

## The Work

### Hour 1: Final Fixes and Welcome Experience

Add a compelling welcome message and ensure first-time users know what they can do:

```tsx
// src/components/WelcomeScreen.tsx
export function WelcomeScreen({ onPromptClick }: { onPromptClick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
        <span className="text-3xl font-bold text-white">AI</span>
      </div>

      <h2 className="text-3xl font-bold text-center dark:text-white mb-2">
        Welcome to TravelAI
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        I can search flights, check weather, compare destinations, and plan
        itineraries -- all with interactive UI components.
      </p>

      <div className="w-full max-w-xl">
        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 text-center">
          Try asking
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { text: 'Find flights from Bucharest to Barcelona', icon: 'plane' },
            { text: 'What\'s the weather in Tokyo?', icon: 'sun' },
            { text: 'Compare Lisbon vs Porto for a weekend', icon: 'scale' },
            { text: 'Plan 3 days in Rome', icon: 'map' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => onPromptClick(item.text)}
              className="text-left p-4 border dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        Powered by Claude + Vercel AI SDK
      </p>
    </div>
  );
}
```

### Hour 2: Deploy to Vercel

**Step 1: Prepare for deployment**

Make sure your `.env.local` is in `.gitignore` (it should be by default).

Create a `.env.example` file:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Step 2: Push to GitHub**

```bash
git init
git add .
git commit -m "feat: generative UI travel assistant with streaming components"
git remote add origin https://github.com/YOUR_USERNAME/gen-ui-travel-ai.git
git branch -M main
git push -u origin main
```

**Step 3: Deploy on Vercel**

```bash
npm i -g vercel
vercel

# Or go to vercel.com/new and import your GitHub repo
```

When prompted for environment variables, add your `ANTHROPIC_API_KEY`.

**Step 4: Verify the deployment**

Visit your Vercel URL. Test every tool. Test on mobile (use your phone). Fix anything that is broken in production but worked locally.

**Important considerations for production:**
- Add rate limiting if your app is public (or use Vercel's edge middleware)
- Consider adding a simple auth gate if you do not want unlimited API usage
- Set a reasonable `maxTokens` to control costs

### Hour 3: Write the README

Your README should tell a story, not just list features. Here is a template:

```markdown
# TravelAI -- Generative UI Travel Assistant

> An AI-powered travel assistant that responds with interactive UI components,
> not just text. Built with Next.js, Vercel AI SDK, and Claude.

[Live Demo](https://your-app.vercel.app) · [Demo Video](https://www.loom.com/share/xxx)

## What Makes This Different

Traditional chatbots respond with text. TravelAI responds with **interactive
components**. Ask about flights and get a sortable flight card. Ask about
weather and get a live weather widget. Ask to compare destinations and get
a side-by-side comparison table.

The AI decides what UI to render based on your question. No menus. No
navigation. Just describe what you need.

## Features

- **Generative UI**: AI streams React components as responses
- **4 Interactive Tools**: Flight search, weather, destination comparison,
  itinerary planning
- **Streaming UX**: Loading skeletons → resolved components with smooth
  transitions
- **Multi-turn Conversation**: Full context awareness across the chat
- **Dark Mode**: Complete dark mode support
- **Mobile Responsive**: Works on all screen sizes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI**: Claude Sonnet via Vercel AI SDK (`streamUI`)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## Architecture

```
User Input → Server Action → streamUI → Tool Selection → Component Generation

Tools:
├── searchFlights → FlightCard component
├── checkWeather → WeatherCard component (real Open-Meteo data)
├── compareDestinations → ComparisonTable component
└── createItinerary → ItineraryCard component

Each tool:
1. Yields a loading skeleton (instant feedback)
2. Fetches data / generates content
3. Returns an interactive React component
```

## Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/gen-ui-travel-ai.git
cd gen-ui-travel-ai
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

## Key Technical Decisions

1. **`streamUI` over `streamText`**: Enables component streaming, not just
   text streaming. The AI's tool calls render React components directly.

2. **Server Actions over API Routes**: `streamUI` requires server actions
   for RSC streaming. This also simplifies the architecture.

3. **Loading skeletons per tool**: Each tool has a custom skeleton that
   matches the final component's layout, preventing layout shift.

4. **Real APIs where possible**: Weather uses Open-Meteo (free, no key).
   Other tools use AI-generated data with realistic schemas.

## What I Learned

- Server Components enable patterns impossible in traditional SPAs
- The `yield/return` pattern in async generators is perfect for loading states
- Generative UI blurs the line between chatbots and applications
- AI SDK's provider abstraction makes multi-model support trivial

---

Built by [Your Name] as part of an AI Engineering learning path.
```

### Hour 4: Record Demo Video

Use Loom (free) or QuickTime to record a 2-3 minute demo:

**Script outline:**
1. (0:00-0:15) "This is [App Name], a generative UI application where AI responds with interactive components, not just text."
2. (0:15-0:45) Show the welcome screen. Click an example prompt. Show the loading skeleton transitioning to a component.
3. (0:45-1:30) Demonstrate 2-3 different tools. Show how the same chat interface produces completely different UIs based on what you ask.
4. (1:30-2:00) Show a text response (for a question that does not need a tool). Show the conversation context working.
5. (2:00-2:30) Quick dark mode toggle. Show mobile responsiveness (resize the window).
6. (2:30-3:00) "Built with Next.js, Vercel AI SDK, and Claude. The AI decides what component to render based on the conversation. Every tool has loading states and error handling. [Link in description]."

Tips:
- Practice once before recording
- Use a clean browser profile (no bookmarks bar, no extensions)
- Clear the chat between demos so each interaction is fresh
- Speak slowly and clearly
- Show the URL bar so people know it is a real deployed app

### Hour 5: Final Push and Portfolio Update

```bash
# Add the demo video link and any final changes
git add .
git commit -m "docs: add README with demo video, architecture docs"
git push
```

**Update your portfolio/LinkedIn/personal site:**
- Add this project to your portfolio
- Pin the repo on GitHub
- If you have a personal site, add it to your projects page

**Quick portfolio inventory at this point:**
1. CLI Tool (Faza 2) -- command-line AI assistant
2. RAG System (Faza 2) -- document Q&A with vector search
3. Research Agent (Faza 2) -- multi-step autonomous agent
4. **Generative UI App (Faza 3) -- THIS ONE** -- interactive AI-powered frontend

Four deployed projects. Each demonstrates different AI engineering skills. The Gen UI app is the crown jewel because it is the most visual and the most technically ambitious.

## Key Insight

Shipping is a skill separate from coding. Many developers build impressive things that nobody sees because they never deploy, never document, never demo. The README you wrote today, the video you recorded, the Vercel deployment -- these are force multipliers. One hiring manager watching your 3-minute Loom video learns more about your capabilities than they would from reading your resume. Ship early, ship visibly, ship with documentation.

## Resources

- [Vercel Deployment Guide](https://vercel.com/docs/getting-started-with-vercel)
- [Loom](https://www.loom.com/) -- free screen recording
- [README best practices](https://github.com/matiassingers/awesome-readme)
- [GitHub profile README](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme)

## Done When

- [ ] App is deployed to Vercel with a public URL
- [ ] All tools work on the deployed version
- [ ] README tells a story: what, why, how, architecture
- [ ] Demo video recorded (2-3 min) and linked in README
- [ ] GitHub repo is pushed and pinned on your profile
- [ ] You texted the Vercel link to a friend and asked them to try it
- [ ] Portfolio piece #4 is COMPLETE

---

*Week 10 complete. You shipped a Generative UI application. Next week: making everything production-grade with observability, caching, and cost optimization.*
