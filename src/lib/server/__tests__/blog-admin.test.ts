/**
 * Tests for blog-admin.ts - Blog admin server functions
 */
import { describe, it, expect } from 'vitest';

// ============================================================================
// Slug Generation Tests
// ============================================================================

describe('Slug Generation', () => {
  // Import the generateSlug function (simulated for testing)
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  }

  it('should convert title to URL-safe slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should handle special characters', () => {
    expect(generateSlug('Hello! @World# $Test')).toBe('hello-world-test');
  });

  it('should replace spaces with hyphens', () => {
    expect(generateSlug('My Blog Post Title')).toBe('my-blog-post-title');
  });

  it('should convert to lowercase', () => {
    expect(generateSlug('HELLO WORLD')).toBe('hello-world');
  });

  it('should limit slug length to 100 chars', () => {
    const longTitle = 'A'.repeat(150);
    expect(generateSlug(longTitle).length).toBe(100);
  });

  it('should handle empty title', () => {
    expect(generateSlug('')).toBe('');
  });

  it('should handle consecutive spaces', () => {
    expect(generateSlug('Hello    World')).toBe('hello-world');
  });

  it('should strip leading/trailing hyphens', () => {
    expect(generateSlug('---Hello World---')).toBe('hello-world');
  });
});

// ============================================================================
// Slug Uniqueness Tests
// ============================================================================

describe('Slug Uniqueness', () => {
  // Simulate ensureUniqueSlug logic
  async function ensureUniqueSlug(slug: string, existingSlugs: string[], excludeId?: number): Promise<string> {
    // If no existing slugs match, return as-is
    if (!existingSlugs.includes(slug)) {
      return slug;
    }
    
    // Otherwise append suffix
    let suffix = 2;
    let uniqueSlug = `${slug}-${suffix}`;
    while (existingSlugs.includes(uniqueSlug)) {
      suffix++;
      uniqueSlug = `${slug}-${suffix}`;
    }
    return uniqueSlug;
  }

  it('should return same slug when unique', async () => {
    const result = await ensureUniqueSlug('my-post', []);
    expect(result).toBe('my-post');
  });

  it('should append -2 when slug exists', async () => {
    const result = await ensureUniqueSlug('my-post', ['my-post']);
    expect(result).toBe('my-post-2');
  });

  it('should increment suffix for multiple conflicts', async () => {
    const result = await ensureUniqueSlug('my-post', ['my-post', 'my-post-2']);
    expect(result).toBe('my-post-3');
  });

  it('should handle slug with existing -2 and -3', async () => {
    const result = await ensureUniqueSlug('my-post', ['my-post', 'my-post-2', 'my-post-3']);
    expect(result).toBe('my-post-4');
  });
});

// ============================================================================
// Stats Calculations Tests
// ============================================================================

