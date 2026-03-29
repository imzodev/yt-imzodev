# Admin Blog Management Implementation Plan

## Overview

This plan outlines the implementation of blog post creation and management capabilities within the admin dashboard. The system will use the existing `blogPosts` and `blogCategories` database tables, following established admin patterns.

## Current State Analysis

### Existing Infrastructure
- **Database Schema**: `blogPosts` and `blogCategories` tables exist in [`src/db/schema.ts`](src/db/schema.ts:198-237)
- **Content Collection**: File-based MDX blog posts in `src/content/blog/` with schema in [`src/content.config.ts`](src/content.config.ts:1-18)
- **Admin Pattern**: Consistent patterns established in newsletter, users, and moderation modules
- **Auth/CSRF**: Session management via [`src/lib/server/auth.ts`](src/lib/server/auth.ts) and CSRF via [`src/lib/server/csrf.ts`](src/lib/server/csrf.ts)

### Database Schema (Already Exists)
```typescript
// blogPosts table fields:
- id, title, slug, content, excerpt
- featuredImage, authorId, categoryId, videoId
- accessLevel (public, member, premium)
- tags (array), status (draft, published, archived)
- featured, viewCount, likeCount
- publishedAt, createdAt, updatedAt

// blogCategories table fields:
- id, name, description, slug, color
- isActive, createdAt
```

---

## Implementation Plan

### Phase 1: Server-Side Functions

#### 1.1 Blog Admin Library
**File**: `src/lib/server/blog-admin.ts`

```typescript
// Functions to implement:
export async function listBlogPosts(options: {
  limit?: number;
  offset?: number;
  status?: string;
  categoryId?: number;
  search?: string;
}): Promise<BlogPost[]>

export async function getBlogPostById(id: number): Promise<BlogPost | null>

export async function createBlogPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: number;
  videoId?: number;
  accessLevel?: string;
  tags?: string[];
  status?: string;
  featured?: boolean;
  authorId: number;
}): Promise<BlogPost>

export async function updateBlogPost(id: number, data: Partial<CreateBlogPostData>): Promise<BlogPost>

export async function deleteBlogPost(id: number): Promise<boolean>

export async function getBlogCategories(): Promise<BlogCategory[]>

export async function getBlogStats(): Promise<{
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
}>
```

#### 1.2 Slug Generation Utility
**File**: `src/lib/server/blog-admin.ts`

```typescript
export function generateSlug(title: string): string
export async function ensureUniqueSlug(slug: string, excludeId?: number): Promise<string>
```

---

### Phase 2: API Endpoints

#### 2.1 Blog Posts API
**File**: `src/pages/api/admin/blog/posts.ts`

| Method | Action |
|--------|--------|
| GET | List posts with optional filters (status, category, search, pagination) |
| POST | Create new blog post |

#### 2.2 Single Post API
**File**: `src/pages/api/admin/blog/posts/[id].ts`

| Method | Action |
|--------|--------|
| GET | Get single post by ID |
| PUT | Update post |
| DELETE | Delete post |

#### 2.3 Categories API
**File**: `src/pages/api/admin/blog/categories.ts`

| Method | Action |
|--------|--------|
| GET | List all categories |

#### 2.4 Upload API (Featured Images)
**File**: `src/pages/api/admin/blog/upload.ts`

| Method | Action |
|--------|--------|
| POST | Upload featured image (if not using external storage) |

---

### Phase 3: Admin Pages

#### 3.1 Blog Post List Page
**File**: `src/pages/admin/blog/index.astro`

**Features**:
- Data table with columns: Title, Status, Category, Author, Views, Published Date, Actions
- Filters: Status (All/Draft/Published/Archived), Category, Search
- Bulk actions: Delete, Change status
- "New Post" button
- Stats cards: Total posts, Published, Drafts, Total views

#### 3.2 Create Post Page
**File**: `src/pages/admin/blog/new.astro`

**Form Fields**:
| Field | Type | Required |
|-------|------|----------|
| Title | text | Yes |
| Slug | text (auto-generated, editable) | Yes |
| Excerpt | textarea | No |
| Content | textarea/MDX editor | Yes |
| Featured Image | URL input or upload | No |
| Category | select dropdown | No |
| Tags | comma-separated or tag input | No |
| Access Level | radio/select (public, member, premium) | Yes |
| Status | radio (draft, published) | Yes |
| Featured | checkbox | No |
| Related Video | select dropdown | No |
| Published At | datetime picker | No (auto-set on publish) |

**Actions**:
- Save Draft
- Publish
- Preview (opens in new tab or modal)

#### 3.3 Edit Post Page
**File**: `src/pages/admin/blog/[id].astro`

