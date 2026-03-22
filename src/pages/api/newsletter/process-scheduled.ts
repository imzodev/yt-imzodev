import type { APIRoute } from 'astro';
import { processScheduledCampaigns } from '../../../lib/server/newsletter-campaigns';

export const prerender = false;

/**
 * Process scheduled newsletter campaigns
 * 
 * This endpoint should be called by a cron job or scheduled function.
 * It finds all campaigns scheduled to be sent and sends them.
 * 
 * Security: Requires a valid cron secret to prevent unauthorized access.
 * Set CRON_SECRET environment variable to secure this endpoint.
 */
export const POST: APIRoute = async ({ request }) => {
  // Verify cron secret for security
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  const authHeader = request.headers.get('Authorization');
  
  if (cronSecret) {
    const providedSecret = authHeader?.replace('Bearer ', '');
    if (providedSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // If no CRON_SECRET is set, only allow in development
    const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    if (!isDev) {
      console.warn('[Newsletter] CRON_SECRET not set, rejecting request in production');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    console.log('[Newsletter] Processing scheduled campaigns...');
    const result = await processScheduledCampaigns();
    
    console.log(`[Newsletter] Processed ${result.processed} campaigns: ${result.sent} sent, ${result.failed} failed`);
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Newsletter] Error processing scheduled campaigns:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process scheduled campaigns',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * GET endpoint to check scheduled campaigns status (for monitoring)
 */
export const GET: APIRoute = async ({ request }) => {
  // Same security check as POST
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  const authHeader = request.headers.get('Authorization');
  
  if (cronSecret) {
    const providedSecret = authHeader?.replace('Bearer ', '');
    if (providedSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const { getDueScheduledCampaigns } = await import('../../../lib/server/newsletter-campaigns');
    const dueCampaigns = await getDueScheduledCampaigns();
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      dueCampaignsCount: dueCampaigns.length,
      dueCampaigns: dueCampaigns.map(c => ({
        id: c.id,
        subject: c.subject,
        scheduledAt: c.scheduledAt,
        status: c.status,
      })),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Newsletter] Error checking scheduled campaigns:', error);
    return new Response(JSON.stringify({ error: 'Failed to check scheduled campaigns' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
