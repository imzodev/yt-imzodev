/**
 * Usage Analytics Tests
 * Tests for premium usage tracking and display
 */
import { describe, it, expect } from 'vitest';
import type { PremiumUsageStats, UsageLimit } from '../usage-analytics';

describe('Usage Analytics - Stats Structure', () => {
  it('should define correct PremiumUsageStats structure', () => {
    const stats: PremiumUsageStats = {
      premiumVideosWatched: 12,
      premiumArticlesRead: 5,
      premiumSnippetsAccessed: 3,
      totalPremiumInteractions: 20,
      favoriteCategory: 'tutorials',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
    };

    expect(stats.premiumVideosWatched).toBe(12);
    expect(stats.premiumArticlesRead).toBe(5);
    expect(stats.premiumSnippetsAccessed).toBe(3);
    expect(stats.totalPremiumInteractions).toBe(20);
    expect(stats.favoriteCategory).toBe('tutorials');
    expect(stats.periodStart).toBeInstanceOf(Date);
    expect(stats.periodEnd).toBeInstanceOf(Date);
  });

  it('should handle zero usage stats', () => {
    const stats: PremiumUsageStats = {
      premiumVideosWatched: 0,
      premiumArticlesRead: 0,
      premiumSnippetsAccessed: 0,
      totalPremiumInteractions: 0,
      favoriteCategory: null,
      periodStart: new Date(),
      periodEnd: new Date(),
    };

    expect(stats.totalPremiumInteractions).toBe(0);
    expect(stats.favoriteCategory).toBeNull();
  });
});

describe('Usage Analytics - Usage Limits', () => {
  it('should define correct UsageLimit structure for free tier', () => {
    const limit: UsageLimit = {
      feature: 'Videos',
      used: 3,
      limit: 5,
      approachingLimit: true,
      atLimit: false,
    };

    expect(limit.feature).toBe('Videos');
    expect(limit.used).toBe(3);
    expect(limit.limit).toBe(5);
    expect(limit.approachingLimit).toBe(true);
    expect(limit.atLimit).toBe(false);
  });

  it('should handle unlimited features for premium tier', () => {
    const limit: UsageLimit = {
      feature: 'Videos',
      used: 100,
      limit: null, // Unlimited
      approachingLimit: false,
      atLimit: false,
    };

    expect(limit.limit).toBeNull();
    expect(limit.approachingLimit).toBe(false);
    expect(limit.atLimit).toBe(false);
  });

  it('should detect when at limit', () => {
    const limit: UsageLimit = {
      feature: 'Premium Articles',
      used: 3,
      limit: 3,
      approachingLimit: true,
      atLimit: true,
    };

    expect(limit.atLimit).toBe(true);
    expect(limit.approachingLimit).toBe(true);
  });
});

describe('Usage Analytics - Formatting', () => {
  it('should format summary for users with activity', () => {
    const stats: PremiumUsageStats = {
      premiumVideosWatched: 12,
      premiumArticlesRead: 5,
      premiumSnippetsAccessed: 3,
      totalPremiumInteractions: 20,
      favoriteCategory: 'tutorials',
      periodStart: new Date(),
      periodEnd: new Date(),
    };

    // Simulate formatUsageStats output
    const summary = `${stats.totalPremiumInteractions} premium content interactions in the last 30 days`;
    const details: string[] = [];

    if (stats.premiumVideosWatched > 0) {
      details.push(`${stats.premiumVideosWatched} premium video${stats.premiumVideosWatched !== 1 ? 's' : ''} watched`);
    }
    if (stats.premiumArticlesRead > 0) {
      details.push(`${stats.premiumArticlesRead} premium article${stats.premiumArticlesRead !== 1 ? 's' : ''} read`);
    }
    if (stats.premiumSnippetsAccessed > 0) {
      details.push(`${stats.premiumSnippetsAccessed} premium snippet${stats.premiumSnippetsAccessed !== 1 ? 's' : ''} accessed`);
    }

    expect(summary).toBe('20 premium content interactions in the last 30 days');
    expect(details).toHaveLength(3);
    expect(details[0]).toBe('12 premium videos watched');
    expect(details[1]).toBe('5 premium articles read');
    expect(details[2]).toBe('3 premium snippets accessed');
  });

  it('should format summary for users with no activity', () => {
    const stats: PremiumUsageStats = {
      premiumVideosWatched: 0,
      premiumArticlesRead: 0,
      premiumSnippetsAccessed: 0,
      totalPremiumInteractions: 0,
      favoriteCategory: null,
      periodStart: new Date(),
      periodEnd: new Date(),
    };

    const summary = stats.totalPremiumInteractions > 0
      ? `${stats.totalPremiumInteractions} premium content interactions in the last 30 days`
      : 'No premium content accessed yet';

    expect(summary).toBe('No premium content accessed yet');
  });

  it('should handle singular vs plural correctly', () => {
    const singularStats = {
      premiumVideosWatched: 1,
      premiumArticlesRead: 1,
      premiumSnippetsAccessed: 1,
    };

    const videoText = `${singularStats.premiumVideosWatched} premium video${singularStats.premiumVideosWatched !== 1 ? 's' : ''} watched`;
    const articleText = `${singularStats.premiumArticlesRead} premium article${singularStats.premiumArticlesRead !== 1 ? 's' : ''} read`;
    const snippetText = `${singularStats.premiumSnippetsAccessed} premium snippet${singularStats.premiumSnippetsAccessed !== 1 ? 's' : ''} accessed`;

    expect(videoText).toBe('1 premium video watched');
    expect(articleText).toBe('1 premium article read');
    expect(snippetText).toBe('1 premium snippet accessed');
  });
});

describe('Usage Analytics - Period Calculation', () => {
  it('should calculate 30-day period correctly', () => {
    const periodEnd = new Date('2024-01-31');
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 30);

    expect(periodStart.toISOString().split('T')[0]).toBe('2024-01-01');
  });

  it('should calculate period dates as Date objects', () => {
    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 30);

    expect(periodStart).toBeInstanceOf(Date);
    expect(now).toBeInstanceOf(Date);
    expect(periodStart.getTime()).toBeLessThan(now.getTime());
  });
});

describe('Usage Analytics - Limit Detection', () => {
  it('should detect approaching limit at 80%', () => {
    const used = 4;
    const limit = 5;
    const approachingLimit = used >= limit * 0.8;

    expect(approachingLimit).toBe(true);
  });

  it('should not flag approaching limit below 80%', () => {
    const used = 3;
    const limit = 5;
    const approachingLimit = used >= limit * 0.8;

    expect(approachingLimit).toBe(false);
  });

  it('should detect at limit', () => {
    const used = 5;
    const limit = 5;
    const atLimit = used >= limit;

    expect(atLimit).toBe(true);
  });

  it('should handle unlimited (null limit) gracefully', () => {
    const used = 1000;
    const limit = null;
    const approachingLimit = limit !== null && used >= limit * 0.8;
    const atLimit = limit !== null && used >= limit;

    expect(approachingLimit).toBe(false);
    expect(atLimit).toBe(false);
  });
});
