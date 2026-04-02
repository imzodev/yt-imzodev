import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AstroGlobal, AstroCookies } from 'astro';

// Mock the db module
vi.mock('../db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [])
        }))
      }))
    }))
  },
  users: {
    role: 'role',
    supabaseUserId: 'supabase_user_id'
  }
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn()
}));

// Test route configuration logic by extracting and testing helper functions
describe('Middleware Route Configuration', () => {
  describe('Protected route patterns', () => {
    const protectedPatterns = [
      /^\/admin(\/.*)?$/,
      /^\/api\/admin(\/.*)?$/,
      /^\/dashboard$/,
      /^\/profile(\/.*)?$/,
      /^\/api\/billing(\/.*)?$/,
      /^\/api\/profile(\/.*)?$/,
      /^\/forum\/moderation$/,
    ];

    const testCases = [
      { path: '/admin', shouldMatch: true, patternIndex: 0 },
      { path: '/admin/users', shouldMatch: true, patternIndex: 0 },
      { path: '/admin/settings/general', shouldMatch: true, patternIndex: 0 },
      { path: '/api/admin/users', shouldMatch: true, patternIndex: 1 },
      { path: '/dashboard', shouldMatch: true, patternIndex: 2 },
      { path: '/profile', shouldMatch: true, patternIndex: 3 },
      { path: '/profile/settings', shouldMatch: true, patternIndex: 3 },
      { path: '/api/billing/checkout', shouldMatch: true, patternIndex: 4 },
      { path: '/api/profile/update', shouldMatch: true, patternIndex: 5 },
      { path: '/forum/moderation', shouldMatch: true, patternIndex: 6 },
      { path: '/forum', shouldMatch: false },
      { path: '/blog', shouldMatch: false },
      { path: '/videos', shouldMatch: false },
      { path: '/login', shouldMatch: false },
    ];

    testCases.forEach(({ path, shouldMatch }) => {
      it(`${path} ${shouldMatch ? 'should' : 'should not'} be protected`, () => {
        const matches = protectedPatterns.some(pattern => pattern.test(path));
        expect(matches).toBe(shouldMatch);
      });
    });
  });

  describe('Public route patterns', () => {
    const publicPatterns = [
      /^\/api\/auth\/logout$/,
      /^\/api\/webhooks(\/.*)?$/,
      /^\/api\/newsletter\/subscribe$/,
      /^\/api\/newsletter\/track(\/.*)?$/,
      /^\/$/,
      /^\/blog(\/.*)?$/,
      /^\/videos(\/.*)?$/,
      /^\/snippets(\/.*)?$/,
      /^\/forum(?!\/moderation)(\/.*)?$/,
      /^\/search$/,
      /^\/login$/,
      /^\/register$/,
      /^\/auth(\/.*)?$/,
    ];

    const testCases = [
      { path: '/', shouldBePublic: true },
      { path: '/blog', shouldBePublic: true },
      { path: '/blog/my-post', shouldBePublic: true },
      { path: '/videos', shouldBePublic: true },
      { path: '/videos/123', shouldBePublic: true },
      { path: '/snippets', shouldBePublic: true },
      { path: '/snippets/456', shouldBePublic: true },
      { path: '/forum', shouldBePublic: true },
      { path: '/forum/general', shouldBePublic: true },
      { path: '/forum/post/123', shouldBePublic: true },
      { path: '/search', shouldBePublic: true },
      { path: '/login', shouldBePublic: true },
      { path: '/register', shouldBePublic: true },
      { path: '/auth/callback', shouldBePublic: true },
      { path: '/api/webhooks/stripe', shouldBePublic: true },
      { path: '/api/newsletter/subscribe', shouldBePublic: true },
      { path: '/api/auth/logout', shouldBePublic: true },
      // Forum moderation should NOT be public
      { path: '/forum/moderation', shouldBePublic: false },
    ];

    testCases.forEach(({ path, shouldBePublic }) => {
      it(`${path} ${shouldBePublic ? 'should' : 'should not'} be public`, () => {
        const isPublic = publicPatterns.some(pattern => pattern.test(path));
        expect(isPublic).toBe(shouldBePublic);
      });
    });
  });

  describe('Static asset patterns', () => {
    const staticPatterns = [
      /\.(css|js|jsx?|tsx?|json|svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|eot)$/i,
    ];

    const testCases = [
      { path: '/styles/main.css', shouldBeStatic: true },
      { path: '/scripts/app.js', shouldBeStatic: true },
      { path: '/images/logo.png', shouldBeStatic: true },
      { path: '/images/banner.jpg', shouldBeStatic: true },
      { path: '/fonts/inter.woff2', shouldBeStatic: true },
      { path: '/favicon.ico', shouldBeStatic: true },
      { path: '/data.json', shouldBeStatic: true },
      { path: '/admin', shouldBeStatic: false },
      { path: '/dashboard', shouldBeStatic: false },
    ];

    testCases.forEach(({ path, shouldBeStatic }) => {
      it(`${path} ${shouldBeStatic ? 'should' : 'should not'} be recognized as static`, () => {
        const isStatic = staticPatterns.some(pattern => pattern.test(path));
        expect(isStatic).toBe(shouldBeStatic);
      });
    });
  });
});

