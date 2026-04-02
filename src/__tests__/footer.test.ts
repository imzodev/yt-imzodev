import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Footer Component', () => {
  const footerPath = join(process.cwd(), 'src/components/Footer.astro');
  const footerContent = readFileSync(footerPath, 'utf-8');

  describe('File Structure', () => {
    it('should exist at src/components/Footer.astro', () => {
      expect(footerContent).toBeTruthy();
    });

    it('should have Astro frontmatter with currentYear variable', () => {
      expect(footerContent).toContain('const currentYear');
      expect(footerContent).toContain("new Date().getFullYear()");
    });

    it('should export the component as default', () => {
      // Astro components are self-contained, verify the file is valid
      expect(footerContent).toMatch(/---[\s\S]*---/);
    });
  });

  describe('Layout Structure', () => {
    it('should have a footer element as the root', () => {
      expect(footerContent).toMatch(/<footer[^>]*>/);
    });

    it('should use mt-auto class for sticky footer behavior', () => {
      expect(footerContent).toContain('mt-auto');
    });

    it('should use bg-base-200 for DaisyUI theming', () => {
      expect(footerContent).toContain('bg-base-200');
    });

    it('should have border-top styling', () => {
      expect(footerContent).toContain('border-t');
      expect(footerContent).toContain('border-base-300');
    });

    it('should use container with mx-auto and px-4 for responsive layout', () => {
      expect(footerContent).toContain('container');
      expect(footerContent).toContain('mx-auto');
      expect(footerContent).toContain('px-4');
    });
  });

  describe('Grid Layout', () => {
    it('should have a 4-column responsive grid', () => {
      expect(footerContent).toContain('grid');
      expect(footerContent).toContain('grid-cols-1');
      expect(footerContent).toContain('md:grid-cols-2');
      expect(footerContent).toContain('lg:grid-cols-4');
    });

    it('should have gap-8 for column spacing', () => {
      expect(footerContent).toContain('gap-8');
    });
  });

  describe('Column 1: Brand Section', () => {
    it('should have a logo link to home', () => {
      expect(footerContent).toMatch(/<a[^>]*href="\/"[^>]*>/);
    });

    it('should have the IZ badge logo', () => {
      expect(footerContent).toContain('IZ');
      expect(footerContent).toContain('w-8 h-8');
      expect(footerContent).toContain('bg-primary');
      expect(footerContent).toContain('rounded-lg');
    });

    it('should have imzodev brand name', () => {
      expect(footerContent).toContain('imzodev');
    });

    it('should have a tagline', () => {
      expect(footerContent).toContain('AI & Software Development');
    });

    it('should have a description', () => {
      expect(footerContent).toMatch(/Tutorials.*snippets.*insights/);
    });
  });

  describe('Column 2: Content Links', () => {
    const contentLinks = [
      { href: '/videos', text: 'Videos' },
      { href: '/blog', text: 'Blog' },
      { href: '/snippets', text: 'Snippets' },
      { href: '/lab', text: 'Lab Tools' },
    ];

    contentLinks.forEach(({ href, text }) => {
      it(`should have link to ${text} (${href})`, () => {
        expect(footerContent).toContain(`href="${href}"`);
        expect(footerContent).toContain(text);
      });
    });

    it('should have Content heading', () => {
      expect(footerContent).toContain('Content');
    });
  });

  describe('Column 3: Community Links', () => {
    const communityLinks = [
      { href: '/forum', text: 'Forum' },
      { href: '/newsletter', text: 'Newsletter' },
      { href: '/pricing', text: 'Pricing' },
    ];

    communityLinks.forEach(({ href, text }) => {
      it(`should have link to ${text} (${href})`, () => {
        expect(footerContent).toContain(`href="${href}"`);
        expect(footerContent).toContain(text);
      });
    });

    it('should have Community heading', () => {
      expect(footerContent).toContain('Community');
    });
  });

  describe('Column 4: Legal & Social Links', () => {
    const legalSocialLinks = [
      { href: '/privacy', text: 'Privacy Policy' },
      { href: '/terms', text: 'Terms of Service' },
      { href: 'https://youtube.com/@imzodev', text: 'YouTube' },
      { href: 'https://github.com/imzodev', text: 'GitHub' },
    ];

    legalSocialLinks.forEach(({ href, text }) => {
      it(`should have link to ${text} (${href})`, () => {
        expect(footerContent).toContain(`href="${href}"`);
        expect(footerContent).toContain(text);
      });
    });

    it('should have target="_blank" for external links', () => {
      expect(footerContent).toContain('target="_blank"');
    });

    it('should have rel="noopener noreferrer" for security', () => {
      expect(footerContent).toContain('rel="noopener noreferrer"');
    });

    it('should have Legal & Social heading', () => {
      expect(footerContent).toContain('Legal & Social');
    });

    it('should have YouTube SVG icon', () => {
      expect(footerContent).toMatch(/<svg[^>]*viewBox="0 0 24 24"[^>]*>[\s\S]*YouTube/);
    });

    it('should have GitHub SVG icon', () => {
      expect(footerContent).toMatch(/<svg[^>]*viewBox="0 0 24 24"[^>]*>[\s\S]*GitHub/);
    });
  });

  describe('Bottom Bar', () => {
    it('should have a divider element', () => {
      expect(footerContent).toContain('divider');
    });

    it('should have copyright with dynamic year', () => {
      expect(footerContent).toContain('&copy;');
      expect(footerContent).toContain('{currentYear}');
      expect(footerContent).toContain('imzodev');
      expect(footerContent).toContain('All rights reserved');
    });

    it('should have "Built with Astro" badge', () => {
      expect(footerContent).toContain('Built with');
      expect(footerContent).toContain('Astro');
      expect(footerContent).toContain('https://astro.build');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic footer element', () => {
      expect(footerContent).toMatch(/<footer[^>]*>/);
    });

    it('should have proper heading hierarchy (h3 for column headings)', () => {
      // Check for h3 elements for section headings
      const h3Matches = footerContent.match(/<h3/g);
      expect(h3Matches).toBeTruthy();
      expect(h3Matches!.length).toBeGreaterThanOrEqual(3); // Content, Community, Legal & Social
    });
  });

  describe('Theming', () => {
    it('should use DaisyUI theme-aware classes', () => {
      expect(footerContent).toContain('text-base-content');
      expect(footerContent).toContain('bg-base-200');
    });

    it('should have hover transitions for links', () => {
      expect(footerContent).toContain('hover:text-primary');
      expect(footerContent).toContain('transition-colors');
    });
  });

  describe('Responsive Design', () => {
    it('should stack columns on mobile', () => {
      expect(footerContent).toContain('grid-cols-1');
    });

    it('should show 2 columns on tablet', () => {
      expect(footerContent).toContain('md:grid-cols-2');
    });

    it('should show 4 columns on desktop', () => {
      expect(footerContent).toContain('lg:grid-cols-4');
    });

    it('should have responsive bottom bar layout', () => {
      expect(footerContent).toContain('flex-col');
      expect(footerContent).toContain('md:flex-row');
    });
  });
});

describe('Layout.astro Footer Integration', () => {
  const layoutPath = join(process.cwd(), 'src/layouts/Layout.astro');
  const layoutContent = readFileSync(layoutPath, 'utf-8');

  describe('Import and Props', () => {
    it('should import Footer component', () => {
      expect(layoutContent).toContain("import Footer from");
      expect(layoutContent).toContain("Footer.astro");
    });

    it('should have hideFooter prop in Props interface', () => {
      expect(layoutContent).toContain('hideFooter');
    });

    it('should default hideFooter to false', () => {
      expect(layoutContent).toMatch(/hideFooter\s*[=:]?\s*false/);
    });
  });

  describe('Body Structure', () => {
    it('should have flex flex-col on body for sticky footer', () => {
      expect(layoutContent).toContain('min-h-screen');
      expect(layoutContent).toContain('flex flex-col');
    });

    it('should render Footer unless hideFooter is true', () => {
      expect(layoutContent).toContain('{!hideFooter && <Footer />}');
    });
  });

  describe('Conditional Rendering', () => {
    it('should use conditional rendering for hideFooter', () => {
      expect(layoutContent).toContain('hideFooter');
      expect(layoutContent).toContain('<Footer />');
    });
  });
});
