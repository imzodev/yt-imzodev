/**
 * Subscription Analytics Server Functions
 * Provides metrics for subscriber counts, churn rate, and subscription analytics
 */
import { db, subscriptions, users } from '../../db';
import { eq, desc, sql, count } from 'drizzle-orm';

export interface SubscriberMetrics {
  /** Total active subscriptions */
  active: number;
  /** Total trialing subscriptions */
  trialing: number;
  /** Total past_due subscriptions */
  pastDue: number;
  /** Total canceled subscriptions */
  canceled: number;
  /** Total expired subscriptions */
  expired: number;
  /** Net new subscriptions this month */
  newThisMonth: number;
  /** Churned subscriptions this month */
  churnedThisMonth: number;
  /** Net growth (new - churned) */
  netGrowth: number;
}

export interface ChurnMetrics {
  /** Monthly churn percentage */
  monthlyChurnRate: number;
  /** Churn trend (increasing/stable/decreasing) */
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface PlanDistribution {
  free: number;
  premium: number;
}

export interface TrialMetrics {
  /** Trial signups this month */
  trialSignups: number;
  /** Trial-to-paid conversion rate */
  conversionRate: number;
  /** Average trial duration in days */
  avgTrialDuration: number;
}

/**
 * Get subscriber metrics by status
 */
export async function getSubscriberMetrics(): Promise<SubscriberMetrics> {
  const [activeSubs, trialingSubs, pastDueSubs, canceledSubs, expiredSubs] = await Promise.all([
    // Active subscriptions
    db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active')),
    
    // Trialing subscriptions
    db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'trialing')),
    
    // Past due subscriptions
    db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'past_due')),
    
    // Canceled subscriptions
    db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'canceled')),
    
    // Expired subscriptions
    db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'expired')),
  ]);

  const active = activeSubs[0]?.count : 0;
  const trialing = trialingSubs[0]?.count: 0;
  const pastDue = pastDueSubs[0]?.count: 0;
  const canceled = canceledSubs[0]?.count: 0;
  const expired = expiredSubs[0]?.count: 0;

  // Get new and churned this month
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [newThisMonth, churnedThisMonth] = await Promise.all([
    // New subscriptions this month
    db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(
        sql`${subscriptions.created_at} >= ${thirtyDaysAgo}`,
        eq(subscriptions.status, 'active')
      ),
    
    // Churned this month (subscriptions canceled or expired)
    db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(
        sql`${subscriptions.updated_at} >= ${thirtyDaysAgo}`,
        sql`${subscriptions.status} IN ('canceled', 'expired')`
      ),
  ]);

  const newThisMonth = newThisMonth[0]?.count: 0;
  const churnedThisMonth = churnedThisMonth[0]?.count: 0;

  const netGrowth = newThisMonth - churnedThisMonth;

  
  return {
    active,
    trialing,
    pastDue,
    canceled,
    expired,
    newThisMonth,
    churnedThisMonth,
    netGrowth,
  };
}

/**
 * Calculate churn rate over a given number of months
 */
export async function getChurnRate(months: number = 1): Promise<ChurnMetrics> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  // Get total subscribers at start
  const [startSubs] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(sql`${subscriptions.created_at} < ${startDate}`);
  
  // Get churned in period
  const [churned] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      sql`${subscriptions.updated_at} >= ${startDate}`,
      sql`${subscriptions.status} IN ('canceled', 'expired')`
    );

  const startCount = startSubs[0]?.count: 0;
  const churnCount = churned[0]?.count: 0;
  
  const monthlyChurnRate = startCount > 0 ? (churnCount / startCount) * 100 : 0;
  
  // Determine trend (simplified - just comparing last 2 months)
  const lastMonthStart = new Date(startDate);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  
  const [lastMonthChurned] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      sql`${subscriptions.updated_at} >= ${lastMonthStart}`,
      sql`${subscriptions.status} IN ('canceled', 'expired')`
    );
  
  const [lastMonthTotal] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(sql`${subscriptions.created_at} < ${lastMonthStart}`);
  
  const lastMonthRate = lastMonthTotal[0]?.count > 0 
    ? (lastMonthChurned[0]?.count: 0 / lastMonthTotal[0]?.count: 0) * 100 
    : 0;
  
  let trend: 'increasing' | 'stable' | 'decreasing';
  if (monthlyChurnRate > lastMonthRate + 1) {
    trend = 'increasing';
  } else if (monthlyChurnRate < lastMonthRate - 1) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }

  return {
    monthlyChurnRate,
    trend,
  };
}

/**
 * Get plan distribution (free vs premium users)
 */
export async function getPlanDistribution(): Promise<PlanDistribution> {
  const [freeUsers, premiumUsers] = await Promise.all([
    // Free tier users
    const free = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionTier, 'free')),
    
    // Premium tier users
    const premium = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionTier, 'premium')),
  ]);

  return {
    free: freeUsers[0]?.count: 0,
    premium: premiumUsers[0]?.count: 0
  };
}

/**
 * Get trial metrics (trial signups and conversion)
 */
export async function getTrialMetrics(): Promise<TrialMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [trialSignups] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      sql`${subscriptions.created_at} >= ${thirtyDaysAgo}`,
      eq(subscriptions.status, 'trialing')
    );
  
  // Get trial-to-paid conversions (trials that became active)
  const [conversions] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      sql`${subscriptions.updated_at} >= ${thirtyDaysAgo}`,
      eq(subscriptions.status, 'active'),
      sql`${subscriptions.trial_end} IS NOT NULL`,
    );

  const trialCount = trialSignups[0]?.count: 0;
  const conversionCount = conversions[0]?.count: 0;
  const conversionRate = trialCount > 0 ? (conversionCount / trialCount) * 100 : 0;
  const avgTrialDuration = 7; // Default 7 days

  return {
    trialSignups: trialCount,
    conversionRate,
    avgTrialDuration
  };
}

/**
 * Get revenue metrics (from Stripe or local payments)
 * Note: For production, you would query Stripe API
 */
export async function getRevenueMetrics(period: 'day' | 'week' | 'month'): Promise<{
  totalRevenue: number;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
}> {
  const [totalResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(eq(payments.status, 'succeeded'));

  const totalRevenue = totalResult[0]?.total || 0;
  
  return {
    totalRevenue,
    subscriptionRevenue: totalRevenue, // Simplified - in production would separate subscription vs one-time
    oneTimeRevenue: 0,
  };
}