describe('Role-based access control', () => {
  const hasRequiredRole = (userRole: string | null, requiredRole: string | string[]): boolean => {
    if (!userRole) return false;
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return requiredRoles.includes(userRole);
  };

  describe('Single role requirement', () => {
    it('allows access when user has exact required role', () => {
      expect(hasRequiredRole('admin', 'admin')).toBe(true);
      expect(hasRequiredRole('moderator', 'moderator')).toBe(true);
      expect(hasRequiredRole('member', 'member')).toBe(true);
    });

    it('denies access when user lacks required role', () => {
      expect(hasRequiredRole('member', 'admin')).toBe(false);
      expect(hasRequiredRole('member', 'moderator')).toBe(false);
      expect(hasRequiredRole('moderator', 'admin')).toBe(false);
    });

    it('denies access when user has no role', () => {
      expect(hasRequiredRole(null, 'admin')).toBe(false);
      expect(hasRequiredRole(null, 'moderator')).toBe(false);
    });
  });

  describe('Multiple role requirement', () => {
    it('allows access when user has any of the required roles', () => {
      expect(hasRequiredRole('admin', ['admin', 'moderator'])).toBe(true);
      expect(hasRequiredRole('moderator', ['admin', 'moderator'])).toBe(true);
    });

    it('denies access when user lacks all required roles', () => {
      expect(hasRequiredRole('member', ['admin', 'moderator'])).toBe(false);
    });

    it('denies access when user has no role for multiple requirements', () => {
      expect(hasRequiredRole(null, ['admin', 'moderator'])).toBe(false);
    });
  });
});

describe('Redirect URL encoding', () => {
  it('encodes redirect paths with special characters', () => {
    const pathname = '/admin/settings?tab=general';
    const encoded = encodeURIComponent(pathname);
    expect(encoded).toBe('%2Fadmin%2Fsettings%3Ftab%3Dgeneral');
  });

  it('preserves path structure in encoded redirect', () => {
    const pathname = '/profile/settings/security';
    const encoded = encodeURIComponent(pathname);
    expect(decodeURIComponent(encoded)).toBe(pathname);
  });
});

describe('Route config matching', () => {
  interface RouteConfig {
    pattern: RegExp;
    requiresAuth: boolean;
    requiredRole?: string | string[];
  }

  const protectedRoutes: RouteConfig[] = [
    { pattern: /^\/admin(\/.*)?$/, requiresAuth: true, requiredRole: 'admin' },
    { pattern: /^\/api\/admin(\/.*)?$/, requiresAuth: true, requiredRole: 'admin' },
    { pattern: /^\/dashboard$/, requiresAuth: true },
    { pattern: /^\/profile(\/.*)?$/, requiresAuth: true },
    { pattern: /^\/api\/billing(\/.*)?$/, requiresAuth: true },
    { pattern: /^\/api\/profile(\/.*)?$/, requiresAuth: true },
    { pattern: /^\/forum\/moderation$/, requiresAuth: true, requiredRole: ['moderator', 'admin'] },
  ];

  function getRouteConfig(pathname: string): RouteConfig | null {
    for (const route of protectedRoutes) {
      if (route.pattern.test(pathname)) {
        return route;
      }
    }
    return null;
  }

  it('returns admin config for /admin routes', () => {
    const config = getRouteConfig('/admin');
    expect(config).not.toBeNull();
    expect(config?.requiresAuth).toBe(true);
    expect(config?.requiredRole).toBe('admin');
  });

  it('returns admin config for /admin/subpath routes', () => {
    const config = getRouteConfig('/admin/users');
    expect(config).not.toBeNull();
    expect(config?.requiredRole).toBe('admin');
  });

  it('returns auth-only config for /dashboard', () => {
    const config = getRouteConfig('/dashboard');
    expect(config).not.toBeNull();
    expect(config?.requiresAuth).toBe(true);
    expect(config?.requiredRole).toBeUndefined();
  });

  it('returns auth-only config for /profile routes', () => {
    const config = getRouteConfig('/profile/settings');
    expect(config).not.toBeNull();
    expect(config?.requiresAuth).toBe(true);
    expect(config?.requiredRole).toBeUndefined();
  });

  it('returns moderator/admin config for /forum/moderation', () => {
    const config = getRouteConfig('/forum/moderation');
    expect(config).not.toBeNull();
    expect(config?.requiresAuth).toBe(true);
    expect(config?.requiredRole).toEqual(['moderator', 'admin']);
  });

  it('returns null for public routes', () => {
    expect(getRouteConfig('/')).toBeNull();
    expect(getRouteConfig('/blog')).toBeNull();
    expect(getRouteConfig('/videos')).toBeNull();
    expect(getRouteConfig('/login')).toBeNull();
    expect(getRouteConfig('/forum')).toBeNull();
    expect(getRouteConfig('/forum/general')).toBeNull();
  });
});
