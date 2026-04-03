/**
 * Usage Analytics Server Functions
 * Track and display premium feature usage for subscribers
 */

import { db, userActivity, videos, blogPosts, snippets } from '../../db';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';

export interface PremiumUsageStats {
  /** Number of premium videos watched */
  premiumVideosWatched: number;
  /** Number of premium articles read */
  premiumArticlesRead: number;
  /** Number of premium snippets accessed */
  premiumSnippetsAccessed: number;
  /** Total premium content interactions */
  totalPremiumInteractions: number;
  /** Most watched premium video category */
  favoriteCategory: string | null;
  /** Usage period start date */
  periodStart: Date;
  /** Usage period end date */
  periodEnd: Date;
}

export interface UsageLimit {
  /** Feature name */
  feature: string;
  /** Current usage count */
  used: number;
  /** Maximum allowed (null = unlimited) */
  limit: number | null;
  /** Whether approaching limit (>=80%) */
  approachingLimit: boolean;
  /** Whether at limit */
  atLimit: boolean;
}

export interface PremiumContentItem {
  id: number;
  title: string;
  type: 'video' | 'article' | 'snippet';
  accessedAt: Date | null;
  thumbnail?: string | null;
}

/**
 * Get premium usage statistics for a user
 */
export async function getPremiumUsageStats(
  userId: number,
  periodDays: number = 30
): Promise<PremiumUsageStats> {
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);

  // Get premium video views
  const premiumVideoViews = await db
    .select({ count: sql<number>`count(DISTINCT ${userActivity.entityId})::int` })
    .from(userActivity)
    .innerJoin(videos, eq(userActivity.entityId, videos.id))
    .where(
      and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, 'view'),
        eq(userActivity.entityType, 'video'),
        eq(videos.isPremium, true),
        gte(userActivity.createdAt, periodStart),
        lte(userActivity.createdAt, periodEnd)
      )
    );

  // Get premium article reads
  const premiumArticleReads = await db
    .select({ count: sql<number>`count(DISTINCT ${userActivity.entityId})::int` })
    .from(userActivity)
    .innerJoin(blogPosts, eq(userActivity.entityId, blogPosts.id))
    .where(
      and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, 'view'),
        eq(userActivity.entityType, 'blog'),
        eq(blogPosts.accessLevel, 'premium'),
        gte(userActivity.createdAt, periodStart),
        lte(userActivity.createdAt, periodEnd)
      )
    );

  // Get premium snippet accesses
  const premiumSnippetAccesses = await db
    .select({ count: sql<number>`count(DISTINCT ${userActivity.entityId})::int` })
    .from(userActivity)
    .innerJoin(snippets, eq(userActivity.entityId, snippets.id))
    .where(
      and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, 'view'),
        eq(userActivity.entityType, 'snippet'),
        eq(snippets.accessLevel, 'premium'),
        gte(userActivity.createdAt, periodStart),
        lte(userActivity.createdAt, periodEnd)
      )
    );

  // Calculate total
  const videosCount = premiumVideoViews[0]?.count || 0;
  const articlesCount = premiumArticleReads[0]?.count || 0;
  const snippetsCount = premiumSnippetAccesses[0]?.count || 0;

  // Get favorite category (most watched video category)
  const categoryResult = await db
    .select({
      categoryId: videos.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(userActivity)
    .innerJoin(videos, eq(userActivity.entityId, videos.id))
    .where(
      and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, 'view'),
        eq(userActivity.entityType, 'video'),
        eq(videos.isPremium, true),
        gte(userActivity.createdAt, periodStart),
        lte(userActivity.createdAt, periodEnd)
      )
    )
    .groupBy(videos.categoryId)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  return {
    premiumVideosWatched: videosCount,
    premiumArticlesRead: articlesCount,
    premiumSnippetsAccessed: snippetsCount,
    totalPremiumInteractions: videosCount + articlesCount + snippetsCount,
    favoriteCategory: categoryResult[0]?.categoryId?.toString() || null,
    periodStart,
    periodEnd,
  };
}

/**
 * Get usage limits for a subscription tier
 * Returns current usage vs limits for display
 */
