import { pgTable, serial, text, timestamp, boolean, integer, json, index, uuid } from 'drizzle-orm/pg-core';

// Users table - Extended user profiles linked to Supabase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').unique(),
  name: text('name'),
  avatar: text('avatar'),
  supabaseUserId: uuid('supabase_user_id').unique(), // Links to Supabase Auth user
  stripeCustomerId: text('stripe_customer_id').unique(), // Links to Stripe customer
  role: text('role').default('member'), // member, moderator, admin
  isActive: boolean('is_active').default(true),
  newsletterSubscribed: boolean('newsletter_subscribed').default(true),
  subscriptionTier: text('subscription_tier').default('free'), // free, premium, lifetime
  subscriptionStatus: text('subscription_status').default('active'), // active, canceled, expired
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_username_idx').on(table.username),
  index('users_supabase_user_id_idx').on(table.supabaseUserId),
  index('users_stripe_customer_id_idx').on(table.stripeCustomerId),
]);

// Video Playlists table - Organize videos into YouTube-like playlists
export const videoPlaylists = pgTable('video_playlists', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  authorId: integer('author_id').references(() => users.id),
  isPublic: boolean('is_public').default(true),
  isFeatured: boolean('is_featured').default(false),
  videoCount: integer('video_count').default(0),
  totalDuration: text('total_duration'), // YouTube duration format
  coverImage: text('cover_image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('video_playlists_slug_idx').on(table.slug),
  index('video_playlists_author_idx').on(table.authorId),
  index('video_playlists_is_public_idx').on(table.isPublic),
  index('video_playlists_is_featured_idx').on(table.isFeatured),
]);

// Playlist Videos table - Many-to-many relationship between playlists and videos
export const playlistVideos = pgTable('playlist_videos', {
  id: serial('id').primaryKey(),
  playlistId: integer('playlist_id').references(() => videoPlaylists.id, { onDelete: 'cascade' }),
  videoId: integer('video_id').references(() => videos.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(), // Order in playlist
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => [
  index('playlist_videos_playlist_video_idx').on(table.playlistId, table.videoId),
  index('playlist_videos_position_idx').on(table.playlistId, table.position),
]);

// Videos table - YouTube video catalog with playlist support
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  youtubeId: text('youtube_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  thumbnail: text('thumbnail'),
  duration: text('duration'), // YouTube duration format
  publishedAt: timestamp('published_at'),
  categoryId: integer('category_id').references(() => videoCategories.id),
  difficulty: text('difficulty').default('beginner'), // beginner, intermediate, advanced
  tags: text('tags').array(), // Array of tags
  viewCount: integer('view_count').default(0),
  isPremium: boolean('is_premium').default(false), // For paid content access
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('videos_youtube_id_idx').on(table.youtubeId),
  index('videos_category_idx').on(table.categoryId),
  index('videos_difficulty_idx').on(table.difficulty),
  index('videos_is_premium_idx').on(table.isPremium),
]);

// Video Categories table
export const videoCategories = pgTable('video_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('video_categories_slug_idx').on(table.slug),
]);

// Subscription Plans table - Define available subscription tiers
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  stripePriceId: text('stripe_price_id').notNull().unique(),
  amount: integer('amount').notNull(), // Amount in cents
  currency: text('currency').default('usd'),
  interval: text('interval').notNull(), // month, year, once
  features: json('features').$type<string[]>(), // Array of features
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('subscription_plans_slug_idx').on(table.slug),
  index('subscription_plans_stripe_price_id_idx').on(table.stripePriceId),
  index('subscription_plans_is_active_idx').on(table.isActive),
]);

// Subscriptions table - Manage user subscriptions and payments
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id').references(() => users.stripeCustomerId),
  status: text('status').default('active'), // active, canceled, past_due, trialing
  priceId: text('price_id'),
  productId: text('product_id'),
  currentPeriodEnd: timestamp('current_period_end'),
  trialEnd: timestamp('trial_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  metadata: json('metadata'), // Additional subscription data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('subscriptions_user_id_idx').on(table.userId),
  index('subscriptions_stripe_subscription_id_idx').on(table.stripeSubscriptionId),
  index('subscriptions_stripe_customer_id_idx').on(table.stripeCustomerId),
  index('subscriptions_status_idx').on(table.status),
]);

// Payments table - Track one-time payments and transactions
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  amount: integer('amount').notNull(), // Amount in cents
  currency: text('currency').default('usd'),
  status: text('status').default('pending'), // succeeded, failed, pending, canceled
  paymentMethod: text('payment_method'),
  description: text('description'),
  metadata: json('metadata'), // Additional payment data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('payments_user_id_idx').on(table.userId),
  index('payments_stripe_payment_intent_id_idx').on(table.stripePaymentIntentId),
  index('payments_status_idx').on(table.status),
]);

// Snippets table - Code snippets, commands, and configurations from videos
export const snippets = pgTable('snippets', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  language: text('language').notNull(), // javascript, typescript, python, etc.
  type: text('type').notNull(), // code, command, config
  description: text('description'),
  videoId: integer('video_id').references(() => videos.id),
  categoryId: integer('category_id').references(() => snippetCategories.id),
  authorId: integer('author_id').references(() => users.id),
  accessLevel: text('access_level').default('public'), // public, member, premium
  tags: text('tags').array(),
  likes: integer('likes').default(0),
  views: integer('views').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('snippets_video_idx').on(table.videoId),
  index('snippets_category_idx').on(table.categoryId),
  index('snippets_author_idx').on(table.authorId),
  index('snippets_access_level_idx').on(table.accessLevel),
  index('snippets_language_idx').on(table.language),
  index('snippets_type_idx').on(table.type),
]);

