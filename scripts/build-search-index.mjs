/**
 * Build-time script: generates public/search-index.json from all content collections.
 * Run before astro build: node scripts/build-search-index.mjs
 */

import fs from "fs";
import path from "path";

const CONTENT_DIR = path.resolve("src/content");
const OUT_FILE = path.resolve("public/search-index.json");

const sections = ["reference", "journal", "templates", "roadmap", "courses", "lessons"];
const index = [];

function extractPreview(content, maxLen = 200) {
  // Strip frontmatter
  const body = content.replace(/^---[\s\S]*?---\n*/, "");
  // Strip markdown syntax
  const plain = body
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*|__|[*_]/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  return plain.slice(0, maxLen);
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) {
      fm[key.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "");
    }
  }
  return fm;
}

for (const section of sections) {
  const sectionDir = path.join(CONTENT_DIR, section);
  if (!fs.existsSync(sectionDir)) continue;

  function walkDir(dir, prefix = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walkDir(path.join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith(".md")) {
        const filePath = path.join(dir, entry.name);
        const content = fs.readFileSync(filePath, "utf-8");
        const fm = extractFrontmatter(content);
        const slug = prefix
          ? `${prefix}/${entry.name.replace(".md", "")}`
          : entry.name.replace(".md", "");

        let href;
        if (section === "roadmap") {
          // roadmap/week-01/week-intro -> /roadmap/week-01
          // roadmap/week-01/day-01 -> /roadmap/week-01/day-01
          const parts = slug.split("/");
          if (parts[1] === "week-intro") {
            href = `/roadmap/${parts[0]}`;
          } else {
            href = `/roadmap/${slug}`;
          }
        } else if (section === "courses") {
          // courses/angular-21/signals/signal-basics -> /courses/angular-21/signals/signal-basics
          href = `/courses/${slug}`;
        } else {
          href = `/${section}/${entry.name.replace(".md", "")}`;
        }

        index.push({
          title: fm.title || slug,
          slug,
          section,
          preview: extractPreview(content),
          href,
        });
      }
    }
  }

  walkDir(sectionDir);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 0));
console.log(`Search index: ${index.length} entries → ${OUT_FILE}`);
