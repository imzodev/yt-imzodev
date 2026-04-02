import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('LICENSE Configuration', () => {
  const licensePath = join(process.cwd(), 'LICENSE');
  const packageJsonPath = join(process.cwd(), 'package.json');

  let licenseContent: string;
  let packageJson: Record<string, unknown>;

  beforeAll(() => {
    if (existsSync(licensePath)) {
      licenseContent = readFileSync(licensePath, 'utf-8');
    }
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  });

  describe('LICENSE file', () => {
    it('should have LICENSE file in project root', () => {
      expect(existsSync(licensePath)).toBe(true);
    });

    it('should be a non-empty file', () => {
      expect(licenseContent?.length).toBeGreaterThan(0);
    });

    it('should contain MIT License text', () => {
      expect(licenseContent).toContain('MIT License');
    });

    it('should contain copyright notice', () => {
      expect(licenseContent).toContain('Copyright');
    });

    it('should have the current year (2026)', () => {
      expect(licenseContent).toContain('2026');
    });

    it('should reference the copyright holder (imzodev)', () => {
      expect(licenseContent).toContain('imzodev');
    });

    it('should contain permission notice', () => {
      expect(licenseContent).toContain('Permission is hereby granted');
    });

    it('should contain disclaimer', () => {
      expect(licenseContent).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
    });
  });

  describe('Package.json configuration', () => {
    it('should have license field', () => {
      expect(packageJson).toHaveProperty('license');
    });

    it('should specify MIT license', () => {
      expect(packageJson.license).toBe('MIT');
    });
  });

  describe('License text validity', () => {
    it('should include all required MIT license sections', () => {
      expect(licenseContent).toContain('Permission is hereby granted, free of charge');
      expect(licenseContent).toContain('without restriction');
      expect(licenseContent).toContain('copies of the Software');
      expect(licenseContent).toContain('subject to the following conditions');
    });

    it('should include warranty disclaimer', () => {
      expect(licenseContent).toContain('WITHOUT WARRANTY OF ANY KIND');
    });

    it('should include liability disclaimer', () => {
      // Handle line breaks by checking for key phrases
      expect(licenseContent).toContain('IN NO EVENT SHALL');
    });
  });
});
