import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../lib/supabase';
import type { Provider } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const formData = await request.formData();
  const provider = formData.get('provider')?.toString();
  
  const validProviders: Provider[] = ['google', 'github'];

  if (!provider || !validProviders.includes(provider as Provider)) {
    return redirect('/login?error=invalid_provider');
  }

  const supabase = getSupabaseServerClient(request, cookies);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: `${url.origin}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    console.error(`OAuth error for ${provider}:`, error);
    return redirect(`/login?error=oauth_failed`);
  }

  // Redirect to the provider's consent screen
  return redirect(data.url);
};