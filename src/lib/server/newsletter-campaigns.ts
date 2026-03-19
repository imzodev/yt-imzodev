import { eq, and, desc, sql } from 'drizzle-orm';
import { db, newsletterSubscriptions, users } from '../../db';
import { nanoid } from 'nanoid';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface NewsletterCampaign {
  id: string;
  subject: string;
  content: string;
  htmlContent: string;
  status: CampaignStatus;
  scheduledAt: Date | null;
  sentAt: Date | null;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignAnalytics {
  campaignId: string;
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

// In-memory store for campaigns (in production, use database table)
const campaigns = new Map<string, NewsletterCampaign>();

/**
 * Create a new newsletter campaign
 */
export async function createCampaign(
  subject: string,
  content: string,
  htmlContent: string,
  scheduledAt?: Date
): Promise<NewsletterCampaign> {
  const campaignId = nanoid(12);
  const now = new Date();

  const campaign: NewsletterCampaign = {
    id: campaignId,
    subject,
    content,
    htmlContent,
    status: scheduledAt ? 'scheduled' : 'draft',
    scheduledAt: scheduledAt || null,
    sentAt: null,
    recipientCount: 0,
    openCount: 0,
    clickCount: 0,
    bounceCount: 0,
    unsubscribeCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  campaigns.set(campaignId, campaign);
  return campaign;
}

/**
 * Get campaign by ID
 */
export async function getCampaign(campaignId: string): Promise<NewsletterCampaign | null> {
  return campaigns.get(campaignId) || null;
}

/**
 * List all campaigns
 */
export async function listCampaigns(limit = 50): Promise<NewsletterCampaign[]> {
  return Array.from(campaigns.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Update campaign
 */
export async function updateCampaign(
  campaignId: string,
  updates: Partial<Pick<NewsletterCampaign, 'subject' | 'content' | 'htmlContent' | 'scheduledAt' | 'status'>>
): Promise<NewsletterCampaign | null> {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return null;

  const updated = {
    ...campaign,
    ...updates,
    updatedAt: new Date(),
  };

  campaigns.set(campaignId, updated);
  return updated;
}

/**
 * Delete campaign
 */
export async function deleteCampaign(campaignId: string): Promise<boolean> {
  return campaigns.delete(campaignId);
}

/**
 * Send campaign to all active subscribers
 * Note: In production, this should integrate with an email service (SendGrid, Mailgun, etc.)
 */
export async function sendCampaign(campaignId: string): Promise<{ success: boolean; recipientCount: number; error?: string }> {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    return { success: false, recipientCount: 0, error: 'Campaign not found' };
  }

  if (campaign.status === 'sent') {
    return { success: false, recipientCount: 0, error: 'Campaign already sent' };
  }

  // Get all active subscribers
  const subscribers = await getActiveSubscribers();
  const recipientCount = subscribers.length;

  // Update campaign status
  campaign.status = 'sending';
  campaign.recipientCount = recipientCount;
  campaign.updatedAt = new Date();
  campaigns.set(campaignId, campaign);

  try {
    // In production: Send emails via email service API
    // For now, we simulate the sending process
    console.log(`[Newsletter] Sending campaign "${campaign.subject}" to ${recipientCount} subscribers`);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update campaign as sent
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.updatedAt = new Date();
    campaigns.set(campaignId, campaign);

    return { success: true, recipientCount };
  } catch (error) {
    campaign.status = 'failed';
    campaign.updatedAt = new Date();
    campaigns.set(campaignId, campaign);

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
export async function trackOpen(campaignId: string, email: string): Promise<void> {
  const campaign = campaigns.get(campaignId);
  if (campaign) {
    campaign.openCount++;
    campaigns.set(campaignId, campaign);
  }

  // Log the open event (in production, store in database)
  console.log(`[Newsletter] Open tracked: campaign=${campaignId}, email=${email}`);
}

/**
 * Track link click
 */
export async function trackClick(campaignId: string, email: string, url: string): Promise<void> {
  const campaign = campaigns.get(campaignId);
  if (campaign) {
    campaign.clickCount++;
    campaigns.set(campaignId, campaign);
  }

  // Log the click event (in production, store in database)
  console.log(`[Newsletter] Click tracked: campaign=${campaignId}, email=${email}, url=${url}`);
}

/**
 * Track bounce
 */
export async function trackBounce(campaignId: string, email: string): Promise<void> {
  const campaign = campaigns.get(campaignId);
  if (campaign) {
    campaign.bounceCount++;
    campaigns.set(campaignId, campaign);
  }

  // Mark subscriber as bounced
  await markEmailAsBounced(email);
}

/**
 * Track unsubscribe
 */
export async function trackUnsubscribe(campaignId: string, email: string): Promise<void> {
  const campaign = campaigns.get(campaignId);
  if (campaign) {
    campaign.unsubscribeCount++;
    campaigns.set(campaignId, campaign);
  }

  // Unsubscribe the user
  await unsubscribeFromNewsletter(email);
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
  const campaign = campaigns.get(campaignId);
  if (!campaign) return null;

  const totalSent = campaign.recipientCount;
  const opens = campaign.openCount;
  const clicks = campaign.clickCount;
  const bounces = campaign.bounceCount;
  const unsubscribes = campaign.unsubscribeCount;

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
export async function getNewsletterStats(): Promise<{
  totalSubscribers: number;
  activeSubscribers: number;
  totalCampaigns: number;
  avgOpenRate: number;
  avgClickRate: number;
}> {
  const stats = await getSubscriberStats();
  const allCampaigns = Array.from(campaigns.values());
  const sentCampaigns = allCampaigns.filter(c => c.status === 'sent');

  let avgOpenRate = 0;
  let avgClickRate = 0;

  if (sentCampaigns.length > 0) {
    const totalOpens = sentCampaigns.reduce((sum, c) => sum + c.openCount, 0);
    const totalClicks = sentCampaigns.reduce((sum, c) => sum + c.clickCount, 0);
    const totalRecipients = sentCampaigns.reduce((sum, c) => sum + c.recipientCount, 0);

    avgOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;
    avgClickRate = totalRecipients > 0 ? (totalClicks / totalRecipients) * 100 : 0;
  }

  return {
    totalSubscribers: stats.total,
    activeSubscribers: stats.active,
    totalCampaigns: allCampaigns.length,
    avgOpenRate: Math.round(avgOpenRate * 10) / 10,
    avgClickRate: Math.round(avgClickRate * 10) / 10,
  };
}

// Import helper functions from newsletter.ts
import { getActiveSubscribers, markEmailAsBounced, unsubscribeFromNewsletter, getSubscriberStats } from './newsletter';
