/**
 * Dashboard Server Functions
 * Aggregates user-specific data for the personalized member dashboard
 */

import { db, userActivity, forumPosts, forumReplies, videos } from '../../db';
import { eq, desc, and, sql } from 'drizzle-orm';

export interface UserStats {
  forumPosts: number;
  forumReplies: number;
  blogComments: number;
  videoViews: number;
}

export interface ForumActivityItem {
  id: number;
  title: string;
  postId: number;
  createdAt: Date | null;
  replyCount: number;
  type: 'post' | 'reply';
}

export interface RecentActivity {
  id: number;
  action: string;
  entityType: string | null;
  entityId: number | null;
  createdAt: Date | null;
  metadata: any;
}

export interface RecentVideo {
  id: number;
  youtubeId: string;
  title: string;
  thumbnail: string | null;
  duration: string | null;
  viewedAt: Date | null;
}

/**
 * Get user statistics for dashboard overview
 */
export async function getUserStats(userId: number): Promise<UserStats> {
  // Get forum posts count
  const forumPostsResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(forumPosts)
    .where(eq(forumPosts.authorId, userId));
  
  // Get forum replies count
  const forumRepliesResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(forumReplies)
    .where(eq(forumReplies.authorId, userId));

  // Get blog comments count from user_activity
  const blogCommentsResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userActivity)
    .where(
      and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, 'comment'),
        eq(userActivity.entityType, 'blog')
      )
    );

  // Get video views count from user_activity
  const videoViewsResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userActivity)
    .where(
      and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, 'view'),
        eq(userActivity.entityType, 'video')
      )
    );

  return {
    forumPosts: forumPostsResult[0]?.count || 0,
    forumReplies: forumRepliesResult[0]?.count || 0,
    blogComments: blogCommentsResult[0]?.count || 0,
    videoViews: videoViewsResult[0]?.count || 0,
  };
}

/**
 * Get user's recent forum activity (posts and replies)
 */
export async function getUserForumActivity(userId: number, limit: number = 5): Promise<ForumActivityItem[]> {
  // Get recent posts
  const posts = await db
    .select({
      id: forumPosts.id,
      title: forumPosts.title,
      createdAt: forumPosts.createdAt,
      replyCount: forumPosts.replyCount,
    })
    .from(forumPosts)
    .where(eq(forumPosts.authorId, userId))
    .orderBy(desc(forumPosts.createdAt))
    .limit(limit);

  // Get recent replies with post info
  const replies = await db
    .select({
      id: forumReplies.id,
      postId: forumReplies.postId,
      createdAt: forumReplies.createdAt,
      postTitle: forumPosts.title,
      postIdRef: forumPosts.id,
    })
    .from(forumReplies)
    .innerJoin(forumPosts, eq(forumReplies.postId, forumPosts.id))
    .where(eq(forumReplies.authorId, userId))
    .orderBy(desc(forumReplies.createdAt))
    .limit(limit);

  // Combine and format
  const activity: ForumActivityItem[] = [
    ...posts.map((p) => ({
      id: p.id,
      title: p.title,
      postId: p.id,
      createdAt: p.createdAt,
      replyCount: p.replyCount || 0,
      type: 'post' as const,
    })),
    ...replies.map((r) => ({
      id: r.id,
      title: `Reply to: ${r.postTitle}`,
      postId: r.postIdRef,
      createdAt: r.createdAt,
      replyCount: 0,
      type: 'reply' as const,
    })),
  ];

  // Sort by date and limit
  return activity
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);
}

/**
 * Get user's recent activity timeline
 */
export async function getUserRecentActivity(userId: number, limit: number = 10): Promise<RecentActivity[]> {
  const activities = await db
    .select({
      id: userActivity.id,
      action: userActivity.action,
      entityType: userActivity.entityType,
      entityId: userActivity.entityId,
      createdAt: userActivity.createdAt,
      metadata: userActivity.metadata,
    })
    .from(userActivity)
    .where(eq(userActivity.userId, userId))
    .orderBy(desc(userActivity.createdAt))
    .limit(limit);

  return activities;
}

/**
 * Get user's recently viewed videos
 */
export async function getUserRecentVideos(userId: number, limit: number = 6): Promise<RecentVideo[]> {
  // Get video view activities
  const viewActivities = await db
    .select({
      entityId: userActivity.entityId,
      createdAt: userActivity.createdAt,
    })
    .from(userActivity)
    .where(
      and(
        eq(userActivity.userId, userId),
        eq(userActivity.action, 'view'),
        eq(userActivity.entityType, 'video')
      )
    )
    .orderBy(desc(userActivity.createdAt))
    .limit(limit);

  if (viewActivities.length === 0) {
    return [];
  }

  // Get video details
  const videoIds = viewActivities.map((v) => v.entityId).filter((id): id is number => id !== null);
  
  if (videoIds.length === 0) {
    return [];
  }

  const videoDetails = await db
    .select({
      id: videos.id,
      youtubeId: videos.youtubeId,
      title: videos.title,
      thumbnail: videos.thumbnail,
      duration: videos.duration,
    })
    .from(videos)
    .where(sql`${videos.id} = ANY(${videoIds})`);

  // Map activities to videos with viewed date
  return viewActivities
    .map((activity) => {
      const video = videoDetails.find((v) => v.id === activity.entityId);
      if (!video) return null;
      return {
        ...video,
        viewedAt: activity.createdAt,
      };
    })
    .filter((v): v is RecentVideo => v !== null);
}

/**
 * Get aggregated dashboard data for a user
 */
export async function getUserDashboardData(userId: number) {
  const [stats, forumActivity, recentActivity, recentVideos] = await Promise.all([
    getUserStats(userId),
    getUserForumActivity(userId, 5),
    getUserRecentActivity(userId, 10),
    getUserRecentVideos(userId, 6),
  ]);

  return {
    stats,
    forumActivity,
    recentActivity,
    recentVideos,
  };
}