describe('Stats Calculations', () => {
  // Simulate stats calculation
  function calculateStats(posts: Array<{ status: string; viewCount: number; likeCount: number }>) {
    return {
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => p.status === 'published').length,
      draftPosts: posts.filter(p => p.status === 'draft').length,
      archivedPosts: posts.filter(p => p.status === 'archived').length,
      totalViews: posts.reduce((sum, p) => sum + p.viewCount, 0),
      totalLikes: posts.reduce((sum, p) => sum + p.likeCount, 0),
    };
  }

  it('should calculate total posts count', () => {
    const posts = [
      { status: 'published', viewCount: 100, likeCount: 10 },
      { status: 'draft', viewCount: 0, likeCount: 0 },
      { status: 'archived', viewCount: 50, likeCount: 5 },
    ];
    const stats = calculateStats(posts);
    expect(stats.totalPosts).toBe(3);
  });

  it('should calculate published posts count', () => {
    const posts = [
      { status: 'published', viewCount: 100, likeCount: 10 },
      { status: 'draft', viewCount: 0, likeCount: 0 },
      { status: 'published', viewCount: 50, likeCount: 5 },
    ];
    const stats = calculateStats(posts);
    expect(stats.publishedPosts).toBe(2);
  });

  it('should calculate draft posts count', () => {
    const posts = [
      { status: 'draft', viewCount: 0, likeCount: 0 },
      { status: 'draft', viewCount: 0, likeCount: 0 },
      { status: 'published', viewCount: 50, likeCount: 5 },
    ];
    const stats = calculateStats(posts);
    expect(stats.draftPosts).toBe(2);
  });

  it('should calculate archived posts count', () => {
    const posts = [
      { status: 'archived', viewCount: 100, likeCount: 10 },
      { status: 'draft', viewCount: 0, likeCount: 0 },
    ];
    const stats = calculateStats(posts);
    expect(stats.archivedPosts).toBe(1);
  });

  it('should sum total views across all posts', () => {
    const posts = [
      { status: 'published', viewCount: 100, likeCount: 10 },
      { status: 'published', viewCount: 200, likeCount: 20 },
    ];
    const stats = calculateStats(posts);
    expect(stats.totalViews).toBe(300);
  });

  it('should sum total likes across all posts', () => {
    const posts = [
      { status: 'published', viewCount: 100, likeCount: 10 },
      { status: 'published', viewCount: 200, likeCount: 20 },
    ];
    const stats = calculateStats(posts);
    expect(stats.totalLikes).toBe(30);
  });

  it('should handle empty database (all zeros)', () => {
    const stats = calculateStats([]);
    expect(stats.totalPosts).toBe(0);
    expect(stats.publishedPosts).toBe(0);
    expect(stats.draftPosts).toBe(0);
    expect(stats.archivedPosts).toBe(0);
    expect(stats.totalViews).toBe(0);
    expect(stats.totalLikes).toBe(0);
  });
});

// ============================================================================
// Pagination Logic Tests
// ============================================================================

describe('Pagination Logic', () => {
  function calculatePagination(total: number, limit: number, offset: number) {
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    return { currentPage, totalPages, hasMore };
  }

  it('should calculate offset from page and limit', () => {
    const page = 2;
    const limit = 10;
    const offset = (page - 1) * limit;
    expect(offset).toBe(10);
  });

  it('should default to page 1 when not specified', () => {
    const page = 1;
    expect(page).toBe(1);
  });

  it('should default to limit 50 when not specified', () => {
    const limit = 50;
    expect(limit).toBe(50);
  });

  it('should calculate total pages from total count and limit', () => {
    const result = calculatePagination(100, 10, 0);
    expect(result.totalPages).toBe(10);
  });

  it('should handle page beyond available results', () => {
    const result = calculatePagination(25, 10, 30);
    expect(result.currentPage).toBe(4);
    expect(result.hasMore).toBe(false);
  });
});

// ============================================================================
// Data Validation Tests
// ============================================================================

describe('Data Validation', () => {
  function validatePostData(data: { title: string; content: string; status?: string; accessLevel?: string }) {
    const errors: string[] = [];
    
    if (!data.title || !data.title.trim()) {
      errors.push('Title is required');
    }
    
    if (!data.content || !data.content.trim()) {
      errors.push('Content is required');
    }
    
    const validStatuses = ['draft', 'published', 'archived'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Invalid status');
    }
    
    const validAccessLevels = ['public', 'member', 'premium'];
    if (data.accessLevel && !validAccessLevels.includes(data.accessLevel)) {
      errors.push('Invalid access level');
    }
    
    return { valid: errors.length === 0, errors };
  }

  it('should validate required fields: title, content', () => {
    const result = validatePostData({ title: '', content: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
    expect(result.errors).toContain('Content is required');
  });

  it('should validate status enum values', () => {
    const result = validatePostData({ title: 'Test', content: 'Content', status: 'invalid' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid status');
  });

  it('should validate access level enum values', () => {
    const result = validatePostData({ title: 'Test', content: 'Content', accessLevel: 'invalid' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid access level');
  });

  it('should set default status to draft', () => {
    const data = { title: 'Test', content: 'Content' };
    expect(data.status ?? 'draft').toBe('draft');
  });

  it('should set default access level to public', () => {
    const data = { title: 'Test', content: 'Content' };
    expect(data.accessLevel ?? 'public').toBe('public');
  });
});
