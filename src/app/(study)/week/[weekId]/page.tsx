import { notFound } from "next/navigation";
import Link from "next/link";
import { getWeeks, getWeekContent } from "@/lib/content";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export function generateStaticParams() {
  const weeks = getWeeks();
  return weeks.map((w) => ({ weekId: w.slug }));
}

export default async function WeekPage({
  params,
}: {
  params: Promise<{ weekId: string }>;
}) {
  const { weekId } = await params;
  const weeks = getWeeks();
  const week = weeks.find((w) => w.slug === weekId);

  if (!week) notFound();

  const content = getWeekContent(weekId);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-600 mb-6">
        <Link href="/" className="hover:text-zinc-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-zinc-400">Week {week.number}</span>
      </nav>

      {/* Content */}
      <MarkdownRenderer content={content} />

      {/* Day cards */}
      <div className="mt-10 border-t border-zinc-800 pt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Lessons</h2>
        <div className="grid gap-2">
          {week.days.map((day) => {
            const dayTitle = day.title
              .replace(/^Day \d+[\s:—-]+/, "")
              .trim();

            return (
              <Link
                key={day.slug}
                href={`/week/${weekId}/day/${day.slug}`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group"
              >
                <span className="text-xs font-mono text-zinc-600 w-8 shrink-0">
                  D{day.number}
                </span>
                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                  {dayTitle}
                </span>
                <svg
                  className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 ml-auto shrink-0 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
