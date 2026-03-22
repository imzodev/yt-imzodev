import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../lib/supabase';

// Helper to validate redirect URLs to prevent Open Redirect vulnerabilities
function getValidatedRedirectUrl(url: string, origin: string): string {
  try {
    // If it's a relative path, it's safe and we make it absolute using the origin
    if (url.startsWith('/')) {
      return `${origin}${url}`;
    }
    
    // If it's an absolute URL, verify it matches our origin
    const parsedUrl = new URL(url);
    if (parsedUrl.origin === origin) {
      return url;
    }
    
    // Fallback to safe default
    return `${origin}/dashboard`;
  } catch {
    // If URL parsing fails, fallback to safe default
    return `${origin}/dashboard`;
  }
}

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = getSupabaseServerClient(request, cookies);
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const safeRedirectUrl = getValidatedRedirectUrl(next, requestUrl.origin);
      return redirect(safeRedirectUrl);
    }
  }

  // Return the user to an error page with some instructions
  return redirect('/login?error=oauth_failed');
};
