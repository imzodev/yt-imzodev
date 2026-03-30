/**
 * Blog Post Single Operations API
 * GET: Get single post by ID
 * PUT: Update existing post
 * DELETE: Delete post
 */
import type { APIRoute } from 'astro';
import { getBlogPostById, updateBlogPost, deleteBlogPost, generateSlug, ensureUniqueSlug } from '../../../../../lib/server/blog-admin';
import { getSession, checkAdminAccess } from '../../../../../lib/server/auth';
import { validateCsrfToken } from '../../../../../lib/server/csrf';

export const prerender = false;

// GET: Get single post by ID
export const GET: APIRoute = async ({ params, cookies }) => {
  // Auth check
  const authResult = await getSession({ cookies } as any);
  if (!authResult?.user) {
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
    const id = parseInt(params.id || '', 10);

    if (isNaN(id) || id <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid post ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await getBlogPostById(id);

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ post }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Blog API] Error getting post:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT: Update existing post
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  // Auth check
  const authResult = await getSession({ cookies } as any);
  if (!authResult?.user) {
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
    const id = parseInt(params.id || '', 10);

    if (isNaN(id) || id <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid post ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check post exists
    const existingPost = await getBlogPostById(id);
    if (!existingPost) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();

    // CSRF validation
    if (!validateCsrfToken(cookies, formData.get('csrf_token'))) {
      return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build update object (only include fields that were provided)
    const updateData: Record<string, unknown> = {};

    const title = formData.get('title');
    if (title !== null) {
      const titleStr = String(title).trim();
      if (!titleStr) {
        return new Response(JSON.stringify({ error: 'Title cannot be empty' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.title = titleStr;
    }

    const slug = formData.get('slug');
    if (slug !== null) {
      let slugStr = String(slug).trim();
      if (slugStr) {
        slugStr = generateSlug(slugStr);
        // Ensure uniqueness (exclude current post)
        slugStr = await ensureUniqueSlug(slugStr, id);
      }
      updateData.slug = slugStr;
    }

    const content = formData.get('content');
    if (content !== null) {
      const contentStr = String(content).trim();
      if (!contentStr) {
        return new Response(JSON.stringify({ error: 'Content cannot be empty' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.content = contentStr;
    }

    const excerpt = formData.get('excerpt');
    if (excerpt !== null) {
      updateData.excerpt = String(excerpt).trim() || null;
    }

    const featuredImage = formData.get('featuredImage');
    if (featuredImage !== null) {
      updateData.featuredImage = String(featuredImage).trim() || null;
    }

    const categoryId = formData.get('categoryId');
    if (categoryId !== null) {
      const catId = parseInt(String(categoryId), 10);
      updateData.categoryId = isNaN(catId) ? null : catId;
    }

    const videoId = formData.get('videoId');
    if (videoId !== null) {
      const vidId = parseInt(String(videoId), 10);
      updateData.videoId = isNaN(vidId) ? null : vidId;
    }

    const accessLevel = formData.get('accessLevel');
    if (accessLevel !== null) {
      const level = String(accessLevel);
      const validAccessLevels = ['public', 'member', 'premium'];
      if (!validAccessLevels.includes(level)) {
        return new Response(JSON.stringify({ error: 'Invalid access level' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.accessLevel = level;
    }

    const status = formData.get('status');
    if (status !== null) {
      const statusStr = String(status);
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(statusStr)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.status = statusStr;
    }

    const featured = formData.get('featured');
    if (featured !== null) {
      updateData.featured = featured === 'on' || featured === 'true';
    }

    const tags = formData.get('tags');
    if (tags !== null) {
      const tagsStr = String(tags).trim();
      let parsedTags: string[] = [];
      if (tagsStr) {
        try {
          parsedTags = JSON.parse(tagsStr);
          if (!Array.isArray(parsedTags)) {
            parsedTags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
          }
        } catch {
          parsedTags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
        }
      }
      updateData.tags = parsedTags;
    }

    // Perform update
    const post = await updateBlogPost(id, updateData);

    return new Response(JSON.stringify({ post }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Blog API] Error updating post:', error);
    const message = error instanceof Error ? error.message : 'Failed to update post';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: Delete post
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  // Auth check
  const authResult = await getSession({ cookies } as any);
  if (!authResult?.user) {
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
    const id = parseInt(params.id || '', 10);

    if (isNaN(id) || id <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid post ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check post exists
    const existingPost = await getBlogPostById(id);
    if (!existingPost) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CSRF validation (from body or headers)
    let csrfValid = false;
    
    // Try to get CSRF from body first
    try {
      const formData = await request.formData();
      csrfValid = validateCsrfToken(cookies, formData.get('csrf_token'));
    } catch {
      // If no body, check header
      const csrfHeader = request.headers.get('X-CSRF-Token');
      csrfValid = validateCsrfToken(cookies, csrfHeader);
    }

    if (!csrfValid) {
      return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the post
    const success = await deleteBlogPost(id);

    return new Response(JSON.stringify({ success }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Blog API] Error deleting post:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
