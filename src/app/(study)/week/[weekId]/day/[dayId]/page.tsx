import { notFound } from "next/navigation";
import Link from "next/link";
import { getWeeks, getDayContent, getAdjacentDay } from "@/lib/content";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export function generateStaticParams() {
  const weeks = getWeeks();
  const params: { weekId: string; dayId: string }[] = [];
  for (const week of weeks) {
    for (const day of week.days) {
      params.push({ weekId: week.slug, dayId: day.slug });
    }
  }
  return params;
}

export default async function DayPage({
  params,
}: {
  params: Promise<{ weekId: string; dayId: string }>;
}) {
  const { weekId, dayId } = await params;
  const weeks = getWeeks();
  const week = weeks.find((w) => w.slug === weekId);
  if (!week) notFound();

  const day = week.days.find((d) => d.slug === dayId);
  if (!day) notFound();

  let content: string;
  try {
    content = getDayContent(weekId, dayId);
  } catch {
    notFound();
  }

  const prev = getAdjacentDay(weekId, dayId, "prev");
  const next = getAdjacentDay(weekId, dayId, "next");

  const prevDay = prev
    ? weeks
        .find((w) => w.slug === prev.weekSlug)
        ?.days.find((d) => d.slug === prev.daySlug)
    : null;
  const nextDay = next
    ? weeks
        .find((w) => w.slug === next.weekSlug)
        ?.days.find((d) => d.slug === next.daySlug)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-600 mb-6">
        <Link href="/" className="hover:text-zinc-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/week/${weekId}`}
          className="hover:text-zinc-400 transition-colors"
        >
          Week {week.number}
        </Link>
        <span>/</span>
        <span className="text-zinc-400">Day {day.number}</span>
      </nav>

      {/* Content */}
      <MarkdownRenderer content={content} />

      {/* Prev/Next */}
      <div className="mt-12 pt-8 border-t border-zinc-800 flex items-stretch gap-3">
        {prev && prevDay ? (
          <Link
            href={`/week/${prev.weekSlug}/day/${prev.daySlug}`}
            className="flex-1 flex flex-col items-start px-4 py-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group"
          >
            <span className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
              Previous
            </span>
            <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">
              {prevDay.title.replace(/^Day \d+[\s:—-]+/, "").trim()}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {next && nextDay ? (
          <Link
            href={`/week/${next.weekSlug}/day/${next.daySlug}`}
            className="flex-1 flex flex-col items-end text-right px-4 py-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group"
          >
            <span className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
              Next
            </span>
            <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">
              {nextDay.title.replace(/^Day \d+[\s:—-]+/, "").trim()}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
