import { desc, eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { db, subscriptions, users } from '../../db';
import { stripe } from '../stripe';

const premiumPriceId = import.meta.env.STRIPE_PRICE_PREMIUM;

if (!premiumPriceId) {
  throw new Error('STRIPE_PRICE_PREMIUM environment variable must be set');
}

type BillingProfile = {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  supabaseUserId: string | null;
  stripeCustomerId: string | null;
  isActive: boolean | null;
};

const premiumStatuses = new Set<Stripe.Subscription.Status>(['active', 'trialing']);
const existingSubscriptionStatuses: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];

export async function getBillingProfileBySupabaseUserId(supabaseUserId: string) {
  const [profile] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      username: users.username,
      supabaseUserId: users.supabaseUserId,
      stripeCustomerId: users.stripeCustomerId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUserId))
    .limit(1);

  return profile ?? null;
}

export async function getCurrentSubscriptionRecord(userId: number) {
  const [subscriptionRecord] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt), desc(subscriptions.createdAt))
    .limit(1);

  return subscriptionRecord ?? null;
}

async function ensureStripeCustomer(profile: BillingProfile) {
  if (profile.stripeCustomerId) {
    return profile.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: profile.email,
    name: profile.name ?? profile.username ?? undefined,
    metadata: {
      userId: String(profile.id),
      ...(profile.supabaseUserId ? { supabaseUserId: profile.supabaseUserId } : {}),
    },
  });

  await db
    .update(users)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, profile.id));

  return customer.id;
}

export async function createPremiumCheckoutSession(profile: BillingProfile, origin: string) {
  const existingSubscription = await getCurrentSubscriptionRecord(profile.id);

  if (existingSubscription && existingSubscription.status && existingSubscriptionStatuses.includes(existingSubscription.status as Stripe.Subscription.Status)) {
    throw new Error('User already has a subscription record that should be managed through billing portal.');
  }

  const customerId = await ensureStripeCustomer(profile);

  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: premiumPriceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/pricing?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=canceled`,
    metadata: {
      userId: String(profile.id),
      ...(profile.supabaseUserId ? { supabaseUserId: profile.supabaseUserId } : {}),
    },
    subscription_data: {
      metadata: {
        userId: String(profile.id),
        ...(profile.supabaseUserId ? { supabaseUserId: profile.supabaseUserId } : {}),
      },
    },
  });
}

export async function createBillingPortalSession(profile: BillingProfile, origin: string) {
  const customerId = await ensureStripeCustomer(profile);

  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/profile?billing=return`,
  });
}

export async function syncStripeSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    return null;
  }

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  const productValue = firstItem?.price?.product;
  const productId = typeof productValue === 'string' ? productValue : productValue?.id ?? null;
  const currentPeriodEnd = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000) : null;
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
  const status = subscription.status;
  const tier = premiumStatuses.has(status) ? 'premium' : 'free';

  await db
    .insert(subscriptions)
    .values({
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      status,
      priceId,
      productId,
      currentPeriodEnd,
      trialEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      metadata: subscription.metadata,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        stripeCustomerId: customerId,
        status,
        priceId,
        productId,
        currentPeriodEnd,
        trialEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        metadata: subscription.metadata,
        updatedAt: new Date(),
      },
    });

  await db
    .update(users)
    .set({
      stripeCustomerId: customerId,
      subscriptionTier: tier,
      subscriptionStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return user.id;
}

export async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription' || !session.subscription) {
    return null;
  }

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return await syncStripeSubscription(subscription);
}
