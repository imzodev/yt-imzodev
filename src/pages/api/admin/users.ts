import type { APIRoute } from 'astro';
import { getSession, checkAdminAccess } from '../../../lib/server/auth';
import { listUsers, updateUserRole, setUserActiveStatus } from '../../../lib/server/admin';

export const prerender = false;

// GET: List users
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
    const tier = url.searchParams.get('tier') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const users = await listUsers({ limit, offset, tier, status, search });
    
    return new Response(JSON.stringify(users), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Admin API] Error listing users:', error);
    return new Response(JSON.stringify({ error: 'Failed to list users' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PATCH: Update user
export const PATCH: APIRoute = async ({ request, cookies }) => {
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
    const body = await request.json();
    const { userId, action, value } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result;
    
    if (action === 'updateRole') {
      if (!['member', 'moderator', 'admin'].includes(value)) {
        return new Response(JSON.stringify({ error: 'Invalid role' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      result = await updateUserRole(userId, value);
    } else if (action === 'setActive') {
      result = await setUserActiveStatus(userId, value === true);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!result) {
      return new Response(JSON.stringify({ error: 'User not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, user: result }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Admin API] Error updating user:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
