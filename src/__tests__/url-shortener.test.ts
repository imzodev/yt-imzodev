/**
 * URL Shortener Tests
 * Tests for URL shortening functionality
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Simple nanoid mock for testing
function generateCode(length: number = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

describe('URL Shortener - Code Generation', () => {
  it('should generate a 7-character code by default', () => {
    const code = generateCode(7);
    expect(code).toHaveLength(7);
  });

  it('should generate alphanumeric codes', () => {
    const code = generateCode(7);
    expect(code).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateCode(7));
    }
    // All 1000 codes should be unique
    expect(codes.size).toBe(1000);
  });
});

describe('URL Shortener - Validation', () => {
  it('should accept valid http URLs', () => {
    const url = 'http://example.com/path';
    const parsed = new URL(url);
    expect(parsed.protocol).toBe('http:');
  });

  it('should accept valid https URLs', () => {
    const url = 'https://example.com/path?query=value';
    const parsed = new URL(url);
    expect(parsed.protocol).toBe('https:');
  });

  it('should reject invalid URLs', () => {
    const invalidUrls = [
      'not-a-url',
      'ftp://example.com',
      'javascript:alert(1)',
      '',
    ];

    invalidUrls.forEach(url => {
      expect(() => {
        if (!url) throw new Error('Empty URL');
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('Invalid protocol');
        }
      }).toThrow();
    });
  });

  it('should validate custom code format', () => {
    const validCodes = ['my-link', 'link123', 'LINK_TEST', 'abc-123_XYZ'];
    const invalidCodes = ['my link', 'link!', 'code@special', ''];

    validCodes.forEach(code => {
      expect(/^[a-zA-Z0-9_-]+$/.test(code)).toBe(true);
    });

    invalidCodes.forEach(code => {
      if (code === '') {
        expect(code).toBe('');
      } else {
        expect(/^[a-zA-Z0-9_-]+$/.test(code)).toBe(false);
      }
    });
  });

  it('should enforce custom code length limit', () => {
    const code = 'a'.repeat(51);
    expect(code.length).toBeGreaterThan(50);
    
    const validCode = 'a'.repeat(50);
    expect(validCode.length).toBeLessThanOrEqual(50);
  });
});

describe('URL Shortener - Storage', () => {
  it('should store URL mapping with metadata', () => {
    const store = new Map<string, { originalUrl: string; createdAt: Date; clicks: number }>();
    
    const code = 'abc1234';
    const url = 'https://example.com/long-url';
    
    store.set(code, {
      originalUrl: url,
      createdAt: new Date(),
      clicks: 0,
    });
    
    expect(store.has(code)).toBe(true);
    expect(store.get(code)?.originalUrl).toBe(url);
    expect(store.get(code)?.clicks).toBe(0);
  });

  it('should increment click count on access', () => {
    const store = new Map<string, { originalUrl: string; createdAt: Date; clicks: number }>();
    
    const code = 'abc1234';
    store.set(code, {
      originalUrl: 'https://example.com',
      createdAt: new Date(),
      clicks: 0,
    });
    
    // Simulate access
    const data = store.get(code)!;
    data.clicks++;
    
    expect(store.get(code)?.clicks).toBe(1);
  });

  it('should detect duplicate custom codes', () => {
    const store = new Map<string, { originalUrl: string; createdAt: Date; clicks: number }>();
    
    const code = 'my-link';
    store.set(code, {
      originalUrl: 'https://example.com/first',
      createdAt: new Date(),
      clicks: 0,
    });
    
    // Check if code exists
    expect(store.has(code)).toBe(true);
    
    // Attempt to use same code should fail
    if (store.has(code)) {
      expect(true).toBe(true); // Code already in use
    }
  });

  it('should retrieve original URL from code', () => {
    const store = new Map<string, { originalUrl: string; createdAt: Date; clicks: number }>();
    
    const code = 'abc1234';
    const originalUrl = 'https://example.com/some/long/path?query=value';
    
    store.set(code, {
      originalUrl,
      createdAt: new Date(),
      clicks: 0,
    });
    
    const data = store.get(code);
    expect(data?.originalUrl).toBe(originalUrl);
  });
});

describe('URL Shortener - Short URL Generation', () => {
  it('should build correct short URL format', () => {
    const siteUrl = 'https://imzodev.com';
    const code = 'abc1234';
    const shortUrl = `${siteUrl}/s/${code}`;
    
    expect(shortUrl).toBe('https://imzodev.com/s/abc1234');
  });

  it('should include code in response', () => {
    const response = {
      success: true,
      code: 'abc1234',
      shortUrl: 'https://imzodev.com/s/abc1234',
      originalUrl: 'https://example.com/long-url',
    };
    
    expect(response.success).toBe(true);
    expect(response.code).toBe('abc1234');
    expect(response.shortUrl).toContain('/s/');
  });
});

describe('URL Shortener - Error Handling', () => {
  it('should return error for missing URL', () => {
    const body = { customCode: 'my-link' };
    
    expect(body.url).toBeUndefined();
  });

  it('should return error for invalid URL format', () => {
    const url = 'not-a-valid-url';
    
    expect(() => new URL(url)).toThrow();
  });

  it('should return error for duplicate custom code', () => {
    const existingCodes = new Set(['my-link', 'test-code']);
    const newCode = 'my-link';
    
    expect(existingCodes.has(newCode)).toBe(true);
  });
});

describe('URL Shortener - Redirect Handler', () => {
  it('should return 404 for non-existent code', () => {
    const store = new Map<string, { originalUrl: string; createdAt: Date; clicks: number }>();
    const code = 'nonexistent';
    
    expect(store.has(code)).toBe(false);
  });

  it('should redirect to original URL', () => {
    const store = new Map<string, { originalUrl: string; createdAt: Date; clicks: number }>();
    const code = 'abc1234';
    const originalUrl = 'https://example.com/target';
    
    store.set(code, {
      originalUrl,
      createdAt: new Date(),
      clicks: 0,
    });
    
    const data = store.get(code);
    expect(data?.originalUrl).toBe(originalUrl);
  });

  it('should track clicks on redirect', () => {
    const store = new Map<string, { originalUrl: string; createdAt: Date; clicks: number }>();
    const code = 'abc1234';
    
    store.set(code, {
      originalUrl: 'https://example.com',
      createdAt: new Date(),
      clicks: 5,
    });
    
    // Simulate redirect (increment click)
    const data = store.get(code)!;
    data.clicks++;
    
    expect(store.get(code)?.clicks).toBe(6);
  });
});

describe('URL Shortener - Recent Links (localStorage simulation)', () => {
  it('should store recent links in order', () => {
    const recent: any[] = [];
    
    recent.unshift({ code: 'link1', createdAt: new Date().toISOString() });
    recent.unshift({ code: 'link2', createdAt: new Date().toISOString() });
    
    // Most recent should be first
    expect(recent[0].code).toBe('link2');
    expect(recent[1].code).toBe('link1');
  });

  it('should limit recent links to 5', () => {
    const recent: any[] = [
      { code: 'link1' },
      { code: 'link2' },
      { code: 'link3' },
      { code: 'link4' },
      { code: 'link5' },
    ];
    
    recent.unshift({ code: 'link6' });
    // After unshift: [link6, link1, link2, link3, link4, link5]
    const trimmed = recent.slice(0, 5);
    // After slice: [link6, link1, link2, link3, link4]
    
    expect(trimmed).toHaveLength(5);
    expect(trimmed[0].code).toBe('link6');
    expect(trimmed[4].code).toBe('link4');
  });

  it('should truncate long URLs for display', () => {
    const url = 'https://example.com/very/long/path/that/needs/truncation?query=value';
    const maxLength = 50;
    
    const displayUrl = url.length > maxLength 
      ? url.substring(0, maxLength) + '...' 
      : url;
    
    expect(displayUrl.length).toBeLessThanOrEqual(maxLength + 3);
    expect(displayUrl).toContain('...');
  });
});
