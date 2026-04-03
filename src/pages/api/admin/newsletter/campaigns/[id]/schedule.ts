import type { APIRoute } from 'astro';
import { scheduleCampaign, cancelScheduledCampaign, rescheduleCampaign, getCampaign } from '../../../../../../lib/server/newsletter-campaigns';
import { getSession, checkAdminAccess, isRedirect } from '../../../../../../lib/server/auth';

export const prerender = false;

// Helper to handle auth check
async function checkAuth(cookies: any): Promise<{ authorized: true } | { authorized: false; response: Response }> {
  const authResult = await getSession({ cookies } as any);
  
  // Check if redirect response
  if (isRedirect(authResult)) {
    return { 
      authorized: false, 
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    };
  }

  if (!authResult.user) {
    return { 
      authorized: false, 
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    };
  }

  const adminCheck = await checkAdminAccess(authResult.user.id);
  if (!adminCheck.authorized) {
    return { authorized: false, response: adminCheck.error };
  }

  return { authorized: true };
}

/**
 * POST /api/admin/newsletter/campaigns/[id]/schedule
 * Schedule a campaign for future delivery
 */
export const POST: APIRoute = async ({ request, cookies, params }) => {
  // Check authentication
  const auth = await checkAuth(cookies);
  if (!auth.authorized) {
    return auth.response;
  }

  const campaignIdStr = params.id as string;
  if (!campaignIdStr) {
    return new Response(JSON.stringify({ error: 'Invalid campaign ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const campaignId = parseInt(campaignIdStr, 10);
  if (isNaN(campaignId)) {
    return new Response(JSON.stringify({ error: 'Invalid campaign ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { scheduledAt } = body;

    if (!scheduledAt) {
      return new Response(JSON.stringify({ error: 'scheduledAt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid date format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await scheduleCampaign(campaignId, scheduledDate);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Campaign scheduled successfully',
        campaign: result.campaign,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error scheduling campaign:', error);
    return new Response(JSON.stringify({ error: 'Failed to schedule campaign' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PUT /api/admin/newsletter/campaigns/[id]/schedule
 * Reschedule a campaign
 */
export const PUT: APIRoute = async ({ request, cookies, params }) => {
  // Check authentication
  const auth = await checkAuth(cookies);
  if (!auth.authorized) {
    return auth.response;
  }

  const campaignIdStr = params.id as string;
  const campaignId = parseInt(campaignIdStr, 10);
  if (isNaN(campaignId)) {
    return new Response(JSON.stringify({ error: 'Invalid campaign ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { scheduledAt } = body;

    if (!scheduledAt) {
      return new Response(JSON.stringify({ error: 'scheduledAt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid date format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await rescheduleCampaign(campaignId, scheduledDate);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Campaign rescheduled successfully',
        campaign: result.campaign,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error rescheduling campaign:', error);
    return new Response(JSON.stringify({ error: 'Failed to reschedule campaign' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE /api/admin/newsletter/campaigns/[id]/schedule
 * Cancel a scheduled campaign
 */
export const DELETE: APIRoute = async ({ cookies, params }) => {
  // Check authentication
  const auth = await checkAuth(cookies);
  if (!auth.authorized) {
    return auth.response;
  }

  const campaignIdStr = params.id as string;
  const campaignId = parseInt(campaignIdStr, 10);
  if (isNaN(campaignId)) {
    return new Response(JSON.stringify({ error: 'Invalid campaign ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await cancelScheduledCampaign(campaignId);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Scheduled campaign cancelled',
        campaign: result.campaign,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error cancelling scheduled campaign:', error);
    return new Response(JSON.stringify({ error: 'Failed to cancel scheduled campaign' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
