/**
 * Dunning Logic Server Functions
 * Handles failed payments, grace periods, and subscription recovery
 */
import { db, subscriptions, users } from '../../db';
import { eq, and, sql } from 'drizzle-orm';
import type Stripe from 'stripe';

export interface DunningEvent {
  id: number;
  userId: number;
  subscriptionId: string;
  eventType: 'payment_failed' | 'grace_period_started' | 'grace_period_expired' | 'subscription_recovered' | 'subscription_downgraded';
  stripeInvoiceId?: string;
  attemptCount?: number;
  gracePeriodEnd?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface DunningConfig {
  /** Grace period in days before downgrading */
  gracePeriodDays: number;
  /** Maximum retry attempts before final failure */
  maxRetryAttempts: number;
  /** Whether to send email notifications */
  sendEmailNotifications: boolean;
}

const DEFAULT_DUNNING_CONFIG: DunningConfig = {
  gracePeriodDays: 7,
  maxRetryAttempts: 3,
  sendEmailNotifications: true,
};

/**
 * Handle failed payment from Stripe webhook
 * Sets subscription to past_due and starts grace period
 */
export async function handleFailedPayment(
  invoice: Stripe.Invoice,
  config: DunningConfig = DEFAULT_DUNNING_CONFIG
): Promise<{ success: boolean; userId?: number; gracePeriodEnd?: Date }> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  
  if (!customerId) {
    console.error('No customer ID in failed payment invoice');
    return { success: false };
  }

  // Find user by Stripe customer ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.error(`No user found for Stripe customer: ${customerId}`);
    return { success: false };
  }

  // Find subscription by Stripe subscription ID
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  
  if (!subscriptionId) {
    console.error('No subscription ID in failed payment invoice');
    return { success: false };
  }

  // Calculate grace period end date
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + config.gracePeriodDays);

  // Update subscription status to past_due with grace period
  await db
    .update(subscriptions)
    .set({
      status: 'past_due',
      metadata: sql`jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{dunning}',
        jsonb_build_object(
          'grace_period_end', '${gracePeriodEnd.toISOString()}',
          'attempt_count', 1,
          'last_failure', '${new Date().toISOString()}',
          'stripe_invoice_id', '${invoice.id}'
        )
      )`,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

  // Update user subscription status
  await db
    .update(users)
    .set({
      subscriptionStatus: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Log dunning event (in production, this would be stored in a dunning_events table)
  console.log('[Dunning] Payment failed for user:', {
    userId: user.id,
    subscriptionId,
    invoiceId: invoice.id,
    gracePeriodEnd,
    attemptCount: 1,
  });

  return {
    success: true,
    userId: user.id,
    gracePeriodEnd,
  };
}

/**
 * Check and process expired grace periods
 * Should be called by a scheduled job (cron/Vercel cron)
 */
export async function checkGracePeriods(): Promise<{
  processed: number;
  downgraded: number;
  recovered: number;
}> {
  const now = new Date();
  
  // Find all subscriptions with status 'past_due' and expired grace period
  const expiredSubscriptions = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      metadata: subscriptions.metadata,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'past_due'),
        sql`metadata->'dunning'->>'grace_period_end' IS NOT NULL`,
        sql`(metadata->'dunning'->>'grace_period_end')::timestamp <= ${now}`
      )
    );

  let downgraded = 0;
  let recovered = 0;

  for (const sub of expiredSubscriptions) {
    const dunningData = (sub.metadata as any)?.dunning;
    
    if (!dunningData) continue;

    // Check if payment was recovered (subscription might have been updated elsewhere)
    // In production, we would check the actual Stripe subscription status
    
    // For now, assume grace period expired - downgrade to free
    await db
      .update(subscriptions)
      .set({
        status: 'expired',
        metadata: sql`jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{dunning}',
          jsonb_build_object(
            'downgraded_at', '${new Date().toISOString()}',
            'previous_status', 'past_due'
          )
        )`,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id));

    // Downgrade user to free tier
    await db
      .update(users)
      .set({
        subscriptionTier: 'free',
        subscriptionStatus: 'expired',
        updatedAt: new Date(),
      })
      .where(eq(users.id, sub.userId));

    downgraded++;

    console.log('[Dunning] Subscription downgraded:', {
      subscriptionId: sub.stripeSubscriptionId,
      userId: sub.userId,
    });
  }

  return {
    processed: expiredSubscriptions.length,
    downgraded,
    recovered,
  };
}

/**
 * Mark subscription as recovered after successful payment
 */
export async function markSubscriptionRecovered(
  subscriptionId: string
): Promise<{ success: boolean }> {
  await db
    .update(subscriptions)
    .set({
      status: 'active',
      metadata: sql`jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{dunning}',
        jsonb_build_object(
          'recovered_at', '${new Date().toISOString()}',
          'previous_status', 'past_due'
        )
      )`,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

  console.log('[Dunning] Subscription recovered:', { subscriptionId });

  return { success: true };
}

/**
 * Get dunning status for a user
 */
export async function getDunningStatus(userId: number): Promise<{
  inDunning: boolean;
  gracePeriodEnd?: Date;
  attemptCount?: number;
}> {
  const [subscription] = await db
    .select({
      status: subscriptions.status,
      metadata: subscriptions.metadata,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!subscription || subscription.status !== 'past_due') {
    return { inDunning: false };
  }

  const dunningData = (subscription.metadata as any)?.dunning;
  
  if (!dunningData) {
    return { inDunning: true };
  }

  return {
    inDunning: true,
    gracePeriodEnd: dunningData.grace_period_end ? new Date(dunningData.grace_period_end) : undefined,
    attemptCount: dunningData.attempt_count || 1,
  };
}

/**
 * Calculate days remaining in grace period
 */
export function calculateGracePeriodRemaining(gracePeriodEnd: Date): number {
  const now = new Date();
  const diff = gracePeriodEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
}
