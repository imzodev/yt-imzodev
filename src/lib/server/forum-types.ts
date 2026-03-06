import type { ForumCategory, ForumPost, ForumReply, User } from '../../db/schema';

export type Viewer = User | null;

export type ForumCategorySummary = ForumCategory & {
  threadCount: number;
  replyCount: number;
};

export type ForumThreadListItem = ForumPost & {
  author: Pick<User, 'id' | 'name' | 'username' | 'avatar' | 'role'> | null;
  category: Pick<ForumCategory, 'id' | 'name' | 'description' | 'color' | 'accessLevel'> | null;
};

export type ForumReplyItem = ForumReply & {
  author: Pick<User, 'id' | 'name' | 'username' | 'avatar' | 'role'> | null;
};

export type ForumThreadDetail = ForumThreadListItem & {
  replies: ForumReplyItem[];
};

export type ForumMemberProfile = Pick<User, 'id' | 'name' | 'username' | 'avatar' | 'role' | 'subscriptionTier' | 'isActive' | 'createdAt'> & {
  threadCount: number;
  replyCount: number;
  answerCount: number;
  followerCount: number;
  followingCount: number;
  reputation: number;
  isFollowing: boolean;
  recentActivity: Array<{
    id: number;
    action: string;
    entityId: number | null;
    threadId: number | null;
    createdAt: Date | null;
    metadata: Record<string, unknown> | null;
  }>;
};
