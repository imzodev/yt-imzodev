import type { AstroGlobal } from 'astro';
import { getSupabaseServerClient } from '../supabase';
import { db, users } from '../../db';
import { eq } from 'drizzle-orm';
import type { User, SupabaseClient } from '@supabase/supabase-js';

/**
 * Session result type returned by getSession
 */
export type SessionResult = 
  | { user: User | null; supabase: ReturnType<typeof getSupabaseServerClient> }
  | Response;

/**
 * Type guard to check if getSession result is a redirect Response
 */
export function isRedirect(result: SessionResult): result is Response {
  return result instanceof Response;
}

/**
 * Type guard to check if getSession result has user data
 */
export function hasSession(result: SessionResult): result is { user: User | null; supabase: ReturnType<typeof getSupabaseServerClient> } {
  return !(result instanceof Response);
}

/**
 * Validates the user session.
 * If requireAuth is true, it returns the session or redirects to login.
 * If requireGuest is true, it returns null or redirects to dashboard.
 */
export async function getSession(Astro: AstroGlobal, options: { requireAuth?: boolean; requireGuest?: boolean } = {}): Promise<SessionResult> {
  const supabase = getSupabaseServerClient(Astro.request, Astro.cookies);
  // Use getUser() instead of getSession() for secure server-side validation
  const { data: { user }, error } = await supabase.auth.getUser();

  if (options.requireAuth && (!user || error)) {
    return Astro.redirect('/login');
  }

  if (options.requireGuest && user) {
    return Astro.redirect('/dashboard');
  }

  return { user, supabase };
}

/**
 * Gets the current user's profile from the public schema.
 * Must be called after getSession().
 */
export async function getUserProfile(supabase: ReturnType<typeof getSupabaseServerClient>, userId: string) {
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_user_id', userId)
    .single();
    
  return { profile, error };
}

/**
 * Checks if a user has admin role.
 * @param supabaseUserId - The Supabase Auth user ID
 * @returns true if user has admin role, false otherwise
 */
export async function isAdmin(supabaseUserId: string): Promise<boolean> {
  if (!supabaseUserId) return false;
  
  try {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.supabaseUserId, supabaseUserId))
      .limit(1);
    
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Checks if a user has moderator or admin role.
 * @param supabaseUserId - The Supabase Auth user ID
 * @returns true if user has moderator or admin role, false otherwise
 */
export async function isModerator(supabaseUserId: string): Promise<boolean> {
  if (!supabaseUserId) return false;
  
  try {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.supabaseUserId, supabaseUserId))
      .limit(1);
    
    return user?.role === 'admin' || user?.role === 'moderator';
  } catch {
    return false;
  }
}

/**
 * Middleware helper to require admin access.
 * Redirects non-admin users and returns the user ID for admin users.
 * @param Astro - The Astro global object
 * @returns Object with userId if admin, or redirect response
 */
export async function requireAdmin(Astro: AstroGlobal): Promise<{ userId: string } | Response> {
  const authResult = await getSession(Astro);
  
  // Check if it's a redirect response
  if (isRedirect(authResult)) {
    return authResult;
  }

  const user = authResult.user;

  if (!user) {
    return Astro.redirect('/login?redirect=' + encodeURIComponent(Astro.url.pathname));
  }

  const userIsAdmin = await isAdmin(user.id);
  if (!userIsAdmin) {
    return Astro.redirect('/dashboard?error=unauthorized');
  }

  return { userId: user.id };
}

/**
 * API route helper to check admin access.
 * Use this in API routes where you have the user ID from session.
 * @param supabaseUserId - The Supabase Auth user ID
 * @returns Object with authorized status and optional error response
 */
export async function checkAdminAccess(supabaseUserId: string): Promise<{ authorized: true } | { authorized: false; error: Response }> {
  if (!supabaseUserId) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const userIsAdmin = await isAdmin(supabaseUserId);
  if (!userIsAdmin) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return { authorized: true };
}