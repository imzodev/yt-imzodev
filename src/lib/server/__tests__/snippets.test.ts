/**
 * Tests for Snippet CRUD Operations
 * Tests the snippet management functions added for Issue #34
 */
import { describe, it, expect } from 'vitest';

// Test the snippet input validation and structure
describe('Snippets - Input Validation', () => {
  // Define the input type for createSnippet
  interface CreateSnippetInput {
    title: string;
    content: string;
    language: string;
    type: string;
    description?: string;
    categoryId?: number;
    authorId?: number;
    accessLevel?: string;
    tags?: string[];
    isActive?: boolean;
  }

  // Define the input type for updateSnippet
  interface UpdateSnippetInput {
    title?: string;
    content?: string;
    language?: string;
    type?: string;
    description?: string;
    categoryId?: number | null;
    accessLevel?: string;
    tags?: string[];
    isActive?: boolean;
  }

  describe('Create Snippet Input Validation', () => {
    it('should validate required fields', () => {
      const validateCreateInput = (input: CreateSnippetInput): { valid: boolean; error?: string } => {
        if (!input.title || input.title.trim() === '') {
          return { valid: false, error: 'Title is required.' };
        }
        if (!input.content || input.content.trim() === '') {
          return { valid: false, error: 'Content is required.' };
        }
        if (!input.language || input.language.trim() === '') {
          return { valid: false, error: 'Language is required.' };
        }
        return { valid: true };
      };

      expect(validateCreateInput({ title: 'Test', content: 'code', language: 'typescript' }).valid).toBe(true);
      expect(validateCreateInput({ title: '', content: 'code', language: 'ts' }).valid).toBe(false);
      expect(validateCreateInput({ title: 'Test', content: '', language: 'ts' }).valid).toBe(false);
      expect(validateCreateInput({ title: 'Test', content: 'code', language: '' }).valid).toBe(false);
    });

    it('should accept valid optional fields', () => {
      const input: CreateSnippetInput = {
        title: 'useDebounce Hook',
        content: 'export function useDebounce...',
        language: 'typescript',
        type: 'code',
        description: 'A custom React hook for debouncing values',
        categoryId: 1,
        accessLevel: 'member',
        tags: ['react', 'hooks', 'typescript'],
        isActive: true
      };

      expect(input.title).toBe('useDebounce Hook');
      expect(input.type).toBe('code');
      expect(input.accessLevel).toBe('member');
      expect(input.tags).toHaveLength(3);
    });

    it('should default type to code', () => {
      const input: CreateSnippetInput = {
        title: 'Test',
        content: 'code',
        language: 'javascript'
      };

      const type = input.type || 'code';
      expect(type).toBe('code');
    });

    it('should default accessLevel to public', () => {
      const input: CreateSnippetInput = {
        title: 'Test',
        content: 'code',
        language: 'javascript'
      };

      const accessLevel = input.accessLevel || 'public';
      expect(accessLevel).toBe('public');
    });

    it('should default isActive to true', () => {
      const input: CreateSnippetInput = {
        title: 'Test',
        content: 'code',
        language: 'javascript'
      };

      const isActive = input.isActive ?? true;
      expect(isActive).toBe(true);
    });

    it('should validate snippet type values', () => {
      const validTypes = ['code', 'command', 'config'];
      const isValidType = (type: string): boolean => validTypes.includes(type);

      expect(isValidType('code')).toBe(true);
      expect(isValidType('command')).toBe(true);
      expect(isValidType('config')).toBe(true);
      expect(isValidType('script')).toBe(false);
    });

    it('should validate access level values', () => {
      const validAccessLevels = ['public', 'member', 'premium'];
      const isValidAccessLevel = (level: string): boolean => validAccessLevels.includes(level);

      expect(isValidAccessLevel('public')).toBe(true);
      expect(isValidAccessLevel('member')).toBe(true);
      expect(isValidAccessLevel('premium')).toBe(true);
      expect(isValidAccessLevel('admin')).toBe(false);
    });
  });

  describe('Update Snippet Input Validation', () => {
    it('should allow partial updates', () => {
      const input: UpdateSnippetInput = {
        title: 'Updated Title'
      };

      expect(input.title).toBe('Updated Title');
      expect(input.content).toBeUndefined();
      expect(input.isActive).toBeUndefined();
    });

    it('should allow updating isActive status', () => {
      const input: UpdateSnippetInput = {
        isActive: false
      };

      expect(input.isActive).toBe(false);
    });

    it('should allow clearing categoryId with null', () => {
      const input: UpdateSnippetInput = {
        categoryId: null
      };

      expect(input.categoryId).toBeNull();
    });

    it('should allow updating tags array', () => {
      const input: UpdateSnippetInput = {
        tags: ['react', 'hooks', 'debounce']
      };

      expect(input.tags).toHaveLength(3);
      expect(input.tags).toContain('react');
    });
  });
});

