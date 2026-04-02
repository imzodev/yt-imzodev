import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Migration System Configuration', () => {
  const projectRoot = process.cwd();
  const drizzleConfigPath = join(projectRoot, 'drizzle.config.ts');
  const drizzleDir = join(projectRoot, 'drizzle');
  const drizzleMetaDir = join(projectRoot, 'drizzle/meta');
  const packageJsonPath = join(projectRoot, 'package.json');

  let packageJson: Record<string, unknown>;
  let packageJsonContent: string;

  beforeAll(() => {
    packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  });

  describe('Drizzle configuration', () => {
    it('should have drizzle.config.ts file', () => {
      expect(existsSync(drizzleConfigPath)).toBe(true);
    });

    it('should have drizzle directory', () => {
      expect(existsSync(drizzleDir)).toBe(true);
    });

    it('should have drizzle migrations', () => {
      const files = readdirSync(drizzleDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));
      expect(sqlFiles.length).toBeGreaterThan(0);
    });

    it('should have drizzle meta directory', () => {
      expect(existsSync(drizzleMetaDir)).toBe(true);
    });

    it('should have meta journal file', () => {
      const journalPath = join(drizzleMetaDir, '_journal.json');
      expect(existsSync(journalPath)).toBe(true);
    });
  });

  describe('Package.json scripts', () => {
    it('should have db:generate script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('db:generate');
      expect(scripts['db:generate']).toContain('drizzle-kit');
    });

    it('should have db:migrate script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('db:migrate');
      expect(scripts['db:migrate']).toContain('drizzle-kit');
    });

    it('should have db:studio script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('db:studio');
      expect(scripts['db:studio']).toContain('drizzle-kit');
    });

    it('should not have supabase-specific db scripts', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      // These scripts referenced the removed supabase directory
      expect(scripts).not.toHaveProperty('db:push');
      expect(scripts).not.toHaveProperty('db:reset');
      expect(scripts).not.toHaveProperty('db:start');
    });
  });

  describe('Migration system clarity', () => {
    it('should have drizzle-kit as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('drizzle-kit');
    });

    it('should have drizzle-orm as dependency', () => {
      const deps = packageJson.dependencies as Record<string, string>;
      expect(deps).toHaveProperty('drizzle-orm');
    });

    it('should use drizzle as the migration output directory', () => {
      const drizzleConfig = readFileSync(drizzleConfigPath, 'utf-8');
      expect(drizzleConfig).toContain("out: './drizzle'");
    });
  });
});
