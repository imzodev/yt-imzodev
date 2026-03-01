import type { AstroCookies, AstroGlobal } from 'astro';
import { getSupabaseServerClient } from '../supabase';

/**
 * Validates the user session.
 * If requireAuth is true, it returns the session or redirects to login.
 * If requireGuest is true, it returns null or redirects to dashboard.
 */
export async function getSession(Astro: AstroGlobal, options: { requireAuth?: boolean; requireGuest?: boolean } = {}) {
  const supabase = getSupabaseServerClient(Astro.cookies);
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