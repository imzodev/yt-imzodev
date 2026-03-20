import type { APIRoute } from 'astro';
import { trackClick, getSubscriberIdByEmail } from '../../../../lib/server/newsletter-campaigns';

export const prerender = false;

// Click tracking redirect
export const GET: APIRoute = async ({ url, redirect }) => {
  const campaignIdStr = url.searchParams.get('c');
  const email = url.searchParams.get('e');
  const targetUrl = url.searchParams.get('u');

  if (!targetUrl) {
    return new Response('Missing target URL', { status: 400 });
  }

  // Validate URL
  try {
    new URL(targetUrl);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  if (campaignIdStr && email) {
    const campaignId = parseInt(campaignIdStr, 10);
    
    if (!isNaN(campaignId)) {
      // Get subscriber ID from email, then track the click asynchronously
      (async () => {
        try {
          const subscriberId = await getSubscriberIdByEmail(email);
          if (subscriberId) {
            await trackClick(campaignId, subscriberId, targetUrl);
          } else {
            console.warn(`[Newsletter] Subscriber not found for email: ${email}`);
          }
        } catch (err) {
          console.error('[Newsletter] Error tracking click:', err);
        }
      })();
    }
  }

  // Redirect to target URL
  return redirect(targetUrl, 302);
};
