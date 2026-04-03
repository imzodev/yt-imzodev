import type { APIRoute } from 'astro';
import { getSession, requireAdmin, isRedirect } from '../../../lib/server/auth';
import { getDashboardStats } from '../../../lib/server/admin';

export const prerender = false;

// GET: Get all dashboard metrics
export const GET: APIRoute = async ({ cookies }) => {
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

  // Check admin role using requireAdmin
  const adminResult = await requireAdmin({ cookies, url: new URL('http://localhost/api/admin/stats') } as any);
  if (adminResult instanceof Response) {
    return adminResult;
  }

  try {
    const stats = await getDashboardStats();
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Admin API] Error getting stats:', error);
    return new Response(JSON.stringify({ error: 'Failed to get stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
