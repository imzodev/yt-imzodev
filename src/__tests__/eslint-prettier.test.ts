import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('ESLint + Prettier Configuration', () => {
  const eslintConfigPath = join(process.cwd(), 'eslint.config.mjs');
  const prettierConfigPath = join(process.cwd(), '.prettierrc');
  const prettierIgnorePath = join(process.cwd(), '.prettierignore');
  const packageJsonPath = join(process.cwd(), 'package.json');

  let packageJsonContent: string;
  let packageJson: Record<string, unknown>;

  beforeAll(() => {
    packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  });

  describe('ESLint Configuration', () => {
    it('should have eslint.config.mjs file', () => {
      expect(existsSync(eslintConfigPath)).toBe(true);
    });

    it('should be a non-empty file', () => {
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should use flat config format (ESLint 9+)', () => {
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('export default');
    });

    it('should import typescript-eslint', () => {
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('typescript-eslint');
    });

    it('should import eslint-plugin-astro', () => {
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('eslint-plugin-astro');
    });

    it('should import eslint-config-prettier', () => {
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('eslint-config-prettier');
    });

    it('should configure ignore patterns', () => {
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('ignores');
      expect(content).toContain('dist/**');
      expect(content).toContain('node_modules/**');
    });

    it('should configure TypeScript rules', () => {
      const content = readFileSync(eslintConfigPath, 'utf-8');
      expect(content).toContain('@typescript-eslint/no-unused-vars');
    });
  });

  describe('Prettier Configuration', () => {
    it('should have .prettierrc file', () => {
      expect(existsSync(prettierConfigPath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const content = readFileSync(prettierConfigPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should configure semicolons', () => {
      const content = readFileSync(prettierConfigPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config).toHaveProperty('semi');
    });

    it('should configure single quotes', () => {
      const content = readFileSync(prettierConfigPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config).toHaveProperty('singleQuote');
    });

    it('should configure trailing commas', () => {
      const content = readFileSync(prettierConfigPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config).toHaveProperty('trailingComma');
    });

    it('should configure tab width', () => {
      const content = readFileSync(prettierConfigPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config).toHaveProperty('tabWidth');
    });

    it('should configure print width', () => {
      const content = readFileSync(prettierConfigPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config).toHaveProperty('printWidth');
    });

    it('should include prettier-plugin-astro', () => {
      const content = readFileSync(prettierConfigPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config.plugins).toContain('prettier-plugin-astro');
    });

    it('should have .prettierignore file', () => {
      expect(existsSync(prettierIgnorePath)).toBe(true);
    });

    it('should ignore dist directory', () => {
      const content = readFileSync(prettierIgnorePath, 'utf-8');
      expect(content).toContain('dist/');
    });

    it('should ignore node_modules directory', () => {
      const content = readFileSync(prettierIgnorePath, 'utf-8');
      expect(content).toContain('node_modules/');
    });
  });

  describe('Package.json scripts', () => {
    it('should have lint script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('lint');
      expect(scripts.lint).toContain('eslint');
    });

    it('should have lint:fix script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('lint:fix');
      expect(scripts['lint:fix']).toContain('--fix');
    });

    it('should have format script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('format');
      expect(scripts.format).toContain('prettier');
      expect(scripts.format).toContain('--write');
    });

    it('should have format:check script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('format:check');
      expect(scripts['format:check']).toContain('--check');
    });

    it('should have test:coverage script', () => {
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('test:coverage');
      expect(scripts['test:coverage']).toContain('--coverage');
    });
  });

  describe('Package.json devDependencies', () => {
    it('should have eslint as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('eslint');
    });

    it('should have @eslint/js as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('@eslint/js');
    });

    it('should have typescript-eslint as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('typescript-eslint');
    });

    it('should have eslint-plugin-astro as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('eslint-plugin-astro');
    });

    it('should have prettier as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('prettier');
    });

    it('should have eslint-config-prettier as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('eslint-config-prettier');
    });

    it('should have prettier-plugin-astro as devDependency', () => {
      const devDeps = packageJson.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('prettier-plugin-astro');
    });
  });
});

// Import for beforeAll
import { beforeAll } from 'vitest';
