# Phase 4: Community Features

## 🎯 Overview

Community discussion system for the YouTube Community Portal, focused on a DaisyUI-based forum experience with server-rendered threads, replies, moderation tools, member profiles, following, activity feeds, and simple in-app notifications.

## ✅ Status: 75% Complete (Core Scope Implemented)

---

## 📋 Key Features

### 💬 Forum System

- **Forum Categories** - Implemented with access levels and category filtering
- **Discussion Threads** - Implemented with list and detail views
- **Reply System** - Implemented with server-rendered discussion replies
- **Best Answer** - Implemented for thread owners and moderators
- **Thread Pinning** - Implemented for moderation workflows
- **Thread Locking** - Implemented for discussion control

### 👥 User Interaction

- **User Profiles** - Implemented with contribution and activity summary
- **Reputation System** - Implemented as a derived Phase 4 score
- **User Following** - Implemented with simple follow/unfollow actions
- **Activity Feed** - Implemented with recent forum actions
- **Notifications** - Implemented as simple in-app notifications without realtime
- **Private Messages** - Deferred for later

### 🔒 Moderation Tools

- **Moderator Dashboard** - Implemented moderator workspace
- **Content Reporting** - Implemented user reporting system
- **Content Approval** - Implemented pending thread approval flow
- **User Management** - Implemented basic suspend/restore controls
- **Content Filtering** - Deferred for later

### ⏸️ Deferred Features

- **Private Messages** - Not part of the current Phase 4 slice
- **Content Filtering** - No automated filtering in this iteration
- **Real-time Updates** - No websockets or live subscriptions in this iteration

---

## 🛠️ Technical Implementation

### Database Operations

```typescript
// Implemented forum services
getForumCategories();
getForumThreads({ viewer, categoryId, includePending, limit });
getForumThreadById(id, viewer, options);
getForumMemberProfile(username, viewer);
createForumThread(threadData);
createForumReply(replyData);
createForumReport(reportData);
toggleForumFollow(followData);
markBestAnswer(actionData);
updateThreadState(actionData);
getForumNotifications(recipientId);
getModerationSnapshot();
```

### Server Architecture

- `src/lib/server/forum.ts` is now a thin facade over focused modules.
- `src/lib/server/forum-types.ts` contains shared forum types.
- `src/lib/server/forum-permissions.ts` contains authorization and access rules.
- `src/lib/server/forum-queries.ts` contains forum read/query operations.
- `src/lib/server/forum-commands.ts` contains forum mutation flows.
- `src/lib/server/forum-side-effects.ts` contains activity logging and notification side effects.
- `src/lib/server/forum-actions.ts` contains route-facing action handlers used by the Astro pages.

This refactor keeps the current implementation server-rendered while improving SRP and making the forum domain easier to extend.

### Routes

```typescript
pages / forum / index.astro;
pages / forum / thread / [id].astro;
pages / forum / member / [username].astro;
pages / forum / notifications.astro;
pages / forum / moderation.astro;
```

---

## 🔗 Dependencies

### Required Packages

- DaisyUI
- Drizzle ORM
- Supabase Auth SSR
- Astro SSR pages and forms

### Environment Variables

```env
DATABASE_URL=postgresql://...
MODERATION_AUTO_APPROVE=true
```

`DATABASE_URL` is resolved in the server DB bootstrap using `import.meta.env.DATABASE_URL` with a fallback to `process.env.DATABASE_URL` for compatibility with Astro development and production environments.

---

## 👥 Community Roles & Permissions

| Action              | Guest | Member | Moderator | Admin |
| ------------------- | ----- | ------ | --------- | ----- |
| Read public content | ✅    | ✅     | ✅        |
| Create threads      | ❌    | ✅     | ✅        |
| Reply to threads    | ❌    | ✅     | ✅        |
| Moderate content    | ❌    | ❌     | ✅        |
| Manage users        | ❌    | ❌     | ✅        |

---

## 📊 Timeline

### Week 1: Core Forum

- Category browsing and filtering
- Thread creation and thread detail pages
- Reply system and thread state management

### Week 2: User Features

- Member profiles and derived reputation
- Follow system and activity feed
- Simple in-app notification inbox

### Week 3: Moderation & Polish

- Moderator dashboard and report review
- UI polish with DaisyUI components
- Forum service modularization and thinner route action handling
- Deferred realtime and private messaging boundaries

---

## ➡️ Next Phase

After the remaining Phase 4 polish work, proceed to [Phase 5: Monetization](../phase-5-monetization/README.md) to implement the payment and subscription system.

## 📝 Remaining Polish

- Documentation cleanup and consistency checks
- Optional repository abstraction layer for stronger dependency inversion
- Optional notification preferences and richer moderation policies in a later phase

## 📚 Related Documentation

- **[Database Setup](../SETUP.md)** - Technical foundation
- **[Project Progress](../PROGRESS.md)** - Current development status
