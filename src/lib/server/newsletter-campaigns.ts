import { eq, desc, sql } from 'drizzle-orm';
import { db, newsletterSubscriptions, newsletterCampaigns, newsletterAnalytics } from '../../db';
import type { NewsletterCampaign, NewNewsletterCampaign, NewsletterAnalytics, NewNewsletterAnalytics } from '../../db';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface CampaignAnalyticsResult {
  campaignId: number;
  totalSent: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

export interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalCampaigns: number;
  avgOpenRate: number;
  avgClickRate: number;
}

/**
 * Create a new newsletter campaign
 */
export async function createCampaign(
  subject: string,
  content: string,
  template: string = 'default',
  scheduledAt?: Date
): Promise<NewsletterCampaign> {
  const [campaign] = await db.insert(newsletterCampaigns).values({
    subject,
    content,
    template,
    status: scheduledAt ? 'scheduled' : 'draft',
    scheduledAt: scheduledAt || null,
  }).returning();

  return campaign;
}

/**
 * Get campaign by ID
 */
export async function getCampaign(campaignId: number): Promise<NewsletterCampaign | null> {
  const [campaign] = await db
    .select()
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, campaignId))
    .limit(1);

  return campaign || null;
}

/**
 * List all campaigns
 */
export async function listCampaigns(limit = 50): Promise<NewsletterCampaign[]> {
  return db
    .select()
    .from(newsletterCampaigns)
    .orderBy(desc(newsletterCampaigns.createdAt))
    .limit(limit);
}

/**
 * Update campaign
 */
export async function updateCampaign(
  campaignId: number,
  updates: Partial<Pick<NewsletterCampaign, 'subject' | 'content' | 'template' | 'scheduledAt' | 'status'>>
): Promise<NewsletterCampaign | null> {
  const [updated] = await db
    .update(newsletterCampaigns)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaignId))
    .returning();

  return updated || null;
}

/**
 * Delete campaign
 */
export async function deleteCampaign(campaignId: number): Promise<boolean> {
  const [deleted] = await db
    .delete(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, campaignId))
    .returning();

  return !!deleted;
}

/**
 * Send campaign to all active subscribers
 * Note: In production, this should integrate with an email service (SendGrid, Mailgun, etc.)
 */
export async function sendCampaign(campaignId: number): Promise<{ success: boolean; recipientCount: number; error?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { success: false, recipientCount: 0, error: 'Campaign not found' };
  }

  if (campaign.status === 'sent') {
    return { success: false, recipientCount: 0, error: 'Campaign already sent' };
  }

  // Get all active subscribers
  const subscribers = await getActiveSubscribers();
  const recipientCount = subscribers.length;

  // Update campaign status to sending
  await db
    .update(newsletterCampaigns)
    .set({
      status: 'sending',
      recipientCount,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaignId));

  try {
    // In production: Send emails via email service API
    // For now, we simulate the sending process
    console.log(`[Newsletter] Sending campaign "${campaign.subject}" to ${recipientCount} subscribers`);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update campaign as sent
    await db
      .update(newsletterCampaigns)
      .set({
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, campaignId));

    return { success: true, recipientCount };
  } catch (error) {
    await db
      .update(newsletterCampaigns)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, campaignId));

    return {
      success: false,
      recipientCount: 0,
      error: error instanceof Error ? error.message : 'Failed to send campaign',
    };
  }
}

/**
 * Track email open
 */
