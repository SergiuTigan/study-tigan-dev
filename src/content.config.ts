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

export const collections = { roadmap, reference, journal, templates };
