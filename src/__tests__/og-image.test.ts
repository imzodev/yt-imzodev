import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

describe('Open Graph Image', () => {
  const ogImagePath = join(process.cwd(), 'public/images/og-default.svg');
  const layoutPath = join(process.cwd(), 'src/layouts/Layout.astro');
  
  let ogImageContent: string;
  let layoutContent: string;

  beforeAll(() => {
    if (existsSync(ogImagePath)) {
      ogImageContent = readFileSync(ogImagePath, 'utf-8');
    }
    if (existsSync(layoutPath)) {
      layoutContent = readFileSync(layoutPath, 'utf-8');
    }
  });

  describe('OG Image File', () => {
    it('should have the og-default.svg file in public/images', () => {
      expect(existsSync(ogImagePath)).toBe(true);
    });

    it('should be a non-empty file', () => {
      expect(ogImageContent?.length).toBeGreaterThan(0);
    });

    it('should be an SVG file with proper XML structure', () => {
      expect(ogImageContent).toContain('<svg');
      expect(ogImageContent).toContain('</svg>');
      expect(ogImageContent).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should have standard OG image dimensions (1200x630)', () => {
      expect(ogImageContent).toContain('width="1200"');
      expect(ogImageContent).toContain('height="630"');
    });

    it('should contain the imzodev brand name', () => {
      expect(ogImageContent).toContain('imzodev');
    });

    it('should contain the tagline', () => {
      expect(ogImageContent).toContain('AI');
      expect(ogImageContent).toContain('Software Development');
    });

    it('should have a viewBox attribute for scalability', () => {
      expect(ogImageContent).toContain('viewBox');
    });
  });

  describe('Layout.astro fallback', () => {
    it('should have Layout.astro file', () => {
      expect(existsSync(layoutPath)).toBe(true);
    });

    it('should reference the default OG image when no custom image is provided', () => {
      expect(layoutContent).toContain('/images/og-default.svg');
    });

    it('should use the default OG image as a fallback', () => {
      // Check for the ternary operator pattern that uses the default
      expect(layoutContent).toContain('resolvedImage');
      expect(layoutContent).toContain('new URL');
    });
  });

  describe('Meta tags configuration', () => {
    it('should have og:image meta tag', () => {
      expect(layoutContent).toContain('og:image');
    });

    it('should have twitter:card meta tag', () => {
      expect(layoutContent).toContain('twitter:card');
    });

    it('should have twitter:image meta tag', () => {
      expect(layoutContent).toContain('twitter:image');
    });

    it('should use summary_large_image for twitter:card when image is present', () => {
      expect(layoutContent).toContain('summary_large_image');
    });
  });

  describe('File size', () => {
    it('should be a reasonable file size for an OG image (< 500KB)', () => {
      if (existsSync(ogImagePath)) {
        const stats = statSync(ogImagePath);
        const sizeKB = stats.size / 1024;
        expect(sizeKB).toBeLessThan(500);
      }
    });
  });
});

// Import for beforeAll
import { beforeAll } from 'vitest';
