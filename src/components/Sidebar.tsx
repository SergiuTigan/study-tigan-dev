"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { WeekInfo } from "@/lib/content";

const phaseColors: Record<string, string> = {
  "1": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "2": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "3": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "4": "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function getPhaseNumber(phase: string): string {
  const match = phase.match(/(\d)/);
  return match ? match[1] : "1";
}

function getPhaseLabel(phase: string): string {
  if (phase.includes("1")) return "Foundations";
  if (phase.includes("2")) return "Deep Dive";
  if (phase.includes("3")) return "Production";
  if (phase.includes("4")) return "Portfolio";
  return "";
}

export default function Sidebar({ weeks }: { weeks: WeekInfo[] }) {
  const pathname = usePathname();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(() => {
    const current = weeks.find(
      (w) =>
        pathname.includes(w.slug) ||
        w.days.some((d) => pathname.includes(d.slug))
    );
    return current ? new Set([current.slug]) : new Set<string>();
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleWeek(slug: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  // Group weeks by phase
  const phases = new Map<string, WeekInfo[]>();
  for (const week of weeks) {
    const pNum = getPhaseNumber(week.phase);
    if (!phases.has(pNum)) phases.set(pNum, []);
    phases.get(pNum)!.push(week);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-5 border-b border-zinc-800/80">
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">
              AI Engineer
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Roadmap</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 py-3">
        {Array.from(phases.entries()).map(([phaseNum, phaseWeeks]) => (
          <div key={phaseNum} className="mb-4">
            <div className="px-2 mb-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${phaseColors[phaseNum] || phaseColors["1"]}`}
              >
                Phase {phaseNum} &middot; {getPhaseLabel(phaseWeeks[0]?.phase || "")}
              </span>
            </div>

            {phaseWeeks.map((week) => {
              const isExpanded = expandedWeeks.has(week.slug);
              const isWeekActive = pathname === `/week/${week.slug}`;
              const weekTitle = week.title
                .replace(/^Week \d+[\s:—-]+/, "")
                .trim();

              return (
                <div key={week.slug} className="mb-0.5">
                  <button
                    onClick={() => toggleWeek(week.slug)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors text-sm ${
                      isWeekActive
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }`}
                  >
                    <svg
                      className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="text-xs font-mono text-zinc-600 w-5 shrink-0">
                      {week.number.toString().padStart(2, "0")}
                    </span>
                    <span className="truncate text-[13px]">{weekTitle}</span>
                  </button>

                  {isExpanded && (
                    <div className="ml-5 pl-3 border-l border-zinc-800 mt-0.5 mb-1">
                      <Link
                        href={`/week/${week.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className={`block px-2 py-1 rounded text-xs transition-colors mb-0.5 ${
                          isWeekActive
                            ? "text-indigo-400 bg-indigo-500/10"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                      >
                        Week Overview
                      </Link>
                      {week.days.map((day) => {
                        const isDayActive =
                          pathname ===
                          `/week/${week.slug}/day/${day.slug}`;
                        const dayTitle = day.title
                          .replace(/^Day \d+[\s:—-]+/, "")
                          .trim();

                        return (
                          <Link
                            key={day.slug}
                            href={`/week/${week.slug}/day/${day.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className={`block px-2 py-1 rounded text-xs transition-colors ${
                              isDayActive
                                ? "text-indigo-400 bg-indigo-500/10"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                            }`}
                          >
                            <span className="font-mono text-[10px] text-zinc-600 mr-1.5">
                              D{day.number}
                            </span>
                            <span className="truncate">{dayTitle}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800/80">
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors w-full"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {mobileOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-zinc-950 border-r border-zinc-800/80 transform transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
