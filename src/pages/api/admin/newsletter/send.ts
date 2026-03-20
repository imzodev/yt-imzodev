import type { APIRoute } from 'astro';
import { sendCampaign, getCampaign } from '../../../../lib/server/newsletter-campaigns';
import { getSession } from '../../../../lib/server/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResult = await getSession({ cookies } as any);
  if (!authResult.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return new Response(JSON.stringify({ error: 'Campaign ID required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const campaignIdNum = parseInt(campaignId, 10);
    if (isNaN(campaignIdNum)) {
      return new Response(JSON.stringify({ error: 'Invalid Campaign ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const campaign = await getCampaign(campaignIdNum);
    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await sendCampaign(campaignIdNum);

    return new Response(JSON.stringify(result), { 
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Newsletter API] Error sending campaign:', error);
    return new Response(JSON.stringify({ error: 'Failed to send campaign' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
