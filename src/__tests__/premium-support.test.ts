import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Premium Support Feature', () => {
  const profilePagePath = join(process.cwd(), 'src/pages/profile/index.astro');
  const dashboardPagePath = join(process.cwd(), 'src/pages/dashboard.astro');
  let profileContent: string;
  let dashboardContent: string;

  beforeAll(() => {
    if (existsSync(profilePagePath)) {
      profileContent = readFileSync(profilePagePath, 'utf-8');
    }
    if (existsSync(dashboardPagePath)) {
      dashboardContent = readFileSync(dashboardPagePath, 'utf-8');
    }
  });

  describe('Premium Support Section', () => {
    it('should have a Premium Support heading', () => {
      expect(profileContent).toContain('Premium Support');
    });

    it('should describe priority support for premium members', () => {
      expect(profileContent).toContain('Priority support for premium members');
    });

    it('should include email support link', () => {
      expect(profileContent).toContain('support@imzodev.com');
    });

    it('should include Discord community link', () => {
      expect(profileContent).toContain('https://discord.gg/imzodev');
    });

    it('should show average response time', () => {
      expect(profileContent).toContain('Average response time: 24 hours');
    });

    it('should have email support option', () => {
      expect(profileContent).toContain('Email Support');
    });

    it('should have Discord community option', () => {
      expect(profileContent).toContain('Discord Community');
    });
  });

  describe('Conditional rendering', () => {
    it('should conditionally render for premium users only', () => {
      expect(profileContent).toContain('{subscription && (');
    });

    it('should check subscription status', () => {
      expect(profileContent).toContain('subscription');
    });
  });

  describe('UI Components', () => {
    it('should use border-primary/20 for premium section', () => {
      expect(profileContent).toContain('border-primary/20');
    });

    it('should have hover effects on support options', () => {
      expect(profileContent).toContain('hover:bg-base-200');
    });

    it('should use flex layout for support options', () => {
      expect(profileContent).toContain('flex items-center gap-3');
    });

    it('should have proper accessibility attributes for external links', () => {
      expect(profileContent).toContain('target="_blank"');
      expect(profileContent).toContain('rel="noopener noreferrer"');
    });
  });

  describe('Support options structure', () => {
    it('should have two support options (email and discord)', () => {
      const supportOptions = profileContent.match(/href="(mailto|https)/g);
      expect(supportOptions).toBeDefined();
      expect(supportOptions?.length).toBeGreaterThanOrEqual(2);
    });

    it('should have icons for each support option', () => {
      // Email icon
      expect(profileContent).toContain('M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z');
      // Discord icon (discord logo path)
      expect(profileContent).toContain('M20.317 4.37a19.791');
    });

    it('should have descriptive text for each option', () => {
      expect(profileContent).toContain('Get help from the community');
    });
  });

  describe('Integration with existing profile', () => {
    it('should be placed in the right column with other cards', () => {
        // Check it's in the same grid column as Newsletter
        expect(profileContent).toContain('bg-base-100 shadow rounded-lg p-6');
      });

    it('should follow the same card structure as other sections', () => {
      expect(profileContent).toContain('text-xl font-semibold mb-4 border-b border-base-300 pb-4');
    });
  });

  describe('Dashboard Premium Support Section', () => {
    it('should have a Premium Support heading', () => {
      expect(dashboardContent).toContain('Premium Support');
    });

    it('should describe priority support for premium members', () => {
      expect(dashboardContent).toContain('Priority support for premium members');
    });

    it('should include email support link', () => {
      expect(dashboardContent).toContain('support@imzodev.com');
    });

    it('should include Discord community link', () => {
      expect(dashboardContent).toContain('https://discord.gg/imzodev');
    });

    it('should show average response time', () => {
      expect(dashboardContent).toContain('Average response time: 24 hours');
    });

    it('should have email support option', () => {
      expect(dashboardContent).toContain('Email Support');
    });

    it('should have Discord community option', () => {
      expect(dashboardContent).toContain('Discord Community');
    });
  });

  describe('Dashboard conditional rendering', () => {
    it('should conditionally render for premium users only', () => {
      expect(dashboardContent).toContain("viewer?.subscriptionTier === 'premium'");
    });

    it('should check subscription tier', () => {
      expect(dashboardContent).toContain('subscriptionTier');
    });
  });

  describe('Dashboard UI Components', () => {
    it('should use border-primary/20 for premium section', () => {
      expect(dashboardContent).toContain('border-primary/20');
    });

    it('should have hover effects on support options', () => {
      expect(dashboardContent).toContain('hover:bg-base-200');
    });

    it('should use card structure for support section', () => {
      expect(dashboardContent).toContain('card bg-base-100 shadow-lg');
    });

    it('should have proper accessibility attributes for external links', () => {
      expect(dashboardContent).toContain('target="_blank"');
      expect(dashboardContent).toContain('rel="noopener noreferrer"');
    });
  });
});