export async function trackOpen(campaignId: number, subscriberId: number): Promise<void> {
  // Insert analytics event
  await db.insert(newsletterAnalytics).values({
    campaignId,
    subscriberId,
    eventType: 'open',
  });

  // Increment open count on campaign
  await db
    .update(newsletterCampaigns)
    .set({
      openCount: sql`${newsletterCampaigns.openCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaignId));

  console.log(`[Newsletter] Open tracked: campaign=${campaignId}, subscriber=${subscriberId}`);
}

/**
 * Track link click
 */
export async function trackClick(campaignId: number, subscriberId: number, url: string): Promise<void> {
  // Insert analytics event with URL metadata
  await db.insert(newsletterAnalytics).values({
    campaignId,
    subscriberId,
    eventType: 'click',
    metadata: { url },
  });

  // Increment click count on campaign
  await db
    .update(newsletterCampaigns)
    .set({
      clickCount: sql`${newsletterCampaigns.clickCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaignId));

  console.log(`[Newsletter] Click tracked: campaign=${campaignId}, subscriber=${subscriberId}, url=${url}`);
}

/**
 * Track bounce
 */
export async function trackBounce(campaignId: number, subscriberId: number, email: string): Promise<void> {
  // Insert analytics event
  await db.insert(newsletterAnalytics).values({
    campaignId,
    subscriberId,
    eventType: 'bounce',
  });

  // Increment bounce count on campaign
  await db
    .update(newsletterCampaigns)
    .set({
      bounceCount: sql`${newsletterCampaigns.bounceCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaignId));

  // Mark subscriber as bounced
  await markEmailAsBounced(email);
}

/**
 * Track unsubscribe
 */
export async function trackUnsubscribe(campaignId: number, subscriberId: number, email: string): Promise<void> {
  // Insert analytics event
  await db.insert(newsletterAnalytics).values({
    campaignId,
    subscriberId,
    eventType: 'unsubscribe',
  });

  // Increment unsubscribe count on campaign
  await db
    .update(newsletterCampaigns)
    .set({
      unsubscribeCount: sql`${newsletterCampaigns.unsubscribeCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaignId));

  // Unsubscribe the user
  await unsubscribeFromNewsletter(email);
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: number): Promise<CampaignAnalyticsResult | null> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return null;

  const totalSent = campaign.recipientCount ?? 0;
  const opens = campaign.openCount ?? 0;
  const clicks = campaign.clickCount ?? 0;
  const bounces = campaign.bounceCount ?? 0;
  const unsubscribes = campaign.unsubscribeCount ?? 0;

  return {
    campaignId,
    totalSent,
    opens,
    clicks,
    bounces,
    unsubscribes,
    openRate: totalSent > 0 ? (opens / totalSent) * 100 : 0,
    clickRate: totalSent > 0 ? (clicks / totalSent) * 100 : 0,
    bounceRate: totalSent > 0 ? (bounces / totalSent) * 100 : 0,
    unsubscribeRate: totalSent > 0 ? (unsubscribes / totalSent) * 100 : 0,
  };
}

/**
 * Get overall newsletter statistics
 */
export async function getNewsletterStats(): Promise<NewsletterStats> {
  const stats = await getSubscriberStats();

  // Get campaign statistics
  const campaigns = await db
    .select()
    .from(newsletterCampaigns);

  const sentCampaigns = campaigns.filter(c => c.status === 'sent');

  let avgOpenRate = 0;
  let avgClickRate = 0;

  if (sentCampaigns.length > 0) {
    const totalOpens = sentCampaigns.reduce((sum, c) => sum + (c.openCount || 0), 0);
    const totalClicks = sentCampaigns.reduce((sum, c) => sum + (c.clickCount || 0), 0);
    const totalRecipients = sentCampaigns.reduce((sum, c) => sum + (c.recipientCount || 0), 0);

    avgOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;
    avgClickRate = totalRecipients > 0 ? (totalClicks / totalRecipients) * 100 : 0;
  }

  return {
    totalSubscribers: stats.total,
    activeSubscribers: stats.active,
    totalCampaigns: campaigns.length,
    avgOpenRate: Math.round(avgOpenRate * 10) / 10,
    avgClickRate: Math.round(avgClickRate * 10) / 10,
  };
}

/**
 * Get analytics events for a campaign
 */
export async function getCampaignEvents(campaignId: number, limit = 100): Promise<NewsletterAnalytics[]> {
  return db
    .select()
    .from(newsletterAnalytics)
    .where(eq(newsletterAnalytics.campaignId, campaignId))
    .orderBy(desc(newsletterAnalytics.createdAt))
    .limit(limit);
}

/**
 * Get subscriber ID by email (for tracking)
 */
export async function getSubscriberIdByEmail(email: string): Promise<number | null> {
  const [subscriber] = await db
    .select({ id: newsletterSubscriptions.id })
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.email, email))
    .limit(1);

  return subscriber?.id || null;
}