// Snippet Categories table
export const snippetCategories = pgTable('snippet_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('snippet_categories_slug_idx').on(table.slug),
]);

// Blog Posts table - Technical articles and video support content
export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  featuredImage: text('featured_image'),
  authorId: integer('author_id').references(() => users.id),
  categoryId: integer('category_id').references(() => blogCategories.id),
  videoId: integer('video_id').references(() => videos.id), // Related video if applicable
  accessLevel: text('access_level').default('public'), // public, member, premium
  tags: text('tags').array(),
  status: text('status').default('draft'), // draft, published, archived
  featured: boolean('featured').default(false),
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('blog_posts_slug_idx').on(table.slug),
  index('blog_posts_author_idx').on(table.authorId),
  index('blog_posts_category_idx').on(table.categoryId),
  index('blog_posts_access_level_idx').on(table.accessLevel),
  index('blog_posts_status_idx').on(table.status),
]);

// Blog Categories table
export const blogCategories = pgTable('blog_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  color: text('color'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('blog_categories_slug_idx').on(table.slug),
]);

// Forum Categories table
export const forumCategories = pgTable('forum_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  order: integer('order').default(0),
  accessLevel: text('access_level').default('public'), // public, member, premium
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('forum_categories_order_idx').on(table.order),
  index('forum_categories_access_level_idx').on(table.accessLevel),
]);

// Forum Posts table - Discussion threads in the community forum
export const forumPosts = pgTable('forum_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id),
  categoryId: integer('category_id').references(() => forumCategories.id),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  viewCount: integer('view_count').default(0),
  replyCount: integer('reply_count').default(0),
  lastReplyAt: timestamp('last_reply_at'),
  status: text('status').default('active'), // active, locked, archived
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('forum_posts_author_idx').on(table.authorId),
  index('forum_posts_category_idx').on(table.categoryId),
  index('forum_posts_status_idx').on(table.status),
  index('forum_posts_is_pinned_idx').on(table.isPinned),
]);

// Forum Replies table - Replies to forum posts with nesting support
export const forumReplies = pgTable('forum_replies', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  postId: integer('post_id').references(() => forumPosts.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').references(() => users.id),
  parentId: integer('parent_id'), // For nested replies - will be set up separately
  likes: integer('likes').default(0),
  isAnswer: boolean('is_answer').default(false), // Marked as best answer
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('forum_replies_post_idx').on(table.postId),
  index('forum_replies_author_idx').on(table.authorId),
  index('forum_replies_parent_idx').on(table.parentId),
]);

// Newsletter Subscriptions table
export const newsletterSubscriptions = pgTable('newsletter_subscriptions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  status: text('status').default('active'), // active, unsubscribed, bounced
  preferences: json('preferences'), // Subscription preferences JSON
  subscribedAt: timestamp('subscribed_at').defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('newsletter_subscriptions_email_idx').on(table.email),
  index('newsletter_subscriptions_user_id_idx').on(table.userId),
  index('newsletter_subscriptions_status_idx').on(table.status),
]);

// Lab Tools table - Interactive tools and utilities for members
export const labTools = pgTable('lab_tools', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull(), // calculator, generator, validator, converter
  config: json('config'), // Tool configuration JSON
  accessLevel: text('access_level').default('member'), // public, member, premium
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('lab_tools_slug_idx').on(table.slug),
  index('lab_tools_type_idx').on(table.type),
  index('lab_tools_access_level_idx').on(table.accessLevel),
]);

// User Activity table - Track user engagement and analytics
export const userActivity = pgTable('user_activity', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(), // login, post, comment, like, download
  entityType: text('entity_type'), // video, snippet, blog, forum
  entityId: integer('entity_id'),
  metadata: json('metadata'), // Additional data about the action
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('user_activity_user_id_idx').on(table.userId),
  index('user_activity_action_idx').on(table.action),
  index('user_activity_created_at_idx').on(table.createdAt),
]);

// Export all tables for easy import
export const schema = {
  users,
  videoPlaylists,
  playlistVideos,
  videos,
  videoCategories,
  subscriptionPlans,
  subscriptions,
  payments,
  snippets,
  snippetCategories,
  blogPosts,
  blogCategories,
  forumCategories,
  forumPosts,
  forumReplies,
  newsletterSubscriptions,
  labTools,
  userActivity,
};

// Export types for TypeScript inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type VideoPlaylist = typeof videoPlaylists.$inferSelect;
export type NewVideoPlaylist = typeof videoPlaylists.$inferInsert;

export type PlaylistVideo = typeof playlistVideos.$inferSelect;
export type NewPlaylistVideo = typeof playlistVideos.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

export type VideoCategory = typeof videoCategories.$inferSelect;
export type NewVideoCategory = typeof videoCategories.$inferInsert;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Snippet = typeof snippets.$inferSelect;
export type NewSnippet = typeof snippets.$inferInsert;

export type SnippetCategory = typeof snippetCategories.$inferSelect;
export type NewSnippetCategory = typeof snippetCategories.$inferInsert;

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

export type BlogCategory = typeof blogCategories.$inferSelect;
export type NewBlogCategory = typeof blogCategories.$inferInsert;

export type ForumCategory = typeof forumCategories.$inferSelect;
export type NewForumCategory = typeof forumCategories.$inferInsert;

export type ForumPost = typeof forumPosts.$inferSelect;
export type NewForumPost = typeof forumPosts.$inferInsert;

export type ForumReply = typeof forumReplies.$inferSelect;
export type NewForumReply = typeof forumReplies.$inferInsert;

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type NewNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert;

export type LabTool = typeof labTools.$inferSelect;
export type NewLabTool = typeof labTools.$inferInsert;

export type UserActivity = typeof userActivity.$inferSelect;
export type NewUserActivity = typeof userActivity.$inferInsert;