Same as create page, but pre-populated with existing data. Additional actions:
- Unpublish (revert to draft)
- Archive
- Delete (with confirmation)

---

### Phase 4: UI Components

#### 4.1 Markdown/MDX Editor Component
**File**: `src/components/admin/MarkdownEditor.astro`

Options:
1. Simple textarea with preview toggle
2. Integrate a markdown editor library (e.g., SimpleMDE, EasyMDE, Toast UI Editor)

#### 4.2 Tag Input Component
**File**: `src/components/admin/TagInput.astro`

Features:
- Add/remove tags
- Display as badges
- Convert to array for form submission

#### 4.3 Slug Input Component
**File**: `src/components/admin/SlugInput.astro`

Features:
- Auto-generate from title
- Manual edit capability
- Real-time uniqueness validation

---

### Phase 5: Integration & Testing

#### 5.1 Admin Navigation Update
**File**: `src/components/admin/AdminLayout.astro`

Add "Blog Posts" link to admin navigation under "Content" section.

#### 5.2 Unit Tests
**File**: `src/lib/server/__tests__/blog-admin.test.ts`

Test coverage:
- `listBlogPosts` with various filters
- `createBlogPost` validation
- `updateBlogPost` partial updates
- `deleteBlogPost` cascade behavior
- Slug generation and uniqueness

#### 5.3 API Tests
**File**: `src/pages/api/admin/blog/__tests__/posts.test.ts`

Test coverage:
- Authentication requirements
- Admin authorization
- Input validation
- Error handling

---

## File Structure Summary

```
src/
├── lib/
│   └── server/
│       ├── blog-admin.ts          # NEW: Blog admin functions
│       └── __tests__/
│           └── blog-admin.test.ts # NEW: Unit tests
├── pages/
│   ├── admin/
│   │   └── blog/
│   │       ├── index.astro        # NEW: Post list
│   │       ├── new.astro          # NEW: Create post
│   │       └── [id].astro         # NEW: Edit post
│   └── api/
│       └── admin/
│           └── blog/
│               ├── posts.ts       # NEW: List/Create API
│               ├── categories.ts  # NEW: Categories API
│               └── posts/
│                   └── [id].ts    # NEW: Single post API
└── components/
    └── admin/
        ├── MarkdownEditor.astro   # NEW: MD editor
        ├── TagInput.astro         # NEW: Tag input
        └── SlugInput.astro        # NEW: Slug input
```

---

## Implementation Order

1. **Server Functions** (`blog-admin.ts`) - Core CRUD operations
2. **API Endpoints** - REST endpoints for frontend
3. **List Page** (`blog/index.astro`) - View existing posts
4. **Create Page** (`blog/new.astro`) - Basic form
5. **Edit Page** (`blog/[id].astro`) - Edit functionality
6. **UI Components** - Enhanced editor, tag input, slug input
7. **Navigation Update** - Add to admin menu
8. **Tests** - Unit and API tests

---

## Design Decisions Needed

### 1. Content Storage Approach
- **Option A**: Store content in database only (recommended for admin management)
- **Option B**: Sync to MDX files for Astro content collection
- **Option C**: Hybrid - database is source of truth, optionally export to files

**Recommendation**: Option A - Use database as single source of truth. Update blog listing page to fetch from database instead of content collection.

### 2. Featured Image Handling
- **Option A**: URL input only (user hosts images elsewhere)
- **Option B**: Upload to Supabase storage
- **Option C**: Upload to external service (Cloudinary, etc.)

**Recommendation**: Option A for MVP, add upload later if needed.

### 3. Editor Type
- **Option A**: Plain textarea with markdown support
- **Option B**: WYSIWYG markdown editor
- **Option C**: Full MDX editor with component preview

**Recommendation**: Option A for MVP, enhance later.

---

## Security Considerations

1. **Authentication**: All endpoints require valid session
2. **Authorization**: Admin role required (via `checkAdminAccess`)
3. **CSRF Protection**: All forms include CSRF token
4. **Input Validation**: Server-side validation for all inputs
5. **XSS Prevention**: Sanitize HTML content before storage
6. **SQL Injection**: Use Drizzle ORM parameterized queries

---

## Estimated Effort

| Task | Estimated Time |
|------|----------------|
| Server functions + tests | 2-3 hours |
| API endpoints | 2-3 hours |
| Admin pages (list, create, edit) | 3-4 hours |
| UI components | 2-3 hours |
| Integration & navigation | 1 hour |
| Testing & refinement | 2-3 hours |
| **Total** | **12-17 hours** |

---

## Next Steps

1. Confirm design decisions (storage, images, editor)
2. Begin with Phase 1: Server-side functions
3. Progress through phases sequentially
4. Deploy incrementally for testing
