import type { APIRoute } from 'astro';
import { getSession, checkAdminAccess } from '../../../../../lib/server/auth';
import { db, forumReports } from '../../../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

// POST: Resolve a report
export const POST: APIRoute = async ({ params, request, cookies }) => {
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

  const reportId = parseInt(params.id || '0', 10);
  if (isNaN(reportId)) {
    return new Response(JSON.stringify({ error: 'Invalid report ID' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { action } = body;

    const newStatus = action === 'dismiss' ? 'dismissed' : 'resolved';

    const [updated] = await db
      .update(forumReports)
      .set({ 
        status: newStatus,
        reviewedBy: authResult.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(forumReports.id, reportId))
      .returning();

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Report not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, report: updated }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Admin API] Error resolving report:', error);
    return new Response(JSON.stringify({ error: 'Failed to resolve report' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
