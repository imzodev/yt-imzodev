import { db, users, subscriptions, payments, subscriptionPlans, videos, blogPosts, snippets, forumPosts, forumReports } from '../../db';
import { eq, and, gte, count, sum } from 'drizzle-orm';

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  paymentSuccessRate: number;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  premiumUsers: number;
  freeUsers: number;
}

export interface ContentMetrics {
  totalVideos: number;
  totalBlogPosts: number;
  totalSnippets: number;
  totalForumPosts: number;
  pendingReports: number;
}

export interface DashboardStats {
  revenue: RevenueMetrics;
  users: UserMetrics;
  content: ContentMetrics;
}

/**
 * Get revenue metrics for the dashboard
 */
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get active subscriptions
  const activeSubs = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'));

  const activeSubscriptionCount = activeSubs[0]?.count || 0;

  // Get total revenue from successful payments
  const totalPayments = await db
    .select({ 
      total: sum(payments.amount),
      count: count() 
    })
    .from(payments)
    .where(eq(payments.status, 'succeeded'));

  const totalRevenue = Number(totalPayments[0]?.total || 0) / 100; // Convert from cents

  // Get successful vs failed payments
  const successfulPayments = await db
    .select({ count: count() })
    .from(payments)
    .where(eq(payments.status, 'succeeded'));

  const failedPayments = await db
    .select({ count: count() })
    .from(payments)
    .where(eq(payments.status, 'failed'));

  const totalPaymentAttempts = (successfulPayments[0]?.count || 0) + (failedPayments[0]?.count || 0);
  const paymentSuccessRate = totalPaymentAttempts > 0 
    ? ((successfulPayments[0]?.count || 0) / totalPaymentAttempts) * 100 
    : 0;

  // Calculate MRR from subscription plans (simplified - assumes monthly)
  const plans = await db.select().from(subscriptionPlans);
  const monthlyPlans = plans.filter(p => p.interval === 'month');
  
  // Simplified MRR calculation
  const avgMonthlyPrice = monthlyPlans.length > 0 
    ? monthlyPlans.reduce((sum, p) => sum + (p.amount / 100), 0) / monthlyPlans.length 
    : 9.99;

  const mrr = activeSubscriptionCount * avgMonthlyPrice;
  const arr = mrr * 12;

  // Churn rate (simplified - canceled this month vs active)
  const canceledThisMonth = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.status, 'canceled'),
      gte(subscriptions.updatedAt, startOfMonth)
    ));

  const churnRate = activeSubscriptionCount > 0 
    ? ((canceledThisMonth[0]?.count || 0) / activeSubscriptionCount) * 100 
    : 0;

  return {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(arr * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    activeSubscriptions: activeSubscriptionCount,
    churnRate: Math.round(churnRate * 10) / 10,
    paymentSuccessRate: Math.round(paymentSuccessRate * 10) / 10,
  };
}

/**
 * Get user metrics for the dashboard
 */
export async function getUserMetrics(): Promise<UserMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total users
  const totalUsersResult = await db
    .select({ count: count() })
    .from(users);

  const totalUsers = totalUsersResult[0]?.count || 0;

  // Active users (isActive = true)
  const activeUsersResult = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true));

  const activeUsers = activeUsersResult[0]?.count || 0;

  // New users this month
  const newUsersResult = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, startOfMonth));

  const newUsersThisMonth = newUsersResult[0]?.count || 0;

  // Premium users
  const premiumUsersResult = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.subscriptionTier, 'premium'));

  const premiumUsers = premiumUsersResult[0]?.count || 0;

  // Free users
  const freeUsersResult = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.subscriptionTier, 'free'));

  const freeUsers = freeUsersResult[0]?.count || 0;

  return {
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    premiumUsers,
    freeUsers,
  };
}

/**
 * Get content metrics for the dashboard
 */
export async function getContentMetrics(): Promise<ContentMetrics> {
  // Total videos
  const videosResult = await db
    .select({ count: count() })
    .from(videos);

  // Total blog posts
  const blogResult = await db
    .select({ count: count() })
    .from(blogPosts);

  // Total snippets
  const snippetsResult = await db
    .select({ count: count() })
    .from(snippets);

  // Total forum posts
  const forumResult = await db
    .select({ count: count() })
    .from(forumPosts);

  // Pending reports
  const reportsResult = await db
    .select({ count: count() })
    .from(forumReports)
    .where(eq(forumReports.status, 'open'));

  return {
    totalVideos: videosResult[0]?.count || 0,
    totalBlogPosts: blogResult[0]?.count || 0,
    totalSnippets: snippetsResult[0]?.count || 0,
    totalForumPosts: forumResult[0]?.count || 0,
    pendingReports: reportsResult[0]?.count || 0,
  };
}

/**
 * Get all dashboard stats in one call
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [revenue, users, content] = await Promise.all([
    getRevenueMetrics(),
    getUserMetrics(),
    getContentMetrics(),
  ]);

  return { revenue, users, content };
}

/**
 * Get list of users with filters
 */
export async function listUsers(options: {
  limit?: number;
  offset?: number;
  tier?: string;
  status?: string;
  search?: string;
}) {
  const { limit = 50, offset = 0, tier, status, search } = options;

  let query = db.select().from(users);

  // Apply filters (simplified - in production use proper query builder)
  const conditions = [];
  if (tier) {
    conditions.push(eq(users.subscriptionTier, tier));
  }
  if (status === 'active') {
    conditions.push(eq(users.isActive, true));
  } else if (status === 'inactive') {
    conditions.push(eq(users.isActive, false));
  }

  // For now, return all users (complex filtering would need proper implementation)
  const allUsers = await db
    .select()
    .from(users)
    .limit(limit)
    .offset(offset);

  return allUsers;
}

/**
 * Get list of subscriptions with filters
 */
export async function listSubscriptions(options: {
  limit?: number;
  offset?: number;
  status?: string;
}) {
  const { limit = 50, offset = 0, status } = options;

  // Build query with optional status filter
  if (status) {
    const result = await db
      .select({
        subscription: subscriptions,
        user: users,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.status, status))
      .limit(limit)
      .offset(offset);
    return result;
  }

  const result = await db
    .select({
      subscription: subscriptions,
      user: users,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Get list of failed payments
 */
export async function listFailedPayments(options: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 50, offset = 0 } = options;

  const result = await db
    .select({
      payment: payments,
      user: users,
    })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .where(eq(payments.status, 'failed'))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Get user by ID with subscription info
 */
export async function getUserWithSubscription(userId: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return { user, subscription };
}

/**
 * Update user role
 */
export async function updateUserRole(userId: number, role: string) {
  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return updated;
}

/**
 * Suspend/restore user account
 */
export async function setUserActiveStatus(userId: number, isActive: boolean) {
  const [updated] = await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return updated;
}
