import { eq, and, desc } from 'drizzle-orm';
import { db, newsletterSubscriptions } from '../../db';

export type NewsletterStatus = 'active' | 'unsubscribed' | 'bounced';
export type NewsletterPreference = 'all' | 'important' | 'weekly' | 'none';

export interface NewsletterSubscriber {
  id: number;
  email: string;
  userId: number | null;
  status: NewsletterStatus;
  preferences: Record<string, unknown> | null;
  subscribedAt: Date | null;
  unsubscribedAt: Date | null;
}

export interface SubscribeInput {
  email: string;
  userId?: number;
  preferences?: Record<string, unknown>;
}

export interface UpdatePreferencesInput {
  email: string;
  preferences: Record<string, unknown>;
}

/**
 * Subscribe an email to the newsletter
 */
export async function subscribeToNewsletter(input: SubscribeInput): Promise<NewsletterSubscriber> {
  const [existing] = await db
    .select()
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.email, input.email))
    .limit(1);

  if (existing) {
    // If already subscribed, but unsubscribed, re-subscribe
    if (existing.status === 'unsubscribed') {
      const [updated] = await db
        .update(newsletterSubscriptions)
        .set({
          status: 'active',
          subscribedAt: new Date(),
          unsubscribedAt: null,
          preferences: input.preferences ?? existing.preferences,
          updatedAt: new Date(),
        })
        .where(eq(newsletterSubscriptions.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  const [subscriber] = await db
    .insert(newsletterSubscriptions)
    .values({
      email: input.email,
      userId: input.userId ?? null,
      preferences: input.preferences ?? null,
      status: 'active',
    })
    .returning();

  return subscriber;
}

/**
 * Unsubscribe an email from the newsletter
 */
export async function unsubscribeFromNewsletter(email: string): Promise<boolean> {
  const [updated] = await db
    .update(newsletterSubscriptions)
    .set({
      status: 'unsubscribed',
      unsubscribedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(newsletterSubscriptions.email, email))
    .returning();

  return !!updated;
}

/**
 * Update newsletter preferences
 */
export async function updateNewsletterPreferences(
  input: UpdatePreferencesInput
): Promise<NewsletterSubscriber | null> {
  const [updated] = await db
    .update(newsletterSubscriptions)
    .set({
      preferences: input.preferences,
      updatedAt: new Date(),
    })
    .where(eq(newsletterSubscriptions.email, input.email))
    .returning();

  return updated ?? null;
}

/**
 * Get subscriber by email
 */
export async function getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | null> {
  const [subscriber] = await db
    .select()
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.email, email))
    .limit(1);

  return subscriber ?? null;
}

/**
 * Get all active subscribers
 */
export async function getActiveSubscribers(limit = 1000): Promise<NewsletterSubscriber[]> {
  const subscribers = await db
    .select()
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.status, 'active'))
    .orderBy(desc(newsletterSubscriptions.subscribedAt))
    .limit(limit);

  return subscribers;
}

/**
 * Get subscriber count by status
 */
export async function getSubscriberStats(): Promise<{
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
}> {
  const all = await db.select().from(newsletterSubscriptions);

  return {
    total: all.length,
    active: all.filter((s) => s.status === 'active').length,
    unsubscribed: all.filter((s) => s.status === 'unsubscribed').length,
    bounced: all.filter((s) => s.status === 'bounced').length,
  };
}

/**
 * Mark email as bounced
 */
export async function markEmailAsBounced(email: string): Promise<boolean> {
  const [updated] = await db
    .update(newsletterSubscriptions)
    .set({
      status: 'bounced',
      updatedAt: new Date(),
    })
    .where(eq(newsletterSubscriptions.email, email))
    .returning();

  return !!updated;
}

/**
 * Sync user's newsletter subscription with their account
 */
export async function syncUserNewsletterSubscription(
  userId: number,
  email: string,
  subscribed: boolean
): Promise<NewsletterSubscriber | null> {
  if (subscribed) {
    return await subscribeToNewsletter({ email, userId });
  } else {
    await unsubscribeFromNewsletter(email);
    return null;
  }
}

/**
 * Check if user is subscribed to newsletter
 */
export async function isSubscribedToNewsletter(email: string): Promise<boolean> {
  const subscriber = await getSubscriberByEmail(email);
  return subscriber?.status === 'active';
}
