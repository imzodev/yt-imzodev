import { eq } from 'drizzle-orm';
import { db, forumNotifications, notificationPreferences, userActivity } from '../../db';
import type { NotificationPreference } from '../../db/schema';

// Default preferences for users who don't have a row yet
const DEFAULT_PREFERENCES: Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  replyNotifications: true,
  followNotifications: true,
  bestAnswerNotifications: true,
  reportNotifications: true,
};

export async function logForumActivity(userId: number, action: string, entityId?: number, metadata?: Record<string, unknown>) {
  await db.insert(userActivity).values({
    userId,
    action,
    entityType: 'forum',
    entityId,
    metadata,
  });
}

export async function getNotificationPreferences(userId: number): Promise<NotificationPreference | null> {
  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getOrCreateNotificationPreferences(userId: number): Promise<NotificationPreference> {
  const existing = await getNotificationPreferences(userId);
  if (existing) return existing;

  // Create default preferences for user
  const [created] = await db
    .insert(notificationPreferences)
    .values({ userId })
    .returning();
  return created;
}

export async function updateNotificationPreferences(
  userId: number,
  preferences: Partial<Pick<NotificationPreference, 'replyNotifications' | 'followNotifications' | 'bestAnswerNotifications' | 'reportNotifications'>>
): Promise<NotificationPreference | null> {
  // Ensure user has preferences row
  await getOrCreateNotificationPreferences(userId);

  const [updated] = await db
    .update(notificationPreferences)
    .set({
      ...preferences,
      updatedAt: new Date(),
    })
    .where(eq(notificationPreferences.userId, userId))
    .returning();

  return updated ?? null;
}

// Maps notification type to preference field
function getPreferenceField(type: string): keyof Pick<NotificationPreference, 'replyNotifications' | 'followNotifications' | 'bestAnswerNotifications' | 'reportNotifications'> | null {
  switch (type) {
    case 'reply':
    case 'thread_reply':
      return 'replyNotifications';
    case 'follow':
    case 'new_follower':
      return 'followNotifications';
    case 'best_answer':
    case 'marked_as_answer':
      return 'bestAnswerNotifications';
    case 'report':
    case 'new_report':
    case 'report_reviewed':
      return 'reportNotifications';
    default:
      return null;
  }
}

export async function createForumNotification(input: {
  recipientId: number;
  actorId?: number | null;
  postId?: number | null;
  replyId?: number | null;
  type: string;
  title: string;
  message: string;
}): Promise<boolean> {
  // Check if user wants this type of notification
  const preferences = await getNotificationPreferences(input.recipientId);
  const prefs = preferences ?? DEFAULT_PREFERENCES;

  const preferenceField = getPreferenceField(input.type);
  if (preferenceField && !prefs[preferenceField]) {
    // User has disabled this notification type
    return false;
  }

  await db.insert(forumNotifications).values({
    recipientId: input.recipientId,
    actorId: input.actorId ?? null,
    postId: input.postId ?? null,
    replyId: input.replyId ?? null,
    type: input.type,
    title: input.title,
    message: input.message,
  });

  return true;
}

export async function markForumNotificationRead(notificationId: number) {
  await db.update(forumNotifications).set({ isRead: true }).where(eq(forumNotifications.id, notificationId));
}
