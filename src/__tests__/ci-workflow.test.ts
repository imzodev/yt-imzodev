import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('CI Workflow', () => {
  const workflowPath = join(process.cwd(), '.github', 'workflows', 'ci.yml');
  let workflowContent: string;

  beforeAll(() => {
    if (!existsSync(workflowPath)) {
      throw new Error('CI workflow file not found at .github/workflows/ci.yml');
    }
    workflowContent = readFileSync(workflowPath, 'utf-8');
  });

  describe('File structure', () => {
    it('should have the ci.yml file in the correct location', () => {
      expect(existsSync(workflowPath)).toBe(true);
    });

    it('should be a non-empty file', () => {
      expect(workflowContent.length).toBeGreaterThan(0);
    });
  });

  describe('Workflow triggers', () => {
    it('should trigger on push to main branch', () => {
      expect(workflowContent).toContain('push:');
      expect(workflowContent).toContain('branches: [main]');
    });

    it('should trigger on pull requests to main branch', () => {
      expect(workflowContent).toContain('pull_request:');
    });
  });

  describe('Check job', () => {
    it('should have a check job for type checking and building', () => {
      expect(workflowContent).toContain('check:');
      expect(workflowContent).toContain('Type Check & Build');
    });

    it('should checkout code', () => {
      expect(workflowContent).toContain('actions/checkout@v4');
    });

    it('should setup Bun', () => {
      expect(workflowContent).toContain('oven-sh/setup-bun@v2');
      expect(workflowContent).toContain("bun-version: '1.2.0'");
    });

    it('should install dependencies with frozen lockfile', () => {
      expect(workflowContent).toContain('bun install --frozen-lockfile');
    });

    it('should run astro check for type checking', () => {
      expect(workflowContent).toContain('astro check');
    });

    it('should run build', () => {
      expect(workflowContent).toContain('bun run build');
    });
  });

  describe('Test job', () => {
    it('should have a test job', () => {
      expect(workflowContent).toContain('test:');
      expect(workflowContent).toContain('name: Tests');
    });

    it('should run tests', () => {
      expect(workflowContent).toContain('bun run test');
    });

    it('should run coverage on push events', () => {
      expect(workflowContent).toContain('--coverage');
      expect(workflowContent).toContain("github.event_name == 'push'");
    });

    it('should upload coverage artifact', () => {
      expect(workflowContent).toContain('actions/upload-artifact@v4');
      expect(workflowContent).toContain('name: coverage');
      expect(workflowContent).toContain('path: coverage/');
    });
  });

  describe('Best practices', () => {
    it('should use ubuntu-latest as runner', () => {
      expect(workflowContent).toContain('runs-on: ubuntu-latest');
    });

    it('should use latest action versions', () => {
      expect(workflowContent).toContain('actions/checkout@v4');
      expect(workflowContent).toContain('oven-sh/setup-bun@v2');
      expect(workflowContent).toContain('actions/upload-artifact@v4');
    });

    it('should have proper job names', () => {
      expect(workflowContent).toContain('name: Type Check & Build');
      expect(workflowContent).toContain('name: Tests');
    });

    it('should set coverage retention period', () => {
      expect(workflowContent).toContain('retention-days:');
    });
  });
});

describe('Package Manager Standardization', () => {
  const gitignorePath = join(process.cwd(), '.gitignore');
  const packageJsonPath = join(process.cwd(), 'package.json');
  let gitignoreContent: string;
  let packageJsonContent: string;

  beforeAll(() => {
    gitignoreContent = readFileSync(gitignorePath, 'utf-8');
    packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
  });

  describe('Lock file exclusions', () => {
    it('should ignore package-lock.json', () => {
      expect(gitignoreContent).toContain('package-lock.json');
    });

    it('should ignore pnpm-lock.yaml', () => {
      expect(gitignoreContent).toContain('pnpm-lock.yaml');
    });

    it('should ignore yarn.lock', () => {
      expect(gitignoreContent).toContain('yarn.lock');
    });
  });

  describe('Conflicting lock files removed', () => {
    it('should not have package-lock.json', () => {
      expect(existsSync(join(process.cwd(), 'package-lock.json'))).toBe(false);
    });

    it('should not have pnpm-lock.yaml', () => {
      expect(existsSync(join(process.cwd(), 'pnpm-lock.yaml'))).toBe(false);
    });

    it('should have bun.lockb', () => {
      expect(existsSync(join(process.cwd(), 'bun.lockb'))).toBe(true);
    });
  });

  describe('package.json configuration', () => {
    it('should have packageManager field', () => {
      expect(packageJsonContent).toContain('"packageManager"');
    });

    it('should specify bun as package manager', () => {
      expect(packageJsonContent).toContain('bun@');
    });
  });
});

// Import for beforeAll
import { beforeAll } from 'vitest';
