import type { APIRoute } from 'astro';
import { getSession, checkAdminAccess } from '../../../lib/server/auth';
import { listSubscriptions } from '../../../lib/server/admin';

export const prerender = false;

// GET: List subscriptions
export const GET: APIRoute = async ({ url, cookies }) => {
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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status') || undefined;

    const subscriptions = await listSubscriptions({ limit, offset, status });
    
    return new Response(JSON.stringify(subscriptions), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Admin API] Error listing subscriptions:', error);
    return new Response(JSON.stringify({ error: 'Failed to list subscriptions' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
