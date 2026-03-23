/**
 * Blog Post CRUD Operations
 * Server functions for managing blog posts in the admin dashboard.
 */
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db, blogPosts, blogCategories, users } from '../../db';

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/\s+/g, '-')      // Replace spaces with dashes
    .replace(/-+/g, '-')       // Replace multiple dashes with single
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing dashes
}

/**
 * Get all blog posts with optional filtering
 */
export async function getAllBlogPosts(options?: {
  limit?: number;
  offset?: number;
  categoryId?: number;
  status?: string;
  accessLevel?: string;
  search?: string;
}) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const conditions = [];
  
  if (options?.categoryId) {
    conditions.push(eq(blogPosts.categoryId, options.categoryId));
  }
  if (options?.status) {
    conditions.push(eq(blogPosts.status, options.status));
  }
  if (options?.accessLevel) {
    conditions.push(eq(blogPosts.accessLevel, options.accessLevel));
  }
  if (options?.search) {
    conditions.push(
      or(
        ilike(blogPosts.title, `%${options.search}%`),
        ilike(blogPosts.excerpt, `%${options.search}%`)
      )
    );
  }

  const results = await db
    .select({
      post: blogPosts,
      category: {
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
      },
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
      },
    })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(blogPosts.createdAt))
    .limit(limit)
    .offset(offset);

  return results.map((row) => ({
    ...row.post,
    category: row.category,
    author: row.author,
  }));
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostById(id: number) {
  const [result] = await db
    .select({
      post: blogPosts,
      category: {
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
      },
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
      },
    })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .where(eq(blogPosts.id, id))
    .limit(1);

  if (!result) return null;

  return {
    ...result.post,
    category: result.category,
    author: result.author,
  };
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string) {
  const [result] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  return result ?? null;
}

/**
 * Create a new blog post
 */
export async function createBlogPost(input: {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: number;
  authorId?: number;
  accessLevel?: string;
  tags?: string[];
  status?: string;
  featured?: boolean;
}) {
  const slug = input.slug || generateSlug(input.title);
  
  // Check for duplicate slug
  const existing = await getBlogPostBySlug(slug);
  if (existing) {
    throw new Error(`A post with slug "${slug}" already exists.`);
  }

  const now = new Date();
  const shouldPublish = input.status === 'published';

  const [post] = await db
    .insert(blogPosts)
    .values({
      title: input.title,
      slug,
      content: input.content,
      excerpt: input.excerpt || null,
      featuredImage: input.featuredImage || null,
      categoryId: input.categoryId || null,
      authorId: input.authorId || null,
      accessLevel: input.accessLevel || 'public',
      tags: input.tags || [],
      status: input.status || 'draft',
      featured: input.featured ?? false,
      publishedAt: shouldPublish ? now : null,
    })
    .returning();

  return post;
}

/**
 * Update an existing blog post
 */
export async function updateBlogPost(
  id: number,
  input: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    featuredImage?: string;
    categoryId?: number | null;
    accessLevel?: string;
    tags?: string[];
    status?: string;
    featured?: boolean;
  }
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.slug !== undefined) {
    // Check for duplicate slug if changing
    if (input.slug) {
      const existing = await getBlogPostBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new Error(`A post with slug "${input.slug}" already exists.`);
      }
    }
    updateData.slug = input.slug;
  }
  if (input.content !== undefined) updateData.content = input.content;
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt || null;
  if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage || null;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.accessLevel !== undefined) updateData.accessLevel = input.accessLevel;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.featured !== undefined) updateData.featured = input.featured;
  
  // Handle status changes
  if (input.status !== undefined) {
    updateData.status = input.status;
    
    // If publishing for the first time, set publishedAt
    if (input.status === 'published') {
      const current = await getBlogPostById(id);
      if (current && !current.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
  }

  const [post] = await db
    .update(blogPosts)
    .set(updateData)
    .where(eq(blogPosts.id, id))
    .returning();

  return post;
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: number) {
  const [post] = await db
    .delete(blogPosts)
    .where(eq(blogPosts.id, id))
    .returning();

  return post;
}

/**
 * Get all blog categories
 */
export async function getAllBlogCategories() {
  return db
    .select()
    .from(blogCategories)
    .where(eq(blogCategories.isActive, true))
    .orderBy(asc(blogCategories.name));
}

/**
 * Get blog post statistics
 */
export async function getBlogPostStats() {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts);

  const [publishedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts)
    .where(eq(blogPosts.status, 'published'));

  const [draftResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts)
    .where(eq(blogPosts.status, 'draft'));

  const [categoryResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogCategories)
    .where(eq(blogCategories.isActive, true));

  return {
    total: totalResult?.count ?? 0,
    published: publishedResult?.count ?? 0,
    drafts: draftResult?.count ?? 0,
    categories: categoryResult?.count ?? 0,
  };
}
