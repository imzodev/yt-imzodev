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

    it('should setup Node.js', () => {
      expect(workflowContent).toContain('actions/setup-node@v4');
      expect(workflowContent).toContain("node-version: '24'");
    });

    it('should setup pnpm', () => {
      expect(workflowContent).toContain('pnpm/action-setup@v4');
      expect(workflowContent).toContain('version: 9');
    });

    it('should install dependencies with frozen lockfile', () => {
      expect(workflowContent).toContain('pnpm install --frozen-lockfile');
    });

    it('should run astro check for type checking', () => {
      expect(workflowContent).toContain('astro check');
    });

    it('should run build', () => {
      expect(workflowContent).toContain('pnpm build');
    });
  });

  describe('Test job', () => {
    it('should have a test job', () => {
      expect(workflowContent).toContain('test:');
      expect(workflowContent).toContain('name: Tests');
    });

    it('should run tests', () => {
      expect(workflowContent).toContain('pnpm test');
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

    it('should use latest action versions (v4)', () => {
      // All major actions should be on v4
      const v4Actions = [
        'actions/checkout@v4',
        'actions/setup-node@v4',
        'pnpm/action-setup@v4',
        'actions/upload-artifact@v4',
      ];
      v4Actions.forEach(action => {
        expect(workflowContent).toContain(action);
      });
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

// Import for beforeAll
import { beforeAll } from 'vitest';
