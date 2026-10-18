import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { APP_IDS } from './consts';

// Files live in `<lang>/<slug>.md|mdx`, so an entry id is e.g. `ja/goal`.
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    app: z.enum(APP_IDS),
    tags: z.array(z.string()).default([]),
    ogImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// Terms of service / privacy policies. `draft: true` shows a notice and sets noindex.
const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    effectiveDate: z.coerce.date().optional(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { articles, legal };
