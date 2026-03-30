/**
 * Blog Admin Server Library
 * CRUD operations, category fetching, blog stats, and slug utilities for blog admin.
 * 
 * This is the foundation layer for all blog admin API endpoints and pages.
 */
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db, blogPosts, blogCategories, users, videos } from '../../db';

// ============================================================================
// Types
// ============================================================================

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  authorId: number | null;
  categoryId: number | null;
  videoId: number | null;
  accessLevel: string;
  tags: string[];
  status: string;
  featured: boolean;
  viewCount: number;
  likeCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogCategory {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface BlogPostWithRelations extends BlogPost {
  category: { id: number; name: string; slug: string } | null;
  author: { id: number; name: string | null; username: string | null } | null;
  video: { id: number; title: string; youtubeId: string } | null;
}

export interface CreateBlogPostData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: number;
  videoId?: number;
  accessLevel?: string;
  tags?: string[];
  status?: string;
  featured?: boolean;
  authorId: number;
}

export interface ListBlogPostsOptions {
  limit?: number;
  offset?: number;
  status?: string;
  categoryId?: number;
  search?: string;
}

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  archivedPosts: number;
  totalViews: number;
  totalLikes: number;
}

// ============================================================================
// Slug Utilities
// ============================================================================

/**
 * Convert title to URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (keep letters, numbers, underscores, hyphens)
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '')  // Remove leading/trailing hyphens
    .slice(0, 100);           // Limit to 100 chars
}

/**
 * Ensure slug is unique by appending -2, -3, etc if needed
 * @param slug The desired slug
 * @param excludeId Post ID to exclude from uniqueness check (for edit mode)
 * @returns Unique slug
 */
export async function ensureUniqueSlug(slug: string, excludeId?: number): Promise<string> {
  let uniqueSlug = slug;
  let suffix = 2;

  while (true) {
    const conditions = [eq(blogPosts.slug, uniqueSlug)];
    if (excludeId !== undefined) {
      conditions.push(sql`${blogPosts.id} != ${excludeId}`);
    }

    const [existing] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(and(...conditions))
      .limit(1);

    if (!existing) {
      return uniqueSlug;
    }

    uniqueSlug = `${slug}-${suffix}`;
    suffix++;
  }
}

// ============================================================================
// CRUD Functions
// ============================================================================

/**
 * List posts with filtering and pagination
 */
export async function listBlogPosts(options: ListBlogPostsOptions = {}): Promise<{ posts: BlogPostWithRelations[]; total: number }> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const conditions = [];

  if (options.status) {
    conditions.push(eq(blogPosts.status, options.status));
  }
  if (options.categoryId) {
    conditions.push(eq(blogPosts.categoryId, options.categoryId));
  }
  if (options.search) {
    conditions.push(
      or(
        ilike(blogPosts.title, `%${options.search}%`),
        ilike(blogPosts.excerpt, `%${options.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(whereClause);

  const total = countResult?.count ?? 0;

  // Get posts with joins
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
      video: {
        id: videos.id,
        title: videos.title,
        youtubeId: videos.youtubeId,
      },
    })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(videos, eq(blogPosts.videoId, videos.id))
    .where(whereClause)
    .orderBy(desc(blogPosts.createdAt))
    .limit(limit)
    .offset(offset);

  const posts = results.map((row) => ({
    ...row.post,
    category: row.category.id ? row.category : null,
    author: row.author.id ? row.author : null,
    video: row.video.id ? row.video : null,
  }));

  return { posts, total };
}

/**
 * Get single post by ID with author and category data via joins
 */
export async function getBlogPostById(id: number): Promise<BlogPostWithRelations | null> {
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
      video: {
        id: videos.id,
        title: videos.title,
        youtubeId: videos.youtubeId,
      },
    })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(videos, eq(blogPosts.videoId, videos.id))
    .where(eq(blogPosts.id, id))
    .limit(1);

  if (!result) return null;

  return {
    ...result.post,
    category: result.category.id ? result.category : null,
    author: result.author.id ? result.author : null,
    video: result.video.id ? result.video : null,
  };
}

/**
 * Create new blog post
 */
export async function createBlogPost(data: CreateBlogPostData): Promise<BlogPost> {
  const now = new Date();
  const shouldPublish = data.status === 'published';

  const [post] = await db
    .insert(blogPosts)
    .values({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt ?? null,
      featuredImage: data.featuredImage ?? null,
      authorId: data.authorId,
      categoryId: data.categoryId ?? null,
      videoId: data.videoId ?? null,
      accessLevel: data.accessLevel ?? 'public',
      tags: data.tags ?? [],
      status: data.status ?? 'draft',
      featured: data.featured ?? false,
      publishedAt: shouldPublish ? now : null,
    })
    .returning();

  return post;
}

/**
 * Update existing post (partial update — only sent fields change)
 */
export async function updateBlogPost(id: number, data: Partial<Omit<CreateBlogPostData, 'authorId'>>): Promise<BlogPost> {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt ?? null;
  if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage ?? null;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.videoId !== undefined) updateData.videoId = data.videoId;
  if (data.accessLevel !== undefined) updateData.accessLevel = data.accessLevel;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.featured !== undefined) updateData.featured = data.featured;

  // Handle status changes
  if (data.status !== undefined) {
    updateData.status = data.status;

    // If publishing for the first time, set publishedAt
    if (data.status === 'published') {
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
 * Delete post by ID
 */
export async function deleteBlogPost(id: number): Promise<boolean> {
  const [post] = await db
    .delete(blogPosts)
    .where(eq(blogPosts.id, id))
    .returning();

  return !!post;
}

// ============================================================================
// Category & Stats Functions
// ============================================================================

/**
 * List all active categories for dropdowns
 */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  return db
    .select()
    .from(blogCategories)
    .where(eq(blogCategories.isActive, true))
    .orderBy(asc(blogCategories.name));
}

/**
 * Aggregate stats for dashboard cards
 */
export async function getBlogStats(): Promise<BlogStats> {
  // Total posts
  const [totalResult] = await db
    .select({ count: count() })
    .from(blogPosts);

  // Published posts
  const [publishedResult] = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(eq(blogPosts.status, 'published'));

  // Draft posts
  const [draftResult] = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(eq(blogPosts.status, 'draft'));

  // Archived posts
  const [archivedResult] = await db
    .select({ count: count() })
    .from(blogPosts)
    .where(eq(blogPosts.status, 'archived'));

  // Total views and likes
  const [viewsResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${blogPosts.viewCount}), 0)` })
    .from(blogPosts);

  const [likesResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${blogPosts.likeCount}), 0)` })
    .from(blogPosts);

  return {
    totalPosts: totalResult?.count ?? 0,
    publishedPosts: publishedResult?.count ?? 0,
    draftPosts: draftResult?.count ?? 0,
    archivedPosts: archivedResult?.count ?? 0,
    totalViews: Number(viewsResult?.total ?? 0),
    totalLikes: Number(likesResult?.total ?? 0),
  };
}
