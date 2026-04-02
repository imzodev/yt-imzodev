import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Test Coverage Configuration', () => {
  const vitestConfigPath = join(process.cwd(), 'vitest.config.ts');
  const packageJsonPath = join(process.cwd(), 'package.json');
  const gitignorePath = join(process.cwd(), '.gitignore');

  let vitestConfigContent: string;
  let packageJsonContent: string;
  let gitignoreContent: string;
  let packageJson: Record<string, unknown>;

  beforeAll(() => {
    vitestConfigContent = readFileSync(vitestConfigPath, 'utf-8');
    packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
    gitignoreContent = readFileSync(gitignorePath, 'utf-8');
  });

  describe('Vitest configuration', () => {
    it('should have vitest.config.ts file', () => {
      expect(existsSync(vitestConfigPath)).toBe(true);
    });

    it('should have coverage configuration', () => {
      expect(vitestConfigContent).toContain('coverage');
    });

    it('should specify v8 as coverage provider', () => {
      expect(vitestConfigContent).toContain("provider: 'v8'");
    });

    it('should have text reporter', () => {
      expect(vitestConfigContent).toContain("'text'");
    });

    it('should have json reporter', () => {
      expect(vitestConfigContent).toContain("'json'");
    });

    it('should have html reporter', () => {
      expect(vitestConfigContent).toContain("'html'");
    });

    it('should have lcov reporter for CI integration', () => {
      expect(vitestConfigContent).toContain("'lcov'");
    });

    it('should exclude node_modules from coverage', () => {
      expect(vitestConfigContent).toContain('node_modules');
    });

    it('should exclude dist from coverage', () => {
      expect(vitestConfigContent).toContain('dist');
    });

    it('should exclude config files from coverage', () => {
      expect(vitestConfigContent).toContain('config');
    });
  });

  describe('Package.json scripts', () => {
    it('should have test:coverage script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('test:coverage');
    });

    it('should run vitest with coverage flag', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts['test:coverage']).toContain('vitest');
      expect(scripts['test:coverage']).toContain('--coverage');
    });
  });

  describe('Package.json devDependencies', () => {
    it('should have @vitest/coverage-v8 as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('@vitest/coverage-v8');
    });

    it('should have vitest as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('vitest');
    });
  });

  describe('.gitignore configuration', () => {
    it('should ignore coverage directory', () => {
      expect(gitignoreContent).toContain('coverage/');
    });
  });
});
