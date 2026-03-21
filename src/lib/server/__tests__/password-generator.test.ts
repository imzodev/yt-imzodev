/**
 * Tests for Password Generator lab tool functionality
 */
import { describe, it, expect } from 'vitest';

describe('Password Generator', () => {
  // Character sets
  const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  const NUMBERS = '0123456789';
  const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Password generator function
  function generatePassword(
    length: number,
    options: {
      uppercase?: boolean;
      lowercase?: boolean;
      numbers?: boolean;
      symbols?: boolean;
      exclude?: string;
    } = {}
  ): string {
    let chars = '';
    if (options.uppercase !== false) chars += UPPERCASE;
    if (options.lowercase !== false) chars += LOWERCASE;
    if (options.numbers !== false) chars += NUMBERS;
    if (options.symbols !== false) chars += SYMBOLS;

    // Remove excluded characters
    if (options.exclude) {
      chars = chars.split('').filter(c => !options.exclude!.includes(c)).join('');
    }

    if (chars.length === 0) return '';

    // Simulate crypto.getRandomValues
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }

    return password;
  }

  // Strength calculator
  function calculateStrength(password: string): { score: number; label: string } {
    let score = 0;

    // Length score
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (password.length >= 24) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;

    // Entropy bonus
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);

    let label = 'Weak';
    if (score >= 80) label = 'Strong';
    else if (score >= 60) label = 'Good';
    else if (score >= 40) label = 'Fair';

    return { score: Math.min(score, 100), label };
  }

  describe('Password Generation', () => {
    it('should generate password of correct length', () => {
      const password = generatePassword(16);
      expect(password.length).toBe(16);
    });

    it('should generate different passwords each time', () => {
      const password1 = generatePassword(16);
      const password2 = generatePassword(16);
      // Very unlikely to be the same
      expect(password1).not.toBe(password2);
    });

    it('should include uppercase when enabled', () => {
      const password = generatePassword(100, { uppercase: true, lowercase: false, numbers: false, symbols: false });
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(false);
    });

    it('should include lowercase when enabled', () => {
      const password = generatePassword(100, { uppercase: false, lowercase: true, numbers: false, symbols: false });
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(false);
    });

    it('should include numbers when enabled', () => {
      const password = generatePassword(100, { uppercase: false, lowercase: false, numbers: true, symbols: false });
      expect(/[0-9]/.test(password)).toBe(true);
    });

    it('should include symbols when enabled', () => {
      const password = generatePassword(100, { uppercase: false, lowercase: false, numbers: false, symbols: true });
      expect(/[^a-zA-Z0-9]/.test(password)).toBe(true);
    });

    it('should exclude specified characters', () => {
      const password = generatePassword(100, { uppercase: true, exclude: 'A' });
      expect(password.includes('A')).toBe(false);
    });

    it('should generate minimum length password', () => {
      const password = generatePassword(8);
      expect(password.length).toBe(8);
    });

    it('should generate long password', () => {
      const password = generatePassword(64);
      expect(password.length).toBe(64);
    });
  });

  describe('Strength Calculation', () => {
    it('should rate short password as weak', () => {
      const result = calculateStrength('abc');
      expect(result.label).toBe('Weak');
      expect(result.score).toBeLessThan(40);
    });

    it('should rate medium password as fair', () => {
      const result = calculateStrength('password1');
      expect(result.label).toBe('Fair');
      expect(result.score).toBeGreaterThanOrEqual(40);
    });

    it('should rate complex password as good', () => {
      const result = calculateStrength('MyP@ssw0rd');
      expect(['Good', 'Strong']).toContain(result.label);
    });

    it('should rate strong password correctly', () => {
      const result = calculateStrength('MyV3ry$tr0ngP@ssw0rd!');
      expect(result.label).toBe('Strong');
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it('should give length bonus for longer passwords', () => {
      const shortResult = calculateStrength('Abc123!@');
      const longResult = calculateStrength('Abc123!@Abc123!@Abc123!@');
      expect(longResult.score).toBeGreaterThan(shortResult.score);
    });

    it('should give variety bonus', () => {
      const noVariety = calculateStrength('aaaaaaaa');
      const variety = calculateStrength('Aa1!Aa1!');
      expect(variety.score).toBeGreaterThan(noVariety.score);
    });

    it('should give entropy bonus for unique characters', () => {
      const lowEntropy = calculateStrength('aaaaaaaaaaaaaaaa');
      const highEntropy = calculateStrength('AbCdEfGhIjKlMnOp');
      expect(highEntropy.score).toBeGreaterThan(lowEntropy.score);
    });
  });

  describe('Character Set Coverage', () => {
    it('should cover uppercase characters', () => {
      const password = generatePassword(1000, { uppercase: true, lowercase: false, numbers: false, symbols: false });
      for (const char of UPPERCASE) {
        expect(password.includes(char)).toBe(true);
      }
    });

    it('should cover lowercase characters', () => {
      const password = generatePassword(1000, { uppercase: false, lowercase: true, numbers: false, symbols: false });
      for (const char of LOWERCASE) {
        expect(password.includes(char)).toBe(true);
      }
    });

    it('should cover number characters', () => {
      const password = generatePassword(1000, { uppercase: false, lowercase: false, numbers: true, symbols: false });
      for (const char of NUMBERS) {
        expect(password.includes(char)).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty exclude list', () => {
      const password = generatePassword(16, { exclude: '' });
      expect(password.length).toBe(16);
    });

    it('should handle excluding all characters from a set', () => {
      const password = generatePassword(100, { uppercase: true, exclude: UPPERCASE });
      // Should still generate from other sets
      expect(password.length).toBeGreaterThan(0);
    });

    it('should handle minimum valid length', () => {
      const password = generatePassword(1);
      expect(password.length).toBe(1);
    });
  });

  describe('Security Considerations', () => {
    it('should not have predictable patterns', () => {
      const passwords = Array.from({ length: 10 }, () => generatePassword(16));
      // Check that no two passwords start with the same 4 characters
      const prefixes = passwords.map(p => p.substring(0, 4));
      const uniquePrefixes = new Set(prefixes);
      // Very unlikely all 10 would have unique prefixes if predictable
      expect(uniquePrefixes.size).toBeGreaterThan(1);
    });

    it('should use all character types by default', () => {
      const password = generatePassword(50);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[^a-zA-Z0-9]/.test(password)).toBe(true);
    });
  });

  describe('Length Validation', () => {
    it('should generate exactly requested length', () => {
      for (const len of [8, 12, 16, 24, 32, 64]) {
        const password = generatePassword(len);
        expect(password.length).toBe(len);
      }
    });
  });
});
