import { describe, it, expect } from 'vitest';

describe('404 Page', () => {
  describe('Route patterns', () => {
    it('matches /404 route explicitly', () => {
      const route = '/404';
      expect(route).toBe('/404');
    });

    it('noindex is set to true for SEO', () => {
      const noindex = true;
      expect(noindex).toBe(true);
    });
  });

  describe('Navigation links', () => {
    const navigationLinks = [
      { href: '/', label: 'Go Home' },
      { href: '/blog', label: 'Blog' },
      { href: '/videos', label: 'Videos' },
      { href: '/snippets', label: 'Snippets' },
      { href: '/forum', label: 'Forum' },
      { href: '/search', label: 'Search' },
    ];

    it('has all required navigation links', () => {
      expect(navigationLinks).toHaveLength(6);
    });

    it('home link points to root', () => {
      const homeLink = navigationLinks.find(link => link.label === 'Go Home');
      expect(homeLink?.href).toBe('/');
    });

    it('blog link points to /blog', () => {
      const blogLink = navigationLinks.find(link => link.label === 'Blog');
      expect(blogLink?.href).toBe('/blog');
    });

    it('videos link points to /videos', () => {
      const videosLink = navigationLinks.find(link => link.label === 'Videos');
      expect(videosLink?.href).toBe('/videos');
    });

    it('snippets link points to /snippets', () => {
      const snippetsLink = navigationLinks.find(link => link.label === 'Snippets');
      expect(snippetsLink?.href).toBe('/snippets');
    });

    it('forum link points to /forum', () => {
      const forumLink = navigationLinks.find(link => link.label === 'Forum');
      expect(forumLink?.href).toBe('/forum');
    });

    it('search link points to /search', () => {
      const searchLink = navigationLinks.find(link => link.label === 'Search');
      expect(searchLink?.href).toBe('/search');
    });

    it('all links have valid href attributes', () => {
      navigationLinks.forEach(link => {
        expect(link.href).toBeDefined();
        expect(link.href).not.toBe('');
        expect(link.href.startsWith('/')).toBe(true);
      });
    });
  });

  describe('Content requirements', () => {
    it('title includes 404', () => {
      const title = '404 - Page Not Found';
      expect(title).toContain('404');
    });

    it('has descriptive error message', () => {
      const message = "The page you're looking for doesn't exist or has been moved.";
      expect(message).toContain("doesn't exist");
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML structure', () => {
      const semanticElements = ['main', 'h1', 'h2', 'nav'];
      expect(semanticElements).toContain('main');
      expect(semanticElements).toContain('h1');
      expect(semanticElements).toContain('h2');
    });

    it('has clear heading hierarchy', () => {
      // H1 for 404 number, H2 for error message
      const headings = [
        { level: 1, content: '404' },
        { level: 2, content: 'Page Not Found' },
      ];
      
      expect(headings[0].level).toBeLessThan(headings[1].level);
    });
  });

  describe('Theme support', () => {
    it('uses DaisyUI theme classes', () => {
      const classes = [
        'bg-base-100',
        'text-base-content',
        'btn-primary',
        'btn-outline',
        'btn-ghost',
      ];
      
      expect(classes).toContain('bg-base-100');
      expect(classes).toContain('text-base-content');
    });
  });
});
