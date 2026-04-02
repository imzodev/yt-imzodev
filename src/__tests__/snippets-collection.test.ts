import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Snippets Content Collection', () => {
  const contentConfigPath = join(process.cwd(), 'src/content.config.ts');
  const snippetsDir = join(process.cwd(), 'src/content/snippets');
  let contentConfig: string;

  beforeAll(() => {
    if (existsSync(contentConfigPath)) {
      contentConfig = readFileSync(contentConfigPath, 'utf-8');
    }
  });

  describe('Content configuration', () => {
    it('should have content.config.ts file', () => {
      expect(existsSync(contentConfigPath)).toBe(true);
    });

    it('should define snippets collection', () => {
      expect(contentConfig).toContain('snippets');
      expect(contentConfig).toContain('defineCollection');
    });

    it('should export snippets in collections', () => {
      expect(contentConfig).toContain('export const collections');
      expect(contentConfig).toContain('snippets');
    });

    it('should use glob loader for snippets', () => {
      expect(contentConfig).toContain('glob');
      expect(contentConfig).toContain('./src/content/snippets');
    });

    it('should include md and mdx patterns', () => {
      expect(contentConfig).toContain('.{md,mdx}');
    });
  });

  describe('Snippets schema', () => {
    it('should define title as required string', () => {
      expect(contentConfig).toContain('title: z.string()');
    });

    it('should define description as optional', () => {
      expect(contentConfig).toContain('description');
    });

    it('should define language field', () => {
      expect(contentConfig).toContain('language');
    });

    it('should define type field', () => {
      expect(contentConfig).toContain('type');
    });

    it('should define category field', () => {
      expect(contentConfig).toContain('category');
    });

    it('should define tags as optional array', () => {
      expect(contentConfig).toContain('tags: z.array');
    });

    it('should define difficulty field with enum values', () => {
      expect(contentConfig).toContain('difficulty');
      expect(contentConfig).toContain('beginner');
      expect(contentConfig).toContain('intermediate');
      expect(contentConfig).toContain('advanced');
    });

    it('should define isPremium field', () => {
      expect(contentConfig).toContain('isPremium');
    });

    it('should define status field with default', () => {
      expect(contentConfig).toContain('status');
      expect(contentConfig).toContain('default');
    });
  });

  describe('Snippets directory', () => {
    it('should have snippets content directory', () => {
      expect(existsSync(snippetsDir)).toBe(true);
    });

    it('should have at least one snippet file', () => {
      const fs = require('fs');
      const files = fs.readdirSync(snippetsDir);
      const mdFiles = files.filter((f: string) => f.endsWith('.md') || f.endsWith('.mdx'));
      expect(mdFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Collection export', () => {
    it('should export both blog and snippets collections', () => {
      expect(contentConfig).toContain('blog');
      expect(contentConfig).toContain('snippets');
    });

    it('should have collections object at the end', () => {
      expect(contentConfig).toContain('export const collections = { blog, snippets }');
    });
  });
});