/**
 * Get all scheduled campaigns that are due to be sent
 */
export async function getDueScheduledCampaigns(): Promise<NewsletterCampaign[]> {
  const now = new Date();
  const campaigns = await db
    .select()
    .from(newsletterCampaigns)
    .where(sql`${newsletterCampaigns.status} = 'scheduled' AND ${newsletterCampaigns.scheduledAt} <= ${now}`);

  return campaigns;
}

/**
 * Process all scheduled campaigns that are due
 * This function is idempotent - it will only send campaigns that haven't been sent yet
 * Returns the number of campaigns processed and any errors
 */
export async function processScheduledCampaigns(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  results: Array<{ campaignId: number; subject: string; success: boolean; recipientCount?: number; error?: string }>;
}> {
  const dueCampaigns = await getDueScheduledCampaigns();
  const results: Array<{ campaignId: number; subject: string; success: boolean; recipientCount?: number; error?: string }> = [];

  let sent = 0;
  let failed = 0;

  for (const campaign of dueCampaigns) {
    // Double-check status before sending (idempotency)
    const currentCampaign = await getCampaign(campaign.id);
    if (!currentCampaign || currentCampaign.status !== 'scheduled') {
      continue; // Skip if status changed or campaign deleted
    }

    // Send the campaign
    const result = await sendCampaign(campaign.id);

    if (result.success) {
      sent++;
      results.push({
        campaignId: campaign.id,
        subject: campaign.subject,
        success: true,
        recipientCount: result.recipientCount,
      });
    } else {
      failed++;
      results.push({
        campaignId: campaign.id,
        subject: campaign.subject,
        success: false,
        error: result.error,
      });
    }
  }

  return {
    processed: dueCampaigns.length,
    sent,
    failed,
    results,
  };
}

/**
 * Schedule a campaign for future delivery
 */
export async function scheduleCampaign(
  campaignId: number,
  scheduledAt: Date
): Promise<{ success: boolean; campaign?: NewsletterCampaign; error?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  if (campaign.status === 'sent') {
    return { success: false, error: 'Cannot schedule a campaign that has already been sent' };
  }

  if (campaign.status === 'sending') {
    return { success: false, error: 'Campaign is currently being sent' };
  }

  // Validate scheduled time is in the future
  if (scheduledAt <= new Date()) {
    return { success: false, error: 'Scheduled time must be in the future' };
  }

  const updated = await updateCampaign(campaignId, {
    status: 'scheduled',
    scheduledAt,
  });

  return {
    success: true,
    campaign: updated || undefined,
  };
}

/**
 * Cancel a scheduled campaign
 */
export async function cancelScheduledCampaign(campaignId: number): Promise<{ success: boolean; campaign?: NewsletterCampaign; error?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  if (campaign.status !== 'scheduled') {
    return { success: false, error: 'Can only cancel scheduled campaigns' };
  }

  const updated = await updateCampaign(campaignId, {
    status: 'draft',
    scheduledAt: null,
  });

  return {
    success: true,
    campaign: updated || undefined,
  };
}

/**
 * Reschedule a campaign
 */
export async function rescheduleCampaign(
  campaignId: number,
  newScheduledAt: Date
): Promise<{ success: boolean; campaign?: NewsletterCampaign; error?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  if (campaign.status !== 'scheduled') {
    return { success: false, error: 'Can only reschedule scheduled campaigns' };
  }

  // Validate new scheduled time is in the future
  if (newScheduledAt <= new Date()) {
    return { success: false, error: 'Scheduled time must be in the future' };
  }

  const updated = await updateCampaign(campaignId, {
    scheduledAt: newScheduledAt,
  });

  return {
    success: true,
    campaign: updated || undefined,
  };
}

// Import helper functions from newsletter.ts
import { getActiveSubscribers, markEmailAsBounced, unsubscribeFromNewsletter, getSubscriberStats } from './newsletter';
