import type { APIRoute } from 'astro';
import { subscribeToNewsletter, getSubscriberByEmail } from '../../../lib/server/newsletter';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already subscribed
    const existing = await getSubscriberByEmail(email);
    if (existing?.status === 'active') {
      return new Response(JSON.stringify({ 
        message: 'Already subscribed',
        subscribed: true 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Subscribe
    await subscribeToNewsletter({ email });

    return new Response(JSON.stringify({ 
      message: 'Successfully subscribed',
      subscribed: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(JSON.stringify({ error: 'Failed to subscribe' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
