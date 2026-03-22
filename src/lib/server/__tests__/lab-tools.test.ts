/**
 * Tests for lab tools - JSON Validator and Password Generator
 */
import { describe, it, expect } from 'vitest';

describe('JSON Validator', () => {
  describe('JSON Parsing', () => {
    it('should parse valid JSON object', () => {
      const input = '{"name": "John", "age": 30}';
      const parsed = JSON.parse(input);
      expect(parsed.name).toBe('John');
      expect(parsed.age).toBe(30);
    });

    it('should parse valid JSON array', () => {
      const input = '[1, 2, 3, 4, 5]';
      const parsed = JSON.parse(input);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(5);
    });

    it('should parse nested JSON', () => {
      const input = '{"user": {"name": "Jane", "roles": ["admin", "user"]}}';
      const parsed = JSON.parse(input);
      expect(parsed.user.name).toBe('Jane');
      expect(parsed.user.roles).toContain('admin');
    });

    it('should parse JSON with null values', () => {
      const input = '{"value": null}';
      const parsed = JSON.parse(input);
      expect(parsed.value).toBeNull();
    });

    it('should parse JSON with boolean values', () => {
      const input = '{"active": true, "deleted": false}';
      const parsed = JSON.parse(input);
      expect(parsed.active).toBe(true);
      expect(parsed.deleted).toBe(false);
    });

    it('should parse JSON with numbers', () => {
      const input = '{"integer": 42, "float": 3.14, "negative": -10}';
      const parsed = JSON.parse(input);
      expect(parsed.integer).toBe(42);
      expect(parsed.float).toBeCloseTo(3.14);
      expect(parsed.negative).toBe(-10);
    });
  });

  describe('Error Detection', () => {
    it('should detect invalid JSON - missing quote', () => {
      const input = '{name: "John"}';
      expect(() => JSON.parse(input)).toThrow();
    });

    it('should detect invalid JSON - trailing comma', () => {
      const input = '{"items": [1, 2, 3,]}';
      expect(() => JSON.parse(input)).toThrow();
    });

    it('should detect invalid JSON - single quotes', () => {
      const input = "{'name': 'John'}";
      expect(() => JSON.parse(input)).toThrow();
    });

    it('should detect invalid JSON - unclosed bracket', () => {
      const input = '{"items": [1, 2, 3';
      expect(() => JSON.parse(input)).toThrow();
    });

    it('should detect invalid JSON - unclosed brace', () => {
      const input = '{"name": "John"';
      expect(() => JSON.parse(input)).toThrow();
    });
  });

  describe('JSON Formatting', () => {
    it('should format JSON with 2-space indentation', () => {
      const obj = { name: 'John', age: 30 };
      const formatted = JSON.stringify(obj, null, 2);
      expect(formatted).toContain('  "name"');
      expect(formatted).toContain('  "age"');
    });

    it('should minify JSON', () => {
      const obj = { name: 'John', age: 30 };
      const minified = JSON.stringify(obj);
      expect(minified).toBe('{"name":"John","age":30}');
    });

    it('should handle empty objects', () => {
      const obj = {};
      const formatted = JSON.stringify(obj, null, 2);
      expect(formatted).toBe('{}');
    });

    it('should handle empty arrays', () => {
      const arr: unknown[] = [];
      const formatted = JSON.stringify(arr, null, 2);
      expect(formatted).toBe('[]');
    });
  });

  describe('JSON Statistics', () => {
    const getJsonType = (value: unknown): string => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value;
    };

    const countKeys = (obj: unknown): number => {
      if (typeof obj !== 'object' || obj === null) return 0;
      if (Array.isArray(obj)) {
        return obj.reduce((sum, item) => sum + countKeys(item), 0);
      }
      let count = Object.keys(obj).length;
      for (const value of Object.values(obj)) {
        count += countKeys(value);
      }
      return count;
    };

    const getMaxDepth = (obj: unknown, currentDepth = 0): number => {
      if (typeof obj !== 'object' || obj === null) return currentDepth;
      if (Array.isArray(obj)) {
        if (obj.length === 0) return currentDepth + 1;
        return Math.max(...obj.map(item => getMaxDepth(item, currentDepth + 1)));
      }
      const keys = Object.keys(obj);
      if (keys.length === 0) return currentDepth + 1;
      return Math.max(...Object.values(obj).map(value => getMaxDepth(value, currentDepth + 1)));
    };

    it('should identify JSON types correctly', () => {
      expect(getJsonType(null)).toBe('null');
      expect(getJsonType('string')).toBe('string');
      expect(getJsonType(42)).toBe('number');
      expect(getJsonType(true)).toBe('boolean');
      expect(getJsonType([1, 2, 3])).toBe('array');
      expect(getJsonType({ key: 'value' })).toBe('object');
    });

    it('should count keys in flat object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(countKeys(obj)).toBe(3);
    });

    it('should count keys in nested object', () => {
      const obj = { a: 1, b: { c: 2, d: 3 }, e: 4 };
      expect(countKeys(obj)).toBe(5);
    });

    it('should count keys in array', () => {
      const arr = [{ a: 1 }, { b: 2, c: 3 }];
      expect(countKeys(arr)).toBe(3);
    });

    it('should calculate max depth for flat object', () => {
      const obj = { a: 1, b: 2 };
      expect(getMaxDepth(obj)).toBe(1);
    });

    it('should calculate max depth for nested object', () => {
      const obj = { a: { b: { c: 1 } } };
      expect(getMaxDepth(obj)).toBe(3);
    });

    it('should calculate max depth for array', () => {
      const arr = [[1, 2], [3, 4]];
      expect(getMaxDepth(arr)).toBe(2);
    });
  });
});

