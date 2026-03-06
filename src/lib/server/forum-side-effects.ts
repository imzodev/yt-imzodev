import { eq } from 'drizzle-orm';
import { db, forumNotifications, userActivity } from '../../db';

export async function logForumActivity(userId: number, action: string, entityId?: number, metadata?: Record<string, unknown>) {
  await db.insert(userActivity).values({
    userId,
    action,
    entityType: 'forum',
    entityId,
    metadata,
  });
}

export async function createForumNotification(input: {
  recipientId: number;
  actorId?: number | null;
  postId?: number | null;
  replyId?: number | null;
  type: string;
  title: string;
  message: string;
}) {
  await db.insert(forumNotifications).values({
    recipientId: input.recipientId,
    actorId: input.actorId ?? null,
    postId: input.postId ?? null,
    replyId: input.replyId ?? null,
    type: input.type,
    title: input.title,
    message: input.message,
  });
}

export async function markForumNotificationRead(notificationId: number) {
  await db.update(forumNotifications).set({ isRead: true }).where(eq(forumNotifications.id, notificationId));
}
