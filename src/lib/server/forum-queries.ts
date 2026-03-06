import { and, asc, count, desc, eq, ne, sql } from 'drizzle-orm';
import { db, forumCategories, forumFollows, forumNotifications, forumPosts, forumReplies, forumReports, userActivity, users } from '../../db';
import { canAccessCategory, canModerate } from './forum-permissions';
import type { ForumCategorySummary, ForumMemberProfile, ForumThreadDetail, ForumThreadListItem, Viewer } from './forum-types';

export async function getViewerBySupabaseId(supabaseUserId?: string | null) {
  if (!supabaseUserId) {
    return null;
  }

  const [viewer] = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUserId))
    .limit(1);

  return viewer ?? null;
}

export async function getForumCategories(viewer: Viewer) {
  const categories = await db
    .select()
    .from(forumCategories)
    .where(eq(forumCategories.isActive, true))
    .orderBy(asc(forumCategories.order), asc(forumCategories.name));

  const visibleCategories = categories.filter((category) => canAccessCategory(category, viewer));

  const summaries = await Promise.all(
    visibleCategories.map(async (category) => {
      const [threadStats] = await db
        .select({ count: count() })
        .from(forumPosts)
        .where(and(eq(forumPosts.categoryId, category.id), ne(forumPosts.status, 'archived')));

      const [replyStats] = await db
        .select({ count: count() })
        .from(forumReplies)
        .leftJoin(forumPosts, eq(forumReplies.postId, forumPosts.id))
        .where(and(eq(forumPosts.categoryId, category.id), ne(forumPosts.status, 'archived')));

      return {
        ...category,
        threadCount: threadStats?.count ?? 0,
        replyCount: replyStats?.count ?? 0,
      } satisfies ForumCategorySummary;
    })
  );

  return summaries;
}

export async function getForumThreads(options: { viewer: Viewer; categoryId?: number | null; includePending?: boolean; limit?: number }) {
  const rows = await db
    .select({
      post: forumPosts,
      category: {
        id: forumCategories.id,
        name: forumCategories.name,
        description: forumCategories.description,
        color: forumCategories.color,
        accessLevel: forumCategories.accessLevel,
      },
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        role: users.role,
      },
    })
    .from(forumPosts)
    .leftJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .leftJoin(users, eq(forumPosts.authorId, users.id))
    .where(
      and(
        options.categoryId ? eq(forumPosts.categoryId, options.categoryId) : undefined,
        options.includePending || canModerate(options.viewer)
          ? ne(forumPosts.status, 'archived')
          : eq(forumPosts.status, 'active')
      )
    )
    .orderBy(desc(forumPosts.isPinned), desc(sql`coalesce(${forumPosts.lastReplyAt}, ${forumPosts.createdAt})`), desc(forumPosts.createdAt))
    .limit(options.limit ?? 50);

  return rows
    .filter((row) => row.category && canAccessCategory(row.category, options.viewer))
    .map((row) => ({
      ...row.post,
      author: row.author,
      category: row.category,
    })) satisfies ForumThreadListItem[];
}

export async function getForumThreadById(id: number, viewer: Viewer, options: { incrementView?: boolean } = {}) {
  const [threadRow] = await db
    .select({
      post: forumPosts,
      category: {
        id: forumCategories.id,
        name: forumCategories.name,
        description: forumCategories.description,
        color: forumCategories.color,
        accessLevel: forumCategories.accessLevel,
      },
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        role: users.role,
      },
    })
    .from(forumPosts)
    .leftJoin(forumCategories, eq(forumPosts.categoryId, forumCategories.id))
    .leftJoin(users, eq(forumPosts.authorId, users.id))
    .where(eq(forumPosts.id, id))
    .limit(1);

  if (!threadRow?.category || !canAccessCategory(threadRow.category, viewer)) {
    return null;
  }

  if (!canModerate(viewer) && threadRow.post.status !== 'active') {
    return null;
  }

  if (options.incrementView !== false) {
    await db
      .update(forumPosts)
      .set({ viewCount: sql`${forumPosts.viewCount} + 1` })
      .where(eq(forumPosts.id, id));
  }

  const replyRows = await db
    .select({
      reply: forumReplies,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        role: users.role,
      },
    })
    .from(forumReplies)
    .leftJoin(users, eq(forumReplies.authorId, users.id))
    .where(eq(forumReplies.postId, id))
    .orderBy(asc(forumReplies.createdAt));

  return {
    ...threadRow.post,
    viewCount: options.incrementView === false ? threadRow.post.viewCount ?? 0 : (threadRow.post.viewCount ?? 0) + 1,
    author: threadRow.author,
    category: threadRow.category,
    replies: replyRows.map((row) => ({
      ...row.reply,
      author: row.author,
    })),
  } satisfies ForumThreadDetail;
}