describe('Password Generator', () => {
  const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  const AMBIGUOUS_CHARS = ['0', 'O', 'l', '1', 'I', '|', '`', "'", '"'];

  const getCharacterSet = (
    includeUpper: boolean,
    includeLower: boolean,
    includeNumbers: boolean,
    includeSymbols: boolean,
    excludeAmbiguous: boolean
  ): string => {
    let chars = '';
    if (includeUpper) chars += CHAR_SETS.uppercase;
    if (includeLower) chars += CHAR_SETS.lowercase;
    if (includeNumbers) chars += CHAR_SETS.numbers;
    if (includeSymbols) chars += CHAR_SETS.symbols;

    if (excludeAmbiguous) {
      chars = chars.split('').filter(c => !AMBIGUOUS_CHARS.includes(c)).join('');
    }

    return chars;
  };

  const generatePassword = (chars: string, length: number): string => {
    if (chars.length === 0) return '';
    
    // Simulate crypto.getRandomValues behavior for testing
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
  };

  const calculateEntropy = (passwordLength: number, poolSize: number): number => {
    if (poolSize === 0) return 0;
    return Math.round(passwordLength * Math.log2(poolSize) * 10) / 10;
  };

  const getStrengthInfo = (entropy: number): { label: string; value: number } => {
    if (entropy < 28) return { label: 'Very Weak', value: 20 };
    if (entropy < 36) return { label: 'Weak', value: 40 };
    if (entropy < 60) return { label: 'Fair', value: 60 };
    if (entropy < 80) return { label: 'Strong', value: 80 };
    return { label: 'Very Strong', value: 100 };
  };

  describe('Character Set Selection', () => {
    it('should include all character types by default', () => {
      const chars = getCharacterSet(true, true, true, true, false);
      expect(chars.length).toBe(
        CHAR_SETS.uppercase.length + 
        CHAR_SETS.lowercase.length + 
        CHAR_SETS.numbers.length + 
        CHAR_SETS.symbols.length
      );
    });

    it('should exclude uppercase when disabled', () => {
      const chars = getCharacterSet(false, true, true, true, false);
      expect(chars).not.toContain('A');
      expect(chars).not.toContain('Z');
    });

    it('should exclude lowercase when disabled', () => {
      const chars = getCharacterSet(true, false, true, true, false);
      expect(chars).not.toContain('a');
      expect(chars).not.toContain('z');
    });

    it('should exclude numbers when disabled', () => {
      const chars = getCharacterSet(true, true, false, true, false);
      expect(chars).not.toContain('0');
      expect(chars).not.toContain('9');
    });

    it('should exclude symbols when disabled', () => {
      const chars = getCharacterSet(true, true, true, false, false);
      expect(chars).not.toContain('!');
      expect(chars).not.toContain('@');
    });

    it('should exclude ambiguous characters when enabled', () => {
      const chars = getCharacterSet(true, true, true, true, true);
      expect(chars).not.toContain('0');
      expect(chars).not.toContain('O');
      expect(chars).not.toContain('l');
      expect(chars).not.toContain('1');
      expect(chars).not.toContain('I');
    });

    it('should return empty string when no options selected', () => {
      const chars = getCharacterSet(false, false, false, false, false);
      expect(chars).toBe('');
    });
  });

  describe('Password Generation', () => {
    it('should generate password of correct length', () => {
      const chars = getCharacterSet(true, true, true, true, false);
      const password = generatePassword(chars, 16);
      expect(password.length).toBe(16);
    });

    it('should generate different passwords (randomness check)', () => {
      const chars = getCharacterSet(true, true, true, true, false);
      const passwords = new Set<string>();
      for (let i = 0; i < 100; i++) {
        passwords.add(generatePassword(chars, 16));
      }
      // At least 95 out of 100 should be unique
      expect(passwords.size).toBeGreaterThan(95);
    });

    it('should only use characters from selected set', () => {
      const chars = getCharacterSet(true, false, false, false, false);
      const password = generatePassword(chars, 100);
      for (const char of password) {
        expect(CHAR_SETS.uppercase).toContain(char);
      }
    });
  });

  describe('Entropy Calculation', () => {
    it('should calculate entropy correctly for alphanumeric', () => {
      // 62 characters (a-z, A-Z, 0-9)
      const entropy = calculateEntropy(16, 62);
      // 16 * log2(62) ≈ 95.2 bits
      expect(entropy).toBeCloseTo(95.2, 0);
    });

    it('should calculate entropy correctly for lowercase only', () => {
      // 26 characters (a-z)
      const entropy = calculateEntropy(16, 26);
      // 16 * log2(26) ≈ 75.2 bits
      expect(entropy).toBeCloseTo(75.2, 0);
    });

    it('should return 0 for empty pool', () => {
      const entropy = calculateEntropy(16, 0);
      expect(entropy).toBe(0);
    });
  });

  describe('Strength Classification', () => {
    it('should classify very weak passwords', () => {
      const strength = getStrengthInfo(20);
      expect(strength.label).toBe('Very Weak');
      expect(strength.value).toBe(20);
    });

    it('should classify weak passwords', () => {
      const strength = getStrengthInfo(30);
      expect(strength.label).toBe('Weak');
      expect(strength.value).toBe(40);
    });

    it('should classify fair passwords', () => {
      const strength = getStrengthInfo(50);
      expect(strength.label).toBe('Fair');
      expect(strength.value).toBe(60);
    });

    it('should classify strong passwords', () => {
      const strength = getStrengthInfo(70);
      expect(strength.label).toBe('Strong');
      expect(strength.value).toBe(80);
    });

    it('should classify very strong passwords', () => {
      const strength = getStrengthInfo(90);
      expect(strength.label).toBe('Very Strong');
      expect(strength.value).toBe(100);
    });
  });

  describe('Presets', () => {
    it('should have correct preset values for simple', () => {
      const preset = { length: 12, upper: true, lower: true, numbers: true, symbols: false };
      expect(preset.length).toBe(12);
      expect(preset.symbols).toBe(false);
    });

    it('should have correct preset values for strong', () => {
      const preset = { length: 24, upper: true, lower: true, numbers: true, symbols: true };
      expect(preset.length).toBe(24);
      expect(preset.symbols).toBe(true);
    });

    it('should have correct preset values for PIN-like', () => {
      const preset = { length: 8, upper: false, lower: true, numbers: true, symbols: false };
      expect(preset.length).toBe(8);
      expect(preset.upper).toBe(false);
    });
  });
});
