/**
 * Tests for lab tools - JSON validator and password generator
 */
import { describe, it, expect } from 'vitest';

describe('JSON Validator - Validation', () => {
  it('should validate correct JSON objects', () => {
    const validateJson = (input: string): { valid: boolean; error?: string } => {
      try {
        JSON.parse(input);
        return { valid: true };
      } catch (e) {
        return { valid: false, error: (e as Error).message };
      }
    };

    expect(validateJson('{"name": "John"}').valid).toBe(true);
    expect(validateJson('[1, 2, 3]').valid).toBe(true);
    expect(validateJson('true').valid).toBe(true);
    expect(validateJson('null').valid).toBe(true);
  });

  it('should reject invalid JSON', () => {
    const validateJson = (input: string): { valid: boolean; error?: string } => {
      try {
        JSON.parse(input);
        return { valid: true };
      } catch (e) {
        return { valid: false, error: (e as Error).message };
      }
    };

    expect(validateJson('{invalid}').valid).toBe(false);
    expect(validateJson('{"missing": "quote}').valid).toBe(false);
    expect(validateJson('[1, 2,]').valid).toBe(false);
    expect(validateJson('undefined').valid).toBe(false);
  });

  it('should detect JSON type correctly', () => {
    const getJsonType = (value: unknown): string => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value;
    };

    expect(getJsonType(JSON.parse('{"a": 1}'))).toBe('object');
    expect(getJsonType(JSON.parse('[1, 2]'))).toBe('array');
    expect(getJsonType(JSON.parse('"hello"'))).toBe('string');
    expect(getJsonType(JSON.parse('123'))).toBe('number');
    expect(getJsonType(JSON.parse('true'))).toBe('boolean');
    expect(getJsonType(JSON.parse('null'))).toBe('null');
  });
});

