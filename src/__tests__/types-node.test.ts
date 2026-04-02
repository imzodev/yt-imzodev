import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('@types/node Configuration', () => {
  const packageJsonPath = join(process.cwd(), 'package.json');
  let packageJson: Record<string, unknown>;

  beforeAll(() => {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  });

  describe('Package.json devDependencies', () => {
    it('should have @types/node as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('@types/node');
    });

    it('should have a valid version for @types/node', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      const version = devDeps['@types/node'];
      expect(version).toBeDefined();
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('TypeScript configuration', () => {
    it('should have typescript as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('typescript');
    });

    it('should have tsconfig.json file', () => {
      const tsconfigPath = join(process.cwd(), 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
    });
  });

  describe('Environment variable usage', () => {
    it('should have dotenv dependency for env loading', () => {
      const deps = packageJson.dependencies as Record<string, string>;
      expect(deps).toHaveProperty('dotenv');
    });

    it('should have drizzle.config.ts that uses process.env', () => {
      const drizzleConfigPath = join(process.cwd(), 'drizzle.config.ts');
      if (existsSync(drizzleConfigPath)) {
        const content = readFileSync(drizzleConfigPath, 'utf-8');
        expect(content).toContain('process.env');
      }
    });
  });
});
