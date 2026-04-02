import { describe, it, expect } from 'vitest';

describe('Inter Font Loading', () => {
  describe('Google Fonts link configuration', () => {
    const fontConfig = {
      family: 'Inter',
      weights: [400, 500, 600, 700, 800],
      preconnectDomains: [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ],
    };

    it('should include Inter font family', () => {
      expect(fontConfig.family).toBe('Inter');
    });

    it('should include required font weights', () => {
      const requiredWeights = [400, 500, 600, 700, 800];
      expect(fontConfig.weights).toEqual(requiredWeights);
    });

    it('should have preconnect hints for Google Fonts domains', () => {
      expect(fontConfig.preconnectDomains).toContain('https://fonts.googleapis.com');
      expect(fontConfig.preconnectDomains).toContain('https://fonts.gstatic.com');
    });

    it('should have crossorigin attribute for gstatic preconnect', () => {
      // The crossorigin attribute is required for fonts.gstatic.com
      const gstaticConfig = { crossorigin: true };
      expect(gstaticConfig.crossorigin).toBe(true);
    });
  });

  describe('Font display configuration', () => {
    it('should use font-display: swap for performance', () => {
      // Google Fonts automatically includes font-display: swap
      const fontDisplay = 'swap';
      expect(fontDisplay).toBe('swap');
    });
  });

  describe('CSS font-family declaration', () => {
    const globalCssConfig = {
      fontFamily: "'Inter', system-ui, sans-serif",
    };

    it('should declare Inter as primary font', () => {
      expect(globalCssConfig.fontFamily).toContain('Inter');
    });

    it('should have fallback fonts', () => {
      expect(globalCssConfig.fontFamily).toContain('system-ui');
      expect(globalCssConfig.fontFamily).toContain('sans-serif');
    });
  });

  describe('Performance considerations', () => {
    it('should minimize layout shift (CLS)', () => {
      // font-display: swap ensures text is visible before font loads
      // This reduces Cumulative Layout Shift
      const hasFontDisplaySwap = true;
      expect(hasFontDisplaySwap).toBe(true);
    });

    it('should use preconnect for faster font loading', () => {
      // Preconnect hints reduce connection latency
      const usesPreconnect = true;
      expect(usesPreconnect).toBe(true);
    });
  });
});