export async function getForumNotifications(recipientId: number) {
  return db
    .select({
      notification: forumNotifications,
      actor: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        role: users.role,
      },
    })
    .from(forumNotifications)
    .leftJoin(users, eq(forumNotifications.actorId, users.id))
    .where(eq(forumNotifications.recipientId, recipientId))
    .orderBy(desc(forumNotifications.createdAt))
    .limit(50);
}

export async function getForumActivityFeed(limit = 20) {
  return db
    .select({
      activity: userActivity,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        role: users.role,
      },
    })
    .from(userActivity)
    .leftJoin(users, eq(userActivity.userId, users.id))
    .where(eq(userActivity.entityType, 'forum'))
    .orderBy(desc(userActivity.createdAt))
    .limit(limit);
}

export async function getForumMemberProfile(username: string, viewer: Viewer) {
  const [member] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatar: users.avatar,
      role: users.role,
      subscriptionTier: users.subscriptionTier,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!member) {
    return null;
  }

  const [[threadCount], [replyCount], [answerCount], [followerCount], [followingCount], activityRows] = await Promise.all([
    db.select({ count: count() }).from(forumPosts).where(and(eq(forumPosts.authorId, member.id), ne(forumPosts.status, 'archived'))),
    db.select({ count: count() }).from(forumReplies).where(eq(forumReplies.authorId, member.id)),
    db.select({ count: count() }).from(forumReplies).where(and(eq(forumReplies.authorId, member.id), eq(forumReplies.isAnswer, true))),
    db.select({ count: count() }).from(forumFollows).where(eq(forumFollows.followingId, member.id)),
    db.select({ count: count() }).from(forumFollows).where(eq(forumFollows.followerId, member.id)),
    db
      .select({
        id: userActivity.id,
        action: userActivity.action,
        entityId: userActivity.entityId,
        createdAt: userActivity.createdAt,
        metadata: userActivity.metadata,
      })
      .from(userActivity)
      .where(and(eq(userActivity.userId, member.id), eq(userActivity.entityType, 'forum')))
      .orderBy(desc(userActivity.createdAt))
      .limit(10),
  ]);

  const isFollowing = viewer
    ? !!(await db
        .select({ id: forumFollows.id })
        .from(forumFollows)
        .where(and(eq(forumFollows.followerId, viewer.id), eq(forumFollows.followingId, member.id)))
        .limit(1))[0]
    : false;

  return {
    ...member,
    threadCount: threadCount?.count ?? 0,
    replyCount: replyCount?.count ?? 0,
    answerCount: answerCount?.count ?? 0,
    followerCount: followerCount?.count ?? 0,
    followingCount: followingCount?.count ?? 0,
    reputation: (threadCount?.count ?? 0) * 10 + (replyCount?.count ?? 0) * 5 + (answerCount?.count ?? 0) * 20,
    recentActivity: activityRows.map((row) => ({
      ...row,
      threadId: typeof row.metadata === 'object' && row.metadata && 'postId' in row.metadata && typeof row.metadata.postId === 'number'
        ? row.metadata.postId
        : row.entityId,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    })),
    isFollowing,
  } satisfies ForumMemberProfile;
}

export async function getModerationSnapshot() {
  const [reports, pendingThreads, usersToReview] = await Promise.all([
    db
      .select({
        report: forumReports,
        reporter: {
          id: users.id,
          name: users.name,
          username: users.username,
          role: users.role,
        },
      })
      .from(forumReports)
      .leftJoin(users, eq(forumReports.reporterId, users.id))
      .where(eq(forumReports.status, 'open'))
      .orderBy(desc(forumReports.createdAt))
      .limit(25),
    db
      .select({
        post: forumPosts,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          role: users.role,
        },
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .where(eq(forumPosts.status, 'pending'))
      .orderBy(desc(forumPosts.createdAt))
      .limit(25),
    db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(25),
  ]);

  return {
    reports,
    pendingThreads,
    users: usersToReview,
  };
}

export async function getUnreadNotificationCount(recipientId: number) {
  const [result] = await db
    .select({ count: count() })
    .from(forumNotifications)
    .where(and(eq(forumNotifications.recipientId, recipientId), eq(forumNotifications.isRead, false)));

  return result?.count ?? 0;
}
