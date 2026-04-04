import type { APIRoute } from 'astro';
import { unsubscribeFromNewsletter, getSubscriberByEmail } from '../../../lib/server/newsletter';

export const prerender = false;

export const GET: APIRoute = async ({ url, redirect }) => {
  const email = url.searchParams.get('email');
  const token = url.searchParams.get('token');

  if (!email || !token) {
    return redirect('/newsletter?subscribe=error');
  }

  try {
    // Verify subscriber exists
    const subscriber = await getSubscriberByEmail(email);
    if (!subscriber) {
      return redirect('/newsletter?subscribe=error');
    }

    // Simple token verification (in production, use JWT or similar)
    const expectedToken = Buffer.from(`${email}:${subscriber.id}`).toString('base64');
    if (token !== expectedToken) {
      return redirect('/newsletter?subscribe=error');
    }

    // Unsubscribe
    await unsubscribeFromNewsletter(email);

    return redirect('/newsletter?subscribe=unsubscribed');
  } catch (error) {
    console.error('Newsletter unsubscription error:', error);
    return redirect('/newsletter?subscribe=error');
  }
};

/**
 * Generate unsubscribe link for email
 */
export function generateUnsubscribeLink(email: string, subscriberId: number): string {
  const token = Buffer.from(`${email}:${subscriberId}`).toString('base64');
  return `/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}