export async function getUsageLimits(
  userId: number,
  subscriptionTier: string
): Promise<UsageLimit[]> {
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 30);

  // For now, premium tier has unlimited access
  // Free tier has limits
  const limits: UsageLimit[] = [];

  if (subscriptionTier === 'free') {
    // Get current month video views
    const videoViews = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          eq(userActivity.action, 'view'),
          eq(userActivity.entityType, 'video'),
          gte(userActivity.createdAt, periodStart)
        )
      );

    const usedVideos = videoViews[0]?.count || 0;
    const videoLimit = 5; // Free tier: 5 videos per month

    limits.push({
      feature: 'Videos',
      used: usedVideos,
      limit: videoLimit,
      approachingLimit: usedVideos >= videoLimit * 0.8,
      atLimit: usedVideos >= videoLimit,
    });

    // Blog posts limit
    const blogReads = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          eq(userActivity.action, 'view'),
          eq(userActivity.entityType, 'blog'),
          gte(userActivity.createdAt, periodStart)
        )
      );

    const usedBlogs = blogReads[0]?.count || 0;
    const blogLimit = 3; // Free tier: 3 premium articles per month

    limits.push({
      feature: 'Premium Articles',
      used: usedBlogs,
      limit: blogLimit,
      approachingLimit: usedBlogs >= blogLimit * 0.8,
      atLimit: usedBlogs >= blogLimit,
    });
  } else {
    // Premium tier - unlimited but show usage stats
    const videoViews = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          eq(userActivity.action, 'view'),
          eq(userActivity.entityType, 'video'),
          gte(userActivity.createdAt, periodStart)
        )
      );

    const blogReads = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          eq(userActivity.action, 'view'),
          eq(userActivity.entityType, 'blog'),
          gte(userActivity.createdAt, periodStart)
        )
      );

    limits.push({
      feature: 'Videos',
      used: videoViews[0]?.count || 0,
      limit: null, // Unlimited
      approachingLimit: false,
      atLimit: false,
    });

    limits.push({
      feature: 'Premium Articles',
      used: blogReads[0]?.count || 0,
      limit: null, // Unlimited
      approachingLimit: false,
      atLimit: false,
    });
  }

  return limits;
}

/**
 * Get recent premium content accessed by user
 */
export async function getRecentPremiumContent(
  userId: number,
  limit: number = 5
): Promise<PremiumContentItem[]> {
  const activities = await db
    .select({
      entityId: userActivity.entityId,
      entityType: userActivity.entityType,
      createdAt: userActivity.createdAt,
    })
    .from(userActivity)
    .where(
      and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, 'view'),
        sql`${userActivity.entityType} IN ('video', 'blog', 'snippet')`
      )
    )
    .orderBy(desc(userActivity.createdAt))
    .limit(limit * 2); // Get extra to filter for premium

  const items: PremiumContentItem[] = [];

  for (const activity of activities) {
    if (!activity.entityId || items.length >= limit) break;

    if (activity.entityType === 'video') {
      const video = await db
        .select({ id: videos.id, title: videos.title, thumbnail: videos.thumbnail, isPremium: videos.isPremium })
        .from(videos)
        .where(eq(videos.id, activity.entityId))
        .limit(1);

      if (video[0]?.isPremium) {
        items.push({
          id: video[0].id,
          title: video[0].title,
          type: 'video',
          accessedAt: activity.createdAt,
          thumbnail: video[0].thumbnail,
        });
      }
    } else if (activity.entityType === 'blog') {
      const post = await db
        .select({ id: blogPosts.id, title: blogPosts.title, accessLevel: blogPosts.accessLevel })
        .from(blogPosts)
        .where(eq(blogPosts.id, activity.entityId))
        .limit(1);

      if (post[0]?.accessLevel === 'premium') {
        items.push({
          id: post[0].id,
          title: post[0].title,
          type: 'article',
          accessedAt: activity.createdAt,
        });
      }
    } else if (activity.entityType === 'snippet') {
      const snippet = await db
        .select({ id: snippets.id, title: snippets.title, accessLevel: snippets.accessLevel })
        .from(snippets)
        .where(eq(snippets.id, activity.entityId))
        .limit(1);

      if (snippet[0]?.accessLevel === 'premium') {
        items.push({
          id: snippet[0].id,
          title: snippet[0].title,
          type: 'snippet',
          accessedAt: activity.createdAt,
        });
      }
    }
  }

  return items;
}

/**
 * Format usage stats for display
 */
export function formatUsageStats(stats: PremiumUsageStats): {
  summary: string;
  details: string[];
} {
  const details: string[] = [];

  if (stats.premiumVideosWatched > 0) {
    details.push(`${stats.premiumVideosWatched} premium video${stats.premiumVideosWatched !== 1 ? 's' : ''} watched`);
  }

  if (stats.premiumArticlesRead > 0) {
    details.push(`${stats.premiumArticlesRead} premium article${stats.premiumArticlesRead !== 1 ? 's' : ''} read`);
  }

  if (stats.premiumSnippetsAccessed > 0) {
    details.push(`${stats.premiumSnippetsAccessed} premium snippet${stats.premiumSnippetsAccessed !== 1 ? 's' : ''} accessed`);
  }

  const summary = stats.totalPremiumInteractions > 0
    ? `${stats.totalPremiumInteractions} premium content interactions in the last 30 days`
    : 'No premium content accessed yet';

  return { summary, details };
}
