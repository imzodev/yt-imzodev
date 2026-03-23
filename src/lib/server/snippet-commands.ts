/**
 * Snippet CRUD Operations
 * Server functions for managing code snippets in the admin dashboard.
 */
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db, snippets, snippetCategories, users, videos } from '../../db';

/**
 * Get all snippets with optional filtering
 */
export async function getAllSnippets(options?: {
  limit?: number;
  offset?: number;
  categoryId?: number;
  language?: string;
  type?: string;
  accessLevel?: string;
  isActive?: boolean;
  search?: string;
}) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const conditions = [];
  
  if (options?.categoryId) {
    conditions.push(eq(snippets.categoryId, options.categoryId));
  }
  if (options?.language) {
    conditions.push(eq(snippets.language, options.language));
  }
  if (options?.type) {
    conditions.push(eq(snippets.type, options.type));
  }
  if (options?.accessLevel) {
    conditions.push(eq(snippets.accessLevel, options.accessLevel));
  }
  if (options?.isActive !== undefined) {
    conditions.push(eq(snippets.isActive, options.isActive));
  }
  if (options?.search) {
    conditions.push(
      or(
        ilike(snippets.title, `%${options.search}%`),
        ilike(snippets.description, `%${options.search}%`)
      )
    );
  }

  const results = await db
    .select({
      snippet: snippets,
      category: {
        id: snippetCategories.id,
        name: snippetCategories.name,
        slug: snippetCategories.slug,
      },
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
      },
    })
    .from(snippets)
    .leftJoin(snippetCategories, eq(snippets.categoryId, snippetCategories.id))
    .leftJoin(users, eq(snippets.authorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(snippets.createdAt))
    .limit(limit)
    .offset(offset);

  return results.map((row) => ({
    ...row.snippet,
    category: row.category,
    author: row.author,
  }));
}

/**
 * Get a single snippet by ID
 */
export async function getSnippetById(id: number) {
  const [result] = await db
    .select({
      snippet: snippets,
      category: {
        id: snippetCategories.id,
        name: snippetCategories.name,
        slug: snippetCategories.slug,
      },
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
      },
    })
    .from(snippets)
    .leftJoin(snippetCategories, eq(snippets.categoryId, snippetCategories.id))
    .leftJoin(users, eq(snippets.authorId, users.id))
    .where(eq(snippets.id, id))
    .limit(1);

  if (!result) return null;

  return {
    ...result.snippet,
    category: result.category,
    author: result.author,
  };
}

/**
 * Create a new snippet
 */
export async function createSnippet(input: {
  title: string;
  content: string;
  language: string;
  type: string;
  description?: string;
  categoryId?: number;
  authorId?: number;
  accessLevel?: string;
  tags?: string[];
  isActive?: boolean;
}) {
  const [snippet] = await db
    .insert(snippets)
    .values({
      title: input.title,
      content: input.content,
      language: input.language,
      type: input.type,
      description: input.description || null,
      categoryId: input.categoryId || null,
      authorId: input.authorId || null,
      accessLevel: input.accessLevel || 'public',
      tags: input.tags || [],
      isActive: input.isActive ?? true,
    })
    .returning();

  return snippet;
}

/**
 * Update an existing snippet
 */
export async function updateSnippet(
  id: number,
  input: {
    title?: string;
    content?: string;
    language?: string;
    type?: string;
    description?: string;
    categoryId?: number | null;
    accessLevel?: string;
    tags?: string[];
    isActive?: boolean;
  }
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.language !== undefined) updateData.language = input.language;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.accessLevel !== undefined) updateData.accessLevel = input.accessLevel;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  const [snippet] = await db
    .update(snippets)
    .set(updateData)
    .where(eq(snippets.id, id))
    .returning();

  return snippet;
}

/**
 * Delete a snippet
 */
export async function deleteSnippet(id: number) {
  const [snippet] = await db
    .delete(snippets)
    .where(eq(snippets.id, id))
    .returning();

  return snippet;
}

/**
 * Get all snippet categories
 */
export async function getAllSnippetCategories() {
  return db
    .select()
    .from(snippetCategories)
    .where(eq(snippetCategories.isActive, true))
    .orderBy(asc(snippetCategories.name));
}

/**
 * Get unique languages from snippets
 */
export async function getSnippetLanguages() {
  const results = await db
    .selectDistinct({ language: snippets.language })
    .from(snippets)
    .orderBy(asc(snippets.language));

  return results.map((r) => r.language);
}

/**
 * Get snippet statistics
 */
export async function getSnippetStats() {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(snippets);

  const [activeResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(snippets)
    .where(eq(snippets.isActive, true));

  const [categoryResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(snippetCategories)
    .where(eq(snippetCategories.isActive, true));

  return {
    total: totalResult?.count ?? 0,
    active: activeResult?.count ?? 0,
    categories: categoryResult?.count ?? 0,
  };
}
