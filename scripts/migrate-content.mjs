/**
 * One-time migration script: moves weeks 1-12, 14-16 from backup to Astro content collections.
 * Adds YAML frontmatter extracted from markdown body.
 *
 * Usage: node scripts/migrate-content.mjs
 */

import fs from "fs";
import path from "path";

const BACKUP_DIR = "/tmp/study-content-backup";
const OUT_DIR = path.resolve("src/content/roadmap");

const KEEP_WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16];

function extractTitle(content) {
  const line = content.split("\n")[0];
  return line.replace(/^#\s*/, "").trim();
}

function extractPhase(content) {
  const match = content.match(/\*\*Phase:\*\*\s*Faza\s*(\d)/);
  return match ? parseInt(match[1]) : 1;
}

function phaseLabel(num) {
  const labels = { 1: "Foundations", 2: "Deep Dive", 3: "Production", 4: "Portfolio" };
  return labels[num] || "Foundations";
}

for (const weekNum of KEEP_WEEKS) {
  const weekSlug = `week-${weekNum.toString().padStart(2, "0")}`;
  const srcDir = path.join(BACKUP_DIR, weekSlug);

  if (!fs.existsSync(srcDir)) {
    console.log(`Skipping ${weekSlug} — not found`);
    continue;
  }

  const outWeekDir = path.join(OUT_DIR, weekSlug);
  fs.mkdirSync(outWeekDir, { recursive: true });

  // Week intro
  const introPath = path.join(srcDir, "week-intro.md");
  if (fs.existsSync(introPath)) {
    const raw = fs.readFileSync(introPath, "utf-8");
    const title = extractTitle(raw);
    const phase = extractPhase(raw);

    const frontmatter = [
      "---",
      `title: "${title.replace(/"/g, '\\"')}"`,
      `week: ${weekNum}`,
      `phase: ${phase}`,
      `phaseLabel: "${phaseLabel(phase)}"`,
      `order: ${weekNum * 100}`,
      `type: "week-intro"`,
      "---",
      "",
    ].join("\n");

    fs.writeFileSync(path.join(outWeekDir, "week-intro.md"), frontmatter + raw);
    console.log(`✓ ${weekSlug}/week-intro.md`);
  }

  // Days
  const dayFiles = fs
    .readdirSync(srcDir)
    .filter((f) => f.startsWith("day-") && f.endsWith(".md"))
    .sort();

  for (const dayFile of dayFiles) {
    const raw = fs.readFileSync(path.join(srcDir, dayFile), "utf-8");
    const title = extractTitle(raw);
    const phase = extractPhase(raw);
    const dayNum = parseInt(dayFile.replace("day-", "").replace(".md", ""));

    const frontmatter = [
      "---",
      `title: "${title.replace(/"/g, '\\"')}"`,
      `week: ${weekNum}`,
      `day: ${dayNum}`,
      `phase: ${phase}`,
      `phaseLabel: "${phaseLabel(phase)}"`,
      `order: ${weekNum * 100 + dayNum}`,
      `type: "day"`,
      "---",
      "",
    ].join("\n");

    fs.writeFileSync(path.join(outWeekDir, dayFile), frontmatter + raw);
    console.log(`✓ ${weekSlug}/${dayFile}`);
  }
}

console.log("\nMigration complete.");
