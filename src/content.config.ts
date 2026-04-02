import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.string().default('draft'),
    published_at: z.string().or(z.date()).optional(),
    featured_image: z.string().optional(),
  }),
});

const snippets = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/snippets' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    language: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    isPremium: z.boolean().default(false).optional(),
    status: z.string().default('published'),
    created_at: z.string().or(z.date()).optional(),
    updated_at: z.string().or(z.date()).optional(),
  }),
});

export const collections = { blog, snippets };
