/**
 * Blog Categories API Endpoint
 * GET: List all active blog categories
 */
import type { APIRoute } from 'astro';
import { getBlogCategories } from '../../../../lib/server/blog-admin';
import { getSession, checkAdminAccess, isRedirect } from '../../../../lib/server/auth';

export const prerender = false;

// GET: List categories
export const GET: APIRoute = async ({ cookies }) => {
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
    const categories = await getBlogCategories();

    return new Response(JSON.stringify({ categories }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Blog API] Error getting categories:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