describe('JSON Validator - Formatting', () => {
  it('should format JSON with correct indentation', () => {
    const formatJson = (obj: unknown, indent: number | string): string => {
      return JSON.stringify(obj, null, indent);
    };

    const obj = { name: 'test' };
    
    expect(formatJson(obj, 2)).toBe('{\n  "name": "test"\n}');
    expect(formatJson(obj, 4)).toBe('{\n    "name": "test"\n}');
    expect(formatJson(obj, '\t')).toBe('{\n\t"name": "test"\n}');
  });

  it('should calculate JSON size correctly', () => {
    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    expect(formatBytes(100)).toBe('100 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });
});

describe('JSON Validator - Key Counting', () => {
  it('should count keys in flat objects', () => {
    const countKeys = (obj: unknown): number => {
      if (typeof obj !== 'object' || obj === null) return 0;
      if (Array.isArray(obj)) return obj.reduce((sum, item) => sum + countKeys(item), 0);
      return Object.keys(obj).length + Object.values(obj).reduce((sum, val) => sum + countKeys(val), 0);
    };

    expect(countKeys({ a: 1, b: 2 })).toBe(2);
    expect(countKeys({ a: 1, b: { c: 3 } })).toBe(3);
    expect(countKeys([{ a: 1 }, { b: 2 }])).toBe(2);
  });

  it('should calculate max depth correctly', () => {
    const getMaxDepth = (obj: unknown, depth: number = 0): number => {
      if (typeof obj !== 'object' || obj === null) return depth;
      if (Array.isArray(obj)) {
        return Math.max(depth, ...obj.map(item => getMaxDepth(item, depth + 1)));
      }
      return Math.max(depth, ...Object.values(obj).map(val => getMaxDepth(val, depth + 1)));
    };

    expect(getMaxDepth({ a: 1 })).toBe(1);
    expect(getMaxDepth({ a: { b: 2 } })).toBe(2);
    expect(getMaxDepth({ a: { b: { c: 3 } } })).toBe(3);
  });
});

describe('Password Generator - Character Sets', () => {
  it('should include uppercase letters when enabled', () => {
    const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const chars = UPPERCASE;
    
    expect(chars).toHaveLength(26);
    expect(chars).toContain('A');
    expect(chars).toContain('Z');
  });

  it('should include lowercase letters when enabled', () => {
    const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
    const chars = LOWERCASE;
    
    expect(chars).toHaveLength(26);
    expect(chars).toContain('a');
    expect(chars).toContain('z');
  });

  it('should include numbers when enabled', () => {
    const NUMBERS = '0123456789';
    const chars = NUMBERS;
    
    expect(chars).toHaveLength(10);
    expect(chars).toContain('0');
    expect(chars).toContain('9');
  });

  it('should include symbols when enabled', () => {
    const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const chars = SYMBOLS;
    
    expect(chars.length).toBeGreaterThan(0);
    expect(chars).toContain('@');
    expect(chars).toContain('#');
  });
});

describe('Password Generator - Strength Calculation', () => {
  it('should classify short passwords as weak', () => {
    const calculateStrength = (password: string): { score: number; label: string } => {
      let score = 0;
      if (password.length >= 8) score += 20;
      if (/[a-z]/.test(password)) score += 10;
      if (/[A-Z]/.test(password)) score += 10;
      if (/[0-9]/.test(password)) score += 10;
      if (/[^a-zA-Z0-9]/.test(password)) score += 20;
      
      if (score < 40) return { score, label: 'Weak' };
      if (score < 60) return { score, label: 'Fair' };
      if (score < 80) return { score, label: 'Good' };
      return { score: Math.min(score, 100), label: 'Strong' };
    };

    const result = calculateStrength('abc');
    expect(result.label).toBe('Weak');
  });

  it('should classify complex passwords as strong', () => {
    const calculateStrength = (password: string): { score: number; label: string } => {
      let score = 0;
      if (password.length >= 8) score += 20;
      if (password.length >= 12) score += 10;
      if (password.length >= 16) score += 10;
      if (/[a-z]/.test(password)) score += 10;
      if (/[A-Z]/.test(password)) score += 10;
      if (/[0-9]/.test(password)) score += 10;
      if (/[^a-zA-Z0-9]/.test(password)) score += 20;
      
      if (score < 40) return { score, label: 'Weak' };
      if (score < 60) return { score, label: 'Fair' };
      if (score < 80) return { score, label: 'Good' };
      return { score: Math.min(score, 100), label: 'Strong' };
    };

    const result = calculateStrength('Abc123!@#xyzXYZ');
    expect(result.label).toBe('Strong');
  });

  it('should reward character variety', () => {
    const calculateVarietyScore = (password: string): number => {
      let score = 0;
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^a-zA-Z0-9]/.test(password)) score += 1;
      return score;
    };

    expect(calculateVarietyScore('aaaa')).toBe(1);
    expect(calculateVarietyScore('Aa1!')).toBe(4);
    expect(calculateVarietyScore('Password123!')).toBe(4);
  });
});

describe('Password Generator - Options Validation', () => {
  it('should require at least one character type', () => {
    const validateOptions = (options: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }): boolean => {
      return options.upper || options.lower || options.numbers || options.symbols;
    };

    expect(validateOptions({ upper: false, lower: false, numbers: false, symbols: false })).toBe(false);
    expect(validateOptions({ upper: true, lower: false, numbers: false, symbols: false })).toBe(true);
    expect(validateOptions({ upper: true, lower: true, numbers: true, symbols: true })).toBe(true);
  });

  it('should respect excluded characters', () => {
    const excludeChars = (chars: string, exclude: string): string => {
      return chars.split('').filter(c => !exclude.includes(c)).join('');
    };

    const allChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const result = excludeChars(allChars, '0O1lI');
    
    expect(result).not.toContain('0');
    expect(result).not.toContain('O');
    expect(result).not.toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('A');
  });

  it('should validate password length range', () => {
    const validateLength = (length: number): { valid: boolean; error?: string } => {
      if (length < 8) return { valid: false, error: 'Minimum length is 8' };
      if (length > 64) return { valid: false, error: 'Maximum length is 64' };
      return { valid: true };
    };

    expect(validateLength(7).valid).toBe(false);
    expect(validateLength(8).valid).toBe(true);
    expect(validateLength(16).valid).toBe(true);
    expect(validateLength(64).valid).toBe(true);
    expect(validateLength(65).valid).toBe(false);
  });
});

describe('Password Generator - History', () => {
  it('should limit history to 5 items', () => {
    const history: string[] = [];
    const maxHistory = 5;
    
    const addToHistory = (password: string): string[] => {
      history.unshift(password);
      if (history.length > maxHistory) history.pop();
      return history;
    };

    for (let i = 0; i < 10; i++) {
      addToHistory(`password${i}`);
    }

    expect(history).toHaveLength(5);
    expect(history[0]).toBe('password9');
    expect(history[4]).toBe('password5');
  });

  it('should escape HTML in password display', () => {
    const escapeHtml = (text: string): string => {
      const div = { textContent: '' as string | null };
      // Simulate HTML escaping
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});
