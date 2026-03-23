import {
  canAccessCategory,
  canModerate,
  createForumReport,
  createForumReply,
  createForumThread,
  getForumCategories,
  getForumMemberProfile,
  getForumThreadById,
  getNotificationPreferences,
  markBestAnswer,
  markNotificationsAsRead,
  reviewReport,
  toggleForumFollow,
  updateNotificationPreferences,
  updateThreadState,
  updateUserModerationState,
} from './forum';
import type { Viewer } from './forum-types';

function withFeedback(pathname: string, params: { type: 'success' | 'error'; message: string }) {
  const redirectUrl = new URL(pathname, 'http://localhost');
  redirectUrl.searchParams.set('type', params.type);
  redirectUrl.searchParams.set('message', params.message);
  return `${redirectUrl.pathname}${redirectUrl.search}`;
}

export async function handleForumIndexAction(input: {
  formData: FormData;
  viewer: Viewer;
  requestUrl: URL;
  origin: string;
}) {
  const intent = String(input.formData.get('intent') || '');

  if (intent === 'create-thread') {
    if (!input.viewer || input.viewer.isActive === false) {
      return '/login';
    }

    const categoryId = Number(input.formData.get('category_id'));
    const title = String(input.formData.get('title') || '').trim();
    const content = String(input.formData.get('content') || '').trim();

    if (!categoryId || !title || !content) {
      throw new Error('A category, title, and message are required to start a discussion.');
    }

    const categories = await getForumCategories(input.viewer);
    const category = categories.find((item) => item.id === categoryId);

    if (!category || !canAccessCategory(category, input.viewer)) {
      throw new Error('You do not have access to the selected category.');
    }

    const thread = await createForumThread({
      title,
      content,
      categoryId,
      authorId: input.viewer.id,
    });

    return withFeedback(`/forum/thread/${thread.id}`, {
      type: 'success',
      message: thread.status === 'pending' ? 'Your thread was submitted for review.' : 'Your discussion is live.',
    });
  }

  return null;
}

export async function handleForumThreadAction(input: {
  formData: FormData;
  threadId: number;
  viewer: Viewer;
  requestUrl: URL;
}) {
  const intent = String(input.formData.get('intent') || '');

  if (intent === 'reply') {
    if (!input.viewer || input.viewer.isActive === false) {
      return '/login';
    }

    const content = String(input.formData.get('content') || '').trim();
    const parentId = Number(input.formData.get('parent_id')) || null;

    if (!content) {
      throw new Error('Reply content is required.');
    }

    await createForumReply({
      postId: input.threadId,
      content,
      authorId: input.viewer.id,
      parentId,
    });

    return withFeedback(input.requestUrl.pathname, {
      type: 'success',
      message: 'Reply posted successfully.',
    });
  }

  if (intent === 'report') {
    if (!input.viewer || input.viewer.isActive === false) {
      return '/login';
    }

    const reason = String(input.formData.get('reason') || '').trim();
    const details = String(input.formData.get('details') || '').trim();
    const replyId = Number(input.formData.get('reply_id')) || null;

    if (!reason) {
      throw new Error('A report reason is required.');
    }

    await createForumReport({
      reporterId: input.viewer.id,
      postId: replyId ? null : input.threadId,
      replyId,
      reason,
      details,
    });

    return withFeedback(input.requestUrl.pathname, {
      type: 'success',
      message: 'Report submitted for moderator review.',
    });
  }

  if (intent === 'thread-state' || intent === 'best-answer') {
    if (!input.viewer || input.viewer.isActive === false) {
      return '/login';
    }

    const thread = await getForumThreadById(input.threadId, input.viewer, { incrementView: false });
    if (!thread) {
      throw new Error('Thread not found.');
    }

    const isOwner = thread.authorId === input.viewer.id;
    if (!isOwner && !canModerate(input.viewer)) {
      throw new Error('You do not have permission to manage this thread.');
    }

    if (intent === 'best-answer') {
      const replyId = Number(input.formData.get('reply_id'));
      if (!replyId) {
        throw new Error('Reply not found.');
      }

      await markBestAnswer({
        postId: input.threadId,
        replyId,
        actorId: input.viewer.id,
      });
    } else {
      const state = String(input.formData.get('state') || '');

      if (state === 'toggle-lock') {
        await updateThreadState({
          postId: input.threadId,
          isLocked: !thread.isLocked,
        });
      }

      if (state === 'toggle-pin') {
        await updateThreadState({
          postId: input.threadId,
          isPinned: !thread.isPinned,
        });
      }

      if (state === 'approve' && canModerate(input.viewer)) {
        await updateThreadState({
          postId: input.threadId,
          status: 'active',
        });
      }
    }

    return withFeedback(input.requestUrl.pathname, {
      type: 'success',
      message: 'Thread updated successfully.',
    });
  }

  return null;
}

