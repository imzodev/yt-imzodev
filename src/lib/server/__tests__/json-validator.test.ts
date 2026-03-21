/**
 * Tests for JSON Validator lab tool functionality
 */
import { describe, it, expect } from 'vitest';

describe('JSON Validator', () => {
  // Validation logic
  function validateJson(input: string): { valid: boolean; error?: string; parsed?: unknown } {
    try {
      const parsed = JSON.parse(input);
      return { valid: true, parsed };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }

  // Format logic
  function formatJson(input: unknown, indent: number | string = 2): string {
    return JSON.stringify(input, null, indent);
  }

  // Size calculation
  function calculateSize(input: string): number {
    return new Blob([input]).size;
  }

  // JSON type detection
  function getJsonType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  // Key counting
  function countKeys(obj: unknown): number {
    if (typeof obj !== 'object' || obj === null) return 0;
    
    let count = 0;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        count += countKeys(item);
      }
    } else {
      count = Object.keys(obj).length;
      for (const value of Object.values(obj)) {
        count += countKeys(value);
      }
    }
    return count;
  }

  // Depth calculation
  function calculateDepth(obj: unknown, currentDepth: number = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    const values = Array.isArray(obj) ? obj : Object.values(obj);
    
    for (const value of values) {
      const depth = calculateDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  describe('JSON Validation', () => {
    it('should validate simple object', () => {
      const result = validateJson('{"name": "John", "age": 30}');
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({ name: 'John', age: 30 });
    });

    it('should validate array', () => {
      const result = validateJson('[1, 2, 3]');
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual([1, 2, 3]);
    });

    it('should validate nested object', () => {
      const result = validateJson('{"user": {"name": "Alice"}}');
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({ user: { name: 'Alice' } });
    });

    it('should reject invalid JSON - missing quote', () => {
      const result = validateJson('{"name: "John"}');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid JSON - trailing comma', () => {
      const result = validateJson('{"name": "John",}');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate null value', () => {
      const result = validateJson('null');
      expect(result.valid).toBe(true);
      expect(result.parsed).toBe(null);
    });

    it('should validate boolean values', () => {
      expect(validateJson('true').valid).toBe(true);
      expect(validateJson('false').valid).toBe(true);
    });

    it('should validate number values', () => {
      expect(validateJson('42').valid).toBe(true);
      expect(validateJson('-3.14').valid).toBe(true);
      expect(validateJson('1e10').valid).toBe(true);
    });

    it('should validate string values', () => {
      const result = validateJson('"hello world"');
      expect(result.valid).toBe(true);
      expect(result.parsed).toBe('hello world');
    });
  });

  describe('JSON Formatting', () => {
    it('should format with 2-space indent', () => {
      const obj = { name: 'John' };
      const formatted = formatJson(obj, 2);
      expect(formatted).toContain('  "name"');
    });

    it('should format with 4-space indent', () => {
      const obj = { name: 'John' };
      const formatted = formatJson(obj, 4);
      expect(formatted).toContain('    "name"');
    });

    it('should format with tab indent', () => {
      const obj = { name: 'John' };
      const formatted = formatJson(obj, '\t');
      expect(formatted).toContain('\t"name"');
    });

    it('should format arrays correctly', () => {
      const arr = [1, 2, 3];
      const formatted = formatJson(arr, 2);
      expect(formatted).toContain('[');
      expect(formatted).toContain(']');
    });
  });

  describe('Size Calculation', () => {
    it('should calculate size of simple object', () => {
      const json = '{"name":"John"}';
      const size = calculateSize(json);
      expect(size).toBe(15);
    });

    it('should calculate size of larger object', () => {
      const json = '{"name":"John","age":30,"active":true}';
      const size = calculateSize(json);
      expect(size).toBe(38);
    });
  });

  describe('JSON Type Detection', () => {
    it('should detect object type', () => {
      expect(getJsonType({})).toBe('object');
    });

    it('should detect array type', () => {
      expect(getJsonType([])).toBe('array');
    });

    it('should detect string type', () => {
      expect(getJsonType('hello')).toBe('string');
    });

    it('should detect number type', () => {
      expect(getJsonType(42)).toBe('number');
    });

    it('should detect boolean type', () => {
      expect(getJsonType(true)).toBe('boolean');
    });

    it('should detect null type', () => {
      expect(getJsonType(null)).toBe('null');
    });
  });

  describe('Key Counting', () => {
    it('should count keys in simple object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(countKeys(obj)).toBe(3);
    });

    it('should count keys in nested object', () => {
      const obj = { a: 1, b: { c: 2, d: 3 } };
      expect(countKeys(obj)).toBe(4); // a, b, c, d
    });

    it('should count keys in array', () => {
      const arr = [{ a: 1 }, { b: 2 }];
      expect(countKeys(arr)).toBe(2);
    });

    it('should return 0 for primitives', () => {
      expect(countKeys(null)).toBe(0);
      expect(countKeys('string')).toBe(0);
      expect(countKeys(42)).toBe(0);
    });
  });

  describe('Depth Calculation', () => {
    it('should calculate depth of simple object', () => {
      const obj = { a: 1 };
      expect(calculateDepth(obj)).toBe(1);
    });

    it('should calculate depth of nested object', () => {
      const obj = { a: { b: { c: 1 } } };
      expect(calculateDepth(obj)).toBe(3);
    });

    it('should calculate depth of array', () => {
      const arr = [[1, 2], [3, 4]];
      expect(calculateDepth(arr)).toBe(2);
    });

    it('should return 0 for primitives', () => {
      expect(calculateDepth(null)).toBe(0);
      expect(calculateDepth('string')).toBe(0);
      expect(calculateDepth(42)).toBe(0);
    });
  });

  describe('Empty Input Handling', () => {
    it('should handle empty string', () => {
      const result = validateJson('');
      expect(result.valid).toBe(false);
    });

    it('should handle whitespace only', () => {
      const result = validateJson('   ');
      expect(result.valid).toBe(false);
    });
  });
});