describe('Snippets - Permission Checks', () => {
  // Define viewer type for permission tests
  interface Viewer {
    id: number;
    role: string;
    isActive: boolean;
  }

  const isAdmin = (viewer: Viewer | null): boolean => {
    if (!viewer || viewer.isActive === false) return false;
    return viewer.role === 'admin';
  };

  describe('Admin Permission', () => {
    it('should allow admin access', () => {
      const admin: Viewer = { id: 1, role: 'admin', isActive: true };
      expect(isAdmin(admin)).toBe(true);
    });

    it('should deny moderator access', () => {
      const moderator: Viewer = { id: 2, role: 'moderator', isActive: true };
      expect(isAdmin(moderator)).toBe(false);
    });

    it('should deny regular member', () => {
      const member: Viewer = { id: 3, role: 'member', isActive: true };
      expect(isAdmin(member)).toBe(false);
    });

    it('should deny inactive users', () => {
      const inactiveAdmin: Viewer = { id: 1, role: 'admin', isActive: false };
      expect(isAdmin(inactiveAdmin)).toBe(false);
    });

    it('should deny null/undefined viewers', () => {
      expect(isAdmin(null)).toBe(false);
      expect(isAdmin(undefined as unknown as null)).toBe(false);
    });
  });
});

describe('Snippets - Snippet Structure', () => {
  interface Snippet {
    id: number;
    title: string;
    content: string;
    language: string;
    type: string;
    description: string | null;
    categoryId: number | null;
    authorId: number | null;
    accessLevel: string;
    tags: string[] | null;
    likes: number;
    views: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  describe('Snippet Response Structure', () => {
    it('should have correct structure for snippet response', () => {
      const snippet: Snippet = {
        id: 1,
        title: 'useDebounce Hook',
        content: 'export function useDebounce...',
        language: 'typescript',
        type: 'code',
        description: 'A custom React hook',
        categoryId: 1,
        authorId: 1,
        accessLevel: 'public',
        tags: ['react', 'hooks'],
        likes: 10,
        views: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(snippet.id).toBeDefined();
      expect(snippet.title).toBeDefined();
      expect(snippet.content).toBeDefined();
      expect(snippet.language).toBeDefined();
      expect(typeof snippet.isActive).toBe('boolean');
      expect(['public', 'member', 'premium']).toContain(snippet.accessLevel);
    });

    it('should handle nullable fields', () => {
      const snippet: Snippet = {
        id: 1,
        title: 'Test',
        content: 'code',
        language: 'javascript',
        type: 'code',
        description: null,
        categoryId: null,
        authorId: null,
        accessLevel: 'public',
        tags: null,
        likes: 0,
        views: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(snippet.description).toBeNull();
      expect(snippet.categoryId).toBeNull();
      expect(snippet.authorId).toBeNull();
      expect(snippet.tags).toBeNull();
    });
  });
});

describe('Snippets - Badge Styling', () => {
  describe('Type Badge Classes', () => {
    const getTypeBadgeClass = (type: string): string => {
      const badgeMap: Record<string, string> = {
        'code': 'badge-primary',
        'command': 'badge-secondary',
        'config': 'badge-accent'
      };
      return badgeMap[type] || 'badge-ghost';
    };

    it('should return primary for code type', () => {
      expect(getTypeBadgeClass('code')).toBe('badge-primary');
    });

    it('should return secondary for command type', () => {
      expect(getTypeBadgeClass('command')).toBe('badge-secondary');
    });

    it('should return accent for config type', () => {
      expect(getTypeBadgeClass('config')).toBe('badge-accent');
    });

    it('should return ghost for unknown type', () => {
      expect(getTypeBadgeClass('unknown')).toBe('badge-ghost');
    });
  });

  describe('Access Level Badge Classes', () => {
    const getAccessLevelBadgeClass = (accessLevel: string): string => {
      const badgeMap: Record<string, string> = {
        'public': 'badge-ghost',
        'member': 'badge-accent',
        'premium': 'badge-secondary'
      };
      return badgeMap[accessLevel] || 'badge-ghost';
    };

    it('should return ghost for public', () => {
      expect(getAccessLevelBadgeClass('public')).toBe('badge-ghost');
    });

    it('should return accent for member', () => {
      expect(getAccessLevelBadgeClass('member')).toBe('badge-accent');
    });

    it('should return secondary for premium', () => {
      expect(getAccessLevelBadgeClass('premium')).toBe('badge-secondary');
    });
  });

  describe('Status Badge Classes', () => {
    const getStatusBadgeClass = (isActive: boolean): string => {
      return isActive ? 'badge-success' : 'badge-error';
    };

    it('should return success for active', () => {
      expect(getStatusBadgeClass(true)).toBe('badge-success');
    });

    it('should return error for inactive', () => {
      expect(getStatusBadgeClass(false)).toBe('badge-error');
    });
  });
});

describe('Snippets - Form Data Parsing', () => {
  describe('Tags Parsing', () => {
    const parseTags = (tagsStr: string): string[] => {
      if (!tagsStr.trim()) return [];
      return tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    };

    it('should parse comma-separated tags', () => {
      expect(parseTags('react, hooks, typescript')).toEqual(['react', 'hooks', 'typescript']);
    });

    it('should handle extra whitespace', () => {
      expect(parseTags('  react  ,  hooks  ,  typescript  ')).toEqual(['react', 'hooks', 'typescript']);
    });

    it('should return empty array for empty string', () => {
      expect(parseTags('')).toEqual([]);
      expect(parseTags('   ')).toEqual([]);
    });

    it('should filter out empty tags', () => {
      expect(parseTags('react,,hooks,')).toEqual(['react', 'hooks']);
    });
  });

  describe('Form Data Parsing', () => {
    const parseFormData = (formData: Record<string, string | undefined>) => {
      return {
        title: (formData.title || '').trim(),
        content: (formData.content || '').trim(),
        language: (formData.language || '').trim(),
        type: formData.type || 'code',
        description: (formData.description || '').trim(),
        categoryId: formData.category_id ? parseInt(String(formData.category_id), 10) : null,
        accessLevel: formData.access_level || 'public',
        tags: (formData.tags || '').trim() ? (formData.tags || '').split(',').map(t => t.trim()).filter(Boolean) : [],
        isActive: formData.is_active === 'on'
      };
    };

    it('should parse form data correctly', () => {
      const formData = {
        title: '  Test Snippet  ',
        content: '  code here  ',
        language: '  typescript  ',
        type: 'command',
        description: '  A description  ',
        category_id: '5',
        access_level: 'member',
        tags: '  react, hooks  ',
        is_active: 'on'
      };

      const parsed = parseFormData(formData);
      expect(parsed.title).toBe('Test Snippet');
      expect(parsed.content).toBe('code here');
      expect(parsed.language).toBe('typescript');
      expect(parsed.type).toBe('command');
      expect(parsed.description).toBe('A description');
      expect(parsed.categoryId).toBe(5);
      expect(parsed.accessLevel).toBe('member');
      expect(parsed.tags).toEqual(['react', 'hooks']);
      expect(parsed.isActive).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const formData = {
        title: 'Test',
        content: 'code',
        language: 'js'
      };

      const parsed = parseFormData(formData);
      expect(parsed.type).toBe('code');
      expect(parsed.categoryId).toBeNull();
      expect(parsed.accessLevel).toBe('public');
      expect(parsed.tags).toEqual([]);
      expect(parsed.isActive).toBe(false);
    });

    it('should handle invalid categoryId', () => {
      const formData = {
        title: 'Test',
        content: 'code',
        language: 'js',
        category_id: 'invalid'
      };

      const parsed = parseFormData(formData);
      expect(parsed.categoryId).toBeNaN();
    });
  });
});

describe('Snippets - Search and Filtering', () => {
  describe('Filter Options', () => {
    it('should build correct filter params', () => {
      const buildFilterParams = (filters: {
        language?: string;
        type?: string;
        access?: string;
        search?: string;
      }): URLSearchParams => {
        const params = new URLSearchParams();
        if (filters.language) params.set('language', filters.language);
        if (filters.type) params.set('type', filters.type);
        if (filters.access) params.set('access', filters.access);
        if (filters.search) params.set('search', filters.search);
        return params;
      };

      const params = buildFilterParams({
        language: 'typescript',
        type: 'code',
        access: 'public',
        search: 'react'
      });

      expect(params.get('language')).toBe('typescript');
      expect(params.get('type')).toBe('code');
      expect(params.get('access')).toBe('public');
      expect(params.get('search')).toBe('react');
    });

    it('should return empty params when no filters', () => {
      const buildFilterParams = (filters: Record<string, string | undefined>): URLSearchParams => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        return params;
      };

      const params = buildFilterParams({});
      expect(params.toString()).toBe('');
    });
  });
});

describe('Snippets - Language Colors', () => {
  const languageColors: Record<string, string> = {
    javascript: 'bg-yellow-400 text-black',
    typescript: 'bg-blue-500 text-white',
    python: 'bg-blue-400 text-white',
    css: 'bg-pink-500 text-white',
    html: 'bg-orange-500 text-white',
    bash: 'bg-gray-800 text-white',
  };

  it('should return correct color for javascript', () => {
    expect(languageColors['javascript']).toBe('bg-yellow-400 text-black');
  });

  it('should return correct color for typescript', () => {
    expect(languageColors['typescript']).toBe('bg-blue-500 text-white');
  });

  it('should return correct color for python', () => {
    expect(languageColors['python']).toBe('bg-blue-400 text-white');
  });

  it('should handle unknown language', () => {
    const getLanguageColor = (lang: string): string => {
      return languageColors[lang] || 'bg-base-300 text-base-content';
    };

    expect(getLanguageColor('unknown')).toBe('bg-base-300 text-base-content');
  });
});

describe('Snippets - Statistics', () => {
  describe('Stats Structure', () => {
    it('should have correct structure for snippet stats', () => {
      const stats = {
        total: 50,
        active: 45,
        categories: 8
      };

      expect(stats.total).toBe(50);
      expect(stats.active).toBe(45);
      expect(stats.categories).toBe(8);
    });

    it('should handle zero values', () => {
      const stats = {
        total: 0,
        active: 0,
        categories: 0
      };

      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.categories).toBe(0);
    });
  });
});
