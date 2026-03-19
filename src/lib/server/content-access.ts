import { getSession } from './auth';
import type { AstroGlobal } from 'astro';

export type AccessLevel = 'public' | 'member' | 'premium';

export interface ContentAccessResult {
  hasAccess: boolean;
  accessLevel: AccessLevel;
  userTier: 'guest' | 'free' | 'premium';
  isAuthenticated: boolean;
  isPremium: boolean;
}

/**
 * Check if a user has access to content based on their subscription tier
 */
export async function checkContentAccess(
  Astro: AstroGlobal,
  contentAccessLevel: AccessLevel
): Promise<ContentAccessResult> {
  // Get the current session
  const authResult = await getSession(Astro, { requireAuth: false });
  const user = 'user' in authResult ? authResult.user : null;
  
  // Determine user tier
  let userTier: 'guest' | 'free' | 'premium' = 'guest';
  let isAuthenticated = false;
  let isPremium = false;
  
  if (user) {
    isAuthenticated = true;
    // Check subscription tier from user metadata or database
    const tier = (user as any).subscription_tier || (user as any).subscriptionTier || 'free';
    const status = (user as any).subscription_status || (user as any).subscriptionStatus || 'active';
    
    userTier = tier === 'premium' && status === 'active' ? 'premium' : 'free';
    isPremium = userTier === 'premium';
  }
  
  // Check access based on content level
  let hasAccess = false;
  
  switch (contentAccessLevel) {
    case 'public':
      hasAccess = true;
      break;
    case 'member':
      hasAccess = isAuthenticated;
      break;
    case 'premium':
      hasAccess = isPremium;
      break;
    default:
      hasAccess = true;
  }
  
  return {
    hasAccess,
    accessLevel: contentAccessLevel,
    userTier,
    isAuthenticated,
    isPremium,
  };
}

/**
 * Quick check if user can access premium content
 */
export async function canAccessPremium(Astro: AstroGlobal): Promise<boolean> {
  const access = await checkContentAccess(Astro, 'premium');
  return access.hasAccess;
}

/**
 * Quick check if user is authenticated
 */
export async function isAuthenticated(Astro: AstroGlobal): Promise<boolean> {
  const access = await checkContentAccess(Astro, 'member');
  return access.isAuthenticated;
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(Astro: AstroGlobal): Promise<'guest' | 'free' | 'premium'> {
  const access = await checkContentAccess(Astro, 'public');
  return access.userTier;
}
