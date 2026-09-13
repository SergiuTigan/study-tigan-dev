import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const roadmap = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/roadmap" }),
  schema: z.object({
    title: z.string(),
    week: z.number(),
    day: z.number().optional(),
    phase: z.number(),
    phaseLabel: z.string(),
    order: z.number(),
    type: z.enum(["week-intro", "day"]),
  }),
});

const reference = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/reference" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    order: z.number(),
    lastUpdated: z.string().optional(),
  }),
});

const journal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/journal" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tags: z.array(z.string()),
    summary: z.string().optional(),
  }),
});

const templates = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/templates" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    order: z.number(),
  }),
});

const courses = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/courses" }),
  schema: z.object({
    title: z.string(),
    course: z.string(),
    courseTitle: z.string(),
    module: z.string(),
    moduleTitle: z.string(),
    moduleDescription: z.string(),
    lessonId: z.string(),
    duration: z.string(),
    order: z.number(),
    moduleOrder: z.number(),
    lessonOrder: z.number(),
    color: z.string(),
  }),
});

// Deeper reading / exercises for Alfred's daily-lesson feature — Alfred
// shows the short 5-10min read in-app; when there's a hands-on exercise or
// worthwhile deeper material, it publishes that here and links out.
const lessons = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    date: z.string(), // "YYYY-MM-DD"
    category: z.string(),
    summary: z.string().optional(),
  }),
});

export const collections = { roadmap, reference, journal, templates, courses, lessons };
