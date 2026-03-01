import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable must be set');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
});

// Subscription management
export const subscriptions = {
  // Create a subscription
  async create(customerId: string, priceId: string, trialPeriodDays?: number) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialPeriodDays,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  },

  // Retrieve subscription
  async retrieve(subscriptionId: string) {
    return await stripe.subscriptions.retrieve(subscriptionId);
  },

  // Update subscription (change plan)
  async update(subscriptionId: string, priceId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
    return updated;
  },

  // Cancel subscription at period end
  async cancelAtPeriodEnd(subscriptionId: string) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  },

  // Cancel subscription immediately
  async cancelImmediately(subscriptionId: string) {
    return await stripe.subscriptions.cancel(subscriptionId);
  },

  // List customer subscriptions
  async list(customerId: string, status?: string) {
    return await stripe.subscriptions.list({
      customer: customerId,
      status: status as any,
    });
  },
};

// Payment intents for one-time payments
export const payments = {
  // Create payment intent
  async create(amount: number, currency: string = 'usd', metadata?: Record<string, string>) {
    return await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  },

  // Retrieve payment intent
  async retrieve(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  },

  // Confirm payment intent
  async confirm(paymentIntentId: string) {
    return await stripe.paymentIntents.confirm(paymentIntentId);
  },
};

// Checkout sessions
export const checkout = {
  // Create subscription checkout session
  async createSubscriptionSession(priceId: string, customerId?: string, successUrl?: string, cancelUrl?: string) {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      success_url: successUrl || `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${window.location.origin}/cancel`,
    });
    return session;
  },

  // Create one-time payment checkout session
  async createPaymentSession(amount: number, currency: string = 'usd', metadata?: Record<string, string>) {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Premium Access',
              description: 'One-time payment for lifetime access',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/cancel`,
      metadata,
    });
    return session;
  },

  // Retrieve checkout session
  async retrieve(sessionId: string) {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });
  },
};

// Customer management
export const customers = {
  // Create customer
  async create(email: string, name?: string, metadata?: Record<string, string>) {
    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  },

  // Retrieve customer
  async retrieve(customerId: string) {
    return await stripe.customers.retrieve(customerId);
  },

  // Update customer
  async update(customerId: string, updates: Partial<Stripe.CustomerUpdateParams>) {
    return await stripe.customers.update(customerId, updates);
  },

  // List customer payment methods
  async listPaymentMethods(customerId: string) {
    return await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  },
};

// Webhook handling
export const webhooks = {
  // Construct webhook event
  constructEvent(payload: string, signature: string, webhookSecret: string) {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  },

  // Common webhook event types
  events: {
    PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
    PAYMENT_FAILED: 'payment_intent.payment_failed',
    SUBSCRIPTION_CREATED: 'customer.subscription.created',
    SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
    INVOICE_PAID: 'invoice.payment_succeeded',
    INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  },
};

export default stripe;
