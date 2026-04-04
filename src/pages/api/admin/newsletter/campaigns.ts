import type { APIRoute } from 'astro';
import { listCampaigns, createCampaign, getCampaignAnalytics, getNewsletterStats } from '../../../../lib/server/newsletter-campaigns';
import { getSession, checkAdminAccess, isRedirect } from '../../../../lib/server/auth';

export const prerender = false;

// GET: List campaigns or get stats
export const GET: APIRoute = async ({ url, cookies }) => {
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

  const action = url.searchParams.get('action');

  try {
    if (action === 'stats') {
      const stats = await getNewsletterStats();
      return new Response(JSON.stringify(stats), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'analytics') {
      const campaignIdStr = url.searchParams.get('campaignId');
      if (!campaignIdStr) {
        return new Response(JSON.stringify({ error: 'Campaign ID required' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const campaignId = parseInt(campaignIdStr, 10);
      if (isNaN(campaignId)) {
        return new Response(JSON.stringify({ error: 'Invalid Campaign ID' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const analytics = await getCampaignAnalytics(campaignId);
      return new Response(JSON.stringify(analytics), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default: list campaigns
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const campaigns = await listCampaigns(limit);
    return new Response(JSON.stringify(campaigns), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Newsletter API] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Create new campaign
export const POST: APIRoute = async ({ request, cookies }) => {
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
    const subject = formData.get('subject') as string;
    const content = formData.get('content') as string;
    const template = (formData.get('template') as string) || 'default';
    const scheduledAtStr = formData.get('scheduled_at') as string;

    if (!subject || !content) {
      return new Response(JSON.stringify({ error: 'Subject and content are required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : undefined;
    const campaign = await createCampaign(subject, content, template, scheduledAt);

    return new Response(JSON.stringify({
      success: true,
      campaign,
      message: scheduledAt ? 'Campaign scheduled' : 'Campaign saved as draft',
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Newsletter API] Error creating campaign:', error);
    return new Response(JSON.stringify({ error: 'Failed to create campaign' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
