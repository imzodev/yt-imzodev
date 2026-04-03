import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { syncCheckoutSession, syncStripeSubscription } from '../../../lib/server/billing';
import { handleFailedPayment, markSubscriptionRecovered } from '../../../lib/server/dunning';
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
      case 'invoice.payment_failed': {
        // Handle failed payment - start dunning process
        await handleFailedPayment(event.data.object as Stripe.Invoice);
        break;
      }
      case 'invoice.payment_succeeded': {
        // Check if this is a recovery from past_due
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : invoice.subscription.id;
          await markSubscriptionRecovered(subscriptionId);
        }
        break;
      }
      case 'invoice.payment_action_required': {
        // SCA/3D Secure required - log for admin visibility
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Stripe] Payment action required (SCA/3D Secure):', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
        });
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
