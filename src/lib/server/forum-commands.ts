import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, forumCategories, forumFollows, forumNotifications, forumPosts, forumReplies, forumReports, users } from '../../db';
import { createForumNotification, logForumActivity } from './forum-side-effects';

const AUTO_APPROVE = import.meta.env.MODERATION_AUTO_APPROVE !== 'false';

export async function createForumCategory(input: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  accessLevel?: string;
  order?: number;
}) {
  const [category] = await db
    .insert(forumCategories)
    .values({
      name: input.name,
      description: input.description || null,
      color: input.color || null,
      icon: input.icon || null,
      accessLevel: input.accessLevel || 'public',
      order: input.order ?? 0,
    })
    .returning();

  return category;
}

export async function createForumThread(input: {
  title: string;
  content: string;
  categoryId: number;
  authorId: number;
}) {
  const [thread] = await db
    .insert(forumPosts)
    .values({
      title: input.title,
      content: input.content,
      categoryId: input.categoryId,
      authorId: input.authorId,
      status: AUTO_APPROVE ? 'active' : 'pending',
      lastReplyAt: new Date(),
    })
    .returning();

  await logForumActivity(input.authorId, 'forum_thread_created', thread.id, {
    title: thread.title,
    categoryId: input.categoryId,
  });

  return thread;
}

export async function createForumReply(input: {
  postId: number;
  content: string;
  authorId: number;
  parentId?: number | null;
}) {
  const [thread] = await db
    .select()
    .from(forumPosts)
    .where(eq(forumPosts.id, input.postId))
    .limit(1);

  if (!thread || thread.isLocked || thread.status !== 'active') {
    throw new Error('This thread is not available for replies.');
  }

  const [reply] = await db
    .insert(forumReplies)
    .values({
      postId: input.postId,
      content: input.content,
      authorId: input.authorId,
      parentId: input.parentId ?? null,
    })
    .returning();

  await db
    .update(forumPosts)
    .set({
      replyCount: sql`${forumPosts.replyCount} + 1`,
      lastReplyAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(forumPosts.id, input.postId));

  await logForumActivity(input.authorId, 'forum_reply_created', reply.id, {
    postId: input.postId,
  });

  if (thread.authorId && thread.authorId !== input.authorId) {
    await createForumNotification({
      recipientId: thread.authorId,
      actorId: input.authorId,
      postId: input.postId,
      replyId: reply.id,
      type: 'reply',
      title: 'New reply to your thread',
      message: 'Someone replied to a discussion you started.',
    });
  }

  if (input.parentId) {
    const [parentReply] = await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.id, input.parentId))
      .limit(1);

    if (parentReply?.authorId && parentReply.authorId !== input.authorId && parentReply.authorId !== thread.authorId) {
      await createForumNotification({
        recipientId: parentReply.authorId,
        actorId: input.authorId,
        postId: input.postId,
        replyId: reply.id,
        type: 'mention',
        title: 'New reply in a conversation',
        message: 'Someone replied in a thread you participated in.',
      });
    }
  }

  return reply;
}

export async function toggleForumFollow(input: { followerId: number; followingId: number }) {
  if (input.followerId === input.followingId) {
    throw new Error('You cannot follow yourself.');
  }

  const [existing] = await db
    .select()
    .from(forumFollows)
    .where(and(eq(forumFollows.followerId, input.followerId), eq(forumFollows.followingId, input.followingId)))
    .limit(1);

  if (existing) {
    await db.delete(forumFollows).where(eq(forumFollows.id, existing.id));
    return false;
  }

  await db.insert(forumFollows).values(input);

  await createForumNotification({
    recipientId: input.followingId,
    actorId: input.followerId,
    type: 'follow',
    title: 'New follower',
    message: 'Someone started following your forum activity.',
  });

  return true;
}

export async function markBestAnswer(input: { postId: number; replyId: number; actorId: number }) {
  await db.update(forumReplies).set({ isAnswer: false }).where(eq(forumReplies.postId, input.postId));
  await db.update(forumReplies).set({ isAnswer: true }).where(eq(forumReplies.id, input.replyId));

  const [reply] = await db
    .select()
    .from(forumReplies)
    .where(eq(forumReplies.id, input.replyId))
    .limit(1);

  if (reply?.authorId && reply.authorId !== input.actorId) {
    await createForumNotification({
      recipientId: reply.authorId,
      actorId: input.actorId,
      postId: input.postId,
      replyId: input.replyId,
      type: 'best_answer',
      title: 'Your reply was marked as the best answer',
      message: 'A discussion author marked your reply as the best answer.',
    });
  }
}

export async function updateThreadState(input: { postId: number; isPinned?: boolean; isLocked?: boolean; status?: string }) {
  const [thread] = await db
    .select()
    .from(forumPosts)
    .where(eq(forumPosts.id, input.postId))
    .limit(1);

  if (!thread) {
    throw new Error('Thread not found.');
  }

  await db
    .update(forumPosts)
    .set({
      isPinned: input.isPinned ?? thread.isPinned,
      isLocked: input.isLocked ?? thread.isLocked,
      status: input.status ?? thread.status,
      updatedAt: new Date(),
    })
    .where(eq(forumPosts.id, input.postId));
}

export async function createForumReport(input: {
  reporterId: number;
  postId?: number | null;
  replyId?: number | null;
  reason: string;
  details?: string;
}) {
  const [report] = await db
    .insert(forumReports)
    .values({
      reporterId: input.reporterId,
      postId: input.postId ?? null,
      replyId: input.replyId ?? null,
      reason: input.reason,
      details: input.details || null,
    })
    .returning();

  return report;
}

export async function markNotificationsAsRead(recipientId: number, notificationIds?: number[]) {
  await db
    .update(forumNotifications)
    .set({ isRead: true })
    .where(
      and(
        eq(forumNotifications.recipientId, recipientId),
        notificationIds?.length ? inArray(forumNotifications.id, notificationIds) : undefined
      )
    );
}

export async function reviewReport(input: { reportId: number; reviewerId: number; status: string }) {
  await db
    .update(forumReports)
    .set({
      status: input.status,
      reviewedBy: input.reviewerId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(forumReports.id, input.reportId));
}

export async function updateUserModerationState(input: { userId: number; isActive: boolean }) {
  const [member] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);

  if (!member) {
    throw new Error('User not found.');
  }

  await db.update(users).set({ isActive: input.isActive, updatedAt: new Date() }).where(eq(users.id, input.userId));
}

// Re-export notification preference functions from forum-side-effects
export { getNotificationPreferences, getOrCreateNotificationPreferences, updateNotificationPreferences } from './forum-side-effects';
