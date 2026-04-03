/**
 * Blog Posts API Endpoints
 * GET: List blog posts with filtering and pagination
 * POST: Create a new blog post
 */
import type { APIRoute } from 'astro';
import { listBlogPosts, createBlogPost, generateSlug, ensureUniqueSlug } from '../../../../lib/server/blog-admin';
import { getSession, checkAdminAccess, isRedirect } from '../../../../lib/server/auth';
import { validateCsrfToken } from '../../../../lib/server/csrf';

export const prerender = false;

// GET: List posts with filtering
export const GET: APIRoute = async ({ url, cookies }) => {
  // Auth check
  const authResult = await getSession({ cookies } as any);
  
  // Check if redirect response
  if (isRedirect(authResult)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!authResult.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminCheck = await checkAdminAccess(authResult.user.id);
  if (!adminCheck.authorized) {
    return adminCheck.error;
  }

  try {
    // Parse query params
    const status = url.searchParams.get('status') || undefined;
    const categoryIdStr = url.searchParams.get('categoryId');
    const search = url.searchParams.get('search') || undefined;
    const limitStr = url.searchParams.get('limit') || '50';
    const offsetStr = url.searchParams.get('offset') || '0';

    const limit = parseInt(limitStr, 10);
    const offset = parseInt(offsetStr, 10);
    const categoryId = categoryIdStr ? parseInt(categoryIdStr, 10) : undefined;

    const result = await listBlogPosts({
      status,
      categoryId: categoryId && !isNaN(categoryId) ? categoryId : undefined,
      search,
      limit,
      offset,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Blog API] Error listing posts:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Create new blog post
export const POST: APIRoute = async ({ request, cookies }) => {
  // Auth check
  const authResult = await getSession({ cookies } as any);
  
  // Check if redirect response
  if (isRedirect(authResult)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!authResult.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminCheck = await checkAdminAccess(authResult.user.id);
  if (!adminCheck.authorized) {
    return adminCheck.error;
  }

  try {
    const formData = await request.formData();

    // CSRF validation - convert FormDataEntryValue | null to string | null
    const csrfToken = formData.get('csrf_token');
    if (!validateCsrfToken(cookies, csrfToken ? String(csrfToken) : null)) {
      return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse required fields
    const title = String(formData.get('title') || '').trim();
    let slug = String(formData.get('slug') || '').trim();
    const content = String(formData.get('content') || '').trim();

    // Validation
    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Auto-generate slug from title if not provided
    if (!slug) {
      slug = generateSlug(title);
    } else {
      // Normalize the provided slug
      slug = generateSlug(slug);
    }

    // Ensure slug is unique
    slug = await ensureUniqueSlug(slug);

    // Parse optional fields
    const excerpt = String(formData.get('excerpt') || '').trim() || undefined;
    const featuredImage = String(formData.get('featuredImage') || '').trim() || undefined;
    const categoryIdStr = formData.get('categoryId');
    const videoIdStr = formData.get('videoId');
    const accessLevel = String(formData.get('accessLevel') || 'public');
    const status = String(formData.get('status') || 'draft');
    const featured = formData.get('featured') === 'on' || formData.get('featured') === 'true';

    // Parse tags (comma-separated or JSON array)
    const tagsStr = String(formData.get('tags') || '').trim();
    let tags: string[] = [];
    if (tagsStr) {
      try {
        // Try JSON parse first
        tags = JSON.parse(tagsStr);
        if (!Array.isArray(tags)) {
          tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
        }
      } catch {
        // Fallback to comma-separated
        tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    const categoryId = categoryIdStr ? parseInt(String(categoryIdStr), 10) : undefined;
    const videoId = videoIdStr ? parseInt(String(videoIdStr), 10) : undefined;

    // Validate status
    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be draft, published, or archived.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate access level
    const validAccessLevels = ['public', 'member', 'premium'];
    if (!validAccessLevels.includes(accessLevel)) {
      return new Response(JSON.stringify({ error: 'Invalid access level. Must be public, member, or premium.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create the post
    const post = await createBlogPost({
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      categoryId: categoryId && !isNaN(categoryId) ? categoryId : undefined,
      videoId: videoId && !isNaN(videoId) ? videoId : undefined,
      accessLevel,
      tags,
      status,
      featured,
      // authorId would need to be looked up from users table using Supabase Auth ID
      // For now, leaving as null since the column is nullable
      authorId: null,
    });

    return new Response(JSON.stringify({ post }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Blog API] Error creating post:', error);
    const message = error instanceof Error ? error.message : 'Failed to create post';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
