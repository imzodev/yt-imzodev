import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = getSupabaseServerClient(request, cookies);
  
  // Call signOut on the server client to clear the session securely
  await supabase.auth.signOut();
  
  return redirect('/login');
};
