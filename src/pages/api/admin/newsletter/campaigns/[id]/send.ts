import type { APIRoute } from 'astro';
import { sendCampaign, getCampaign } from '../../../../../../lib/server/newsletter-campaigns';
import { getSession, checkAdminAccess } from '../../../../../../lib/server/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, params }) => {
  // Check authentication
  const authResult = await getSession({ cookies } as any);
  if (!authResult?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admin role check
  const adminCheck = await checkAdminAccess(authResult.user.id);
  if (!adminCheck.authorized) {
    return adminCheck.error;
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
    const campaign = await getCampaign(campaignId);
    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await sendCampaign(campaignId);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: `Campaign sent to ${result.recipientCount} subscribers`,
        recipientCount: result.recipientCount,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        error: result.error || 'Failed to send campaign',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error sending campaign:', error);
    return new Response(JSON.stringify({ error: 'Failed to send campaign' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
