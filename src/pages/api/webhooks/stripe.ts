import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { syncCheckoutSession, syncStripeSubscription } from '../../../lib/server/billing';
import { webhooks } from '../../../lib/stripe';

export const prerender = false;

const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable must be set');
}

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing Stripe signature.', { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return new Response('Invalid signature.', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await syncCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncStripeSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook handling failed for ${event.type}:`, error);
    return new Response('Webhook handler failed.', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
