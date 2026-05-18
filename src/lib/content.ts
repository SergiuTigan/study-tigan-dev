import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "src", "content");

export interface DayInfo {
  slug: string; // e.g. "day-01"
  number: number;
  title: string;
  weekSlug: string;
}

export interface WeekInfo {
  slug: string; // e.g. "week-01"
  number: number;
  title: string;
  phase: string;
  days: DayInfo[];
}

function extractTitle(content: string): string {
  const firstLine = content.split("\n")[0];
  return firstLine.replace(/^#\s*/, "").trim();
}

function extractPhase(content: string): string {
  const match = content.match(/\*\*Phase:\*\*\s*(.+)/);
  return match ? match[1].trim() : "";
}

export function getWeeks(): WeekInfo[] {
  const weekDirs = fs
    .readdirSync(contentDir)
    .filter((d) => d.startsWith("week-"))
    .sort((a, b) => {
      const numA = parseInt(a.replace("week-", ""));
      const numB = parseInt(b.replace("week-", ""));
      return numA - numB;
    });

  return weekDirs.map((weekSlug) => {
    const weekPath = path.join(contentDir, weekSlug);
    const introPath = path.join(weekPath, "week-intro.md");
    const introContent = fs.readFileSync(introPath, "utf-8");
    const weekNumber = parseInt(weekSlug.replace("week-", ""));

    const dayFiles = fs
      .readdirSync(weekPath)
      .filter((f) => f.startsWith("day-") && f.endsWith(".md"))
      .sort((a, b) => {
        const numA = parseInt(a.replace("day-", "").replace(".md", ""));
        const numB = parseInt(b.replace("day-", "").replace(".md", ""));
        return numA - numB;
      });

    const days: DayInfo[] = dayFiles.map((dayFile) => {
      const daySlug = dayFile.replace(".md", "");
      const dayContent = fs.readFileSync(path.join(weekPath, dayFile), "utf-8");
      const dayNumber = parseInt(daySlug.replace("day-", ""));
      return {
        slug: daySlug,
        number: dayNumber,
        title: extractTitle(dayContent),
        weekSlug,
      };
    });

    return {
      slug: weekSlug,
      number: weekNumber,
      title: extractTitle(introContent),
      phase: extractPhase(introContent),
      days,
    };
  });
}

export function getWeekContent(weekSlug: string): string {
  const introPath = path.join(contentDir, weekSlug, "week-intro.md");
  return fs.readFileSync(introPath, "utf-8");
}

export function getDayContent(weekSlug: string, daySlug: string): string {
  const dayPath = path.join(contentDir, weekSlug, `${daySlug}.md`);
  return fs.readFileSync(dayPath, "utf-8");
}

export function getAdjacentDay(
  weekSlug: string,
  daySlug: string,
  direction: "prev" | "next"
): { weekSlug: string; daySlug: string } | null {
  const weeks = getWeeks();
  const allDays: { weekSlug: string; daySlug: string }[] = [];

  for (const week of weeks) {
    for (const day of week.days) {
      allDays.push({ weekSlug: week.slug, daySlug: day.slug });
    }
  }

  const currentIndex = allDays.findIndex(
    (d) => d.weekSlug === weekSlug && d.daySlug === daySlug
  );

  if (currentIndex === -1) return null;

  const targetIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
  return allDays[targetIndex] ?? null;
}
