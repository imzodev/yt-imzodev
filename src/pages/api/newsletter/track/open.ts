import type { APIRoute } from 'astro';
import { trackOpen, getSubscriberIdByEmail } from '../../../../lib/server/newsletter-campaigns';

export const prerender = false;

// Tracking pixel for email opens
export const GET: APIRoute = async ({ url }) => {
  const campaignIdStr = url.searchParams.get('c');
  const email = url.searchParams.get('e');

  if (campaignIdStr && email) {
    const campaignId = parseInt(campaignIdStr, 10);
    
    if (!isNaN(campaignId)) {
      // Get subscriber ID from email, then track the open asynchronously
      (async () => {
        try {
          const subscriberId = await getSubscriberIdByEmail(email);
          if (subscriberId) {
            await trackOpen(campaignId, subscriberId);
          } else {
            console.warn(`[Newsletter] Subscriber not found for email: ${email}`);
          }
        } catch (err) {
          console.error('[Newsletter] Error tracking open:', err);
        }
      })();
    }
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  return new Response(pixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
};