export async function handleForumMemberAction(input: {
  formData: FormData;
  username: string;
  viewer: Viewer;
  requestUrl: URL;
}) {
  if (!input.viewer || input.viewer.isActive === false) {
    return '/login';
  }

  const profile = await getForumMemberProfile(input.username, input.viewer);
  if (!profile) {
    throw new Error('Member not found.');
  }

  await toggleForumFollow({
    followerId: input.viewer.id,
    followingId: profile.id,
  });

  return withFeedback(input.requestUrl.pathname, {
    type: 'success',
    message: profile.isFollowing ? 'You are no longer following this member.' : 'You are now following this member.',
  });
}

export async function handleForumModerationAction(input: {
  formData: FormData;
  viewerId: number;
  requestUrl: URL;
}) {
  const intent = String(input.formData.get('intent') || '');

  if (intent === 'review-report') {
    const reportId = Number(input.formData.get('report_id'));
    const status = String(input.formData.get('status') || 'resolved');
    if (!reportId) {
      throw new Error('Report not found.');
    }
    await reviewReport({ reportId, reviewerId: input.viewerId, status });
  }

  if (intent === 'thread-state') {
    const postId = Number(input.formData.get('post_id'));
    const status = String(input.formData.get('status') || 'active');
    if (!postId) {
      throw new Error('Thread not found.');
    }
    await updateThreadState({ postId, status });
  }

  if (intent === 'user-state') {
    const userId = Number(input.formData.get('user_id'));
    const isActive = String(input.formData.get('is_active') || 'true') === 'true';
    if (!userId) {
      throw new Error('User not found.');
    }
    await updateUserModerationState({ userId, isActive });
  }

  return withFeedback(input.requestUrl.pathname, {
    type: 'success',
    message: 'Moderation changes saved.',
  });
}

export async function handleForumNotificationsAction(input: {
  formData: FormData;
  viewerId: number;
  requestUrl: URL;
}) {
  const intent = String(input.formData.get('intent') || '');

  // Handle preference updates
  if (intent === 'update-preferences') {
    const replyNotifications = input.formData.get('reply_notifications') === 'on';
    const followNotifications = input.formData.get('follow_notifications') === 'on';
    const bestAnswerNotifications = input.formData.get('best_answer_notifications') === 'on';
    const reportNotifications = input.formData.get('report_notifications') === 'on';

    await updateNotificationPreferences(input.viewerId, {
      replyNotifications,
      followNotifications,
      bestAnswerNotifications,
      reportNotifications,
    });

    return withFeedback(input.requestUrl.pathname, {
      type: 'success',
      message: 'Notification preferences updated.',
    });
  }

  // Handle marking notifications as read
  const rawIds = input.formData.getAll('notification_id').map((value) => Number(value)).filter(Boolean);
  await markNotificationsAsRead(input.viewerId, rawIds.length > 0 ? rawIds : undefined);

  return withFeedback(input.requestUrl.pathname, {
    type: 'success',
    message: rawIds.length > 0 ? 'Selected notifications marked as read.' : 'All notifications marked as read.',
  });
}
