import Link from "next/link";
import { getWeeks } from "@/lib/content";

const phaseConfig: Record<
  string,
  { label: string; color: string; border: string; bg: string; icon: string }
> = {
  "1": {
    label: "Foundations",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  "2": {
    label: "Deep Dive",
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
  },
  "3": {
    label: "Production",
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  },
  "4": {
    label: "Portfolio & Job Hunt",
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
};

function getPhaseNumber(phase: string): string {
  const match = phase.match(/(\d)/);
  return match ? match[1] : "1";
}

export default function DashboardPage() {
  const weeks = getWeeks();
  const totalDays = weeks.reduce((sum, w) => sum + w.days.length, 0);

  const phases = new Map<string, typeof weeks>();
  for (const week of weeks) {
    const pNum = getPhaseNumber(week.phase);
    if (!phases.has(pNum)) phases.set(pNum, []);
    phases.get(pNum)!.push(week);
  }

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="max-w-5xl mx-auto px-6 py-12 lg:py-16">
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            AI Engineer Roadmap
          </h1>
          <p className="text-zinc-400 mt-3 text-lg max-w-2xl">
            From Senior Angular Developer to AI Engineer in 20 weeks. Structured,
            hands-on, project-driven.
          </p>

          <div className="flex flex-wrap gap-6 mt-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {weeks.length}
                </p>
                <p className="text-xs text-zinc-500">Weeks</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{totalDays}</p>
                <p className="text-xs text-zinc-500">Lessons</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">450+</p>
                <p className="text-xs text-zinc-500">Hours</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">4</p>
                <p className="text-xs text-zinc-500">Phases</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {Array.from(phases.entries()).map(([phaseNum, phaseWeeks]) => {
          const config = phaseConfig[phaseNum] || phaseConfig["1"];
          return (
            <div key={phaseNum} className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}
                >
                  <svg
                    className={`w-4 h-4 ${config.color}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={config.icon}
                    />
                  </svg>
                </div>
                <h2 className={`text-lg font-semibold ${config.color}`}>
                  Phase {phaseNum}: {config.label}
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {phaseWeeks.map((week) => {
                  const weekTitle = week.title
                    .replace(/^Week \d+[\s:—-]+/, "")
                    .trim();

                  return (
                    <Link
                      key={week.slug}
                      href={`/week/${week.slug}`}
                      className={`group block rounded-xl border ${config.border} ${config.bg} p-4 hover:border-zinc-700 transition-all hover:scale-[1.01]`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-mono text-zinc-600">
                          Week {week.number}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono">
                          {week.days.length} days
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-zinc-200 mt-2 group-hover:text-white transition-colors">
                        {weekTitle}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
