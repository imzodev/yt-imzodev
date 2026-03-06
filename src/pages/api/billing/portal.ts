import type { APIRoute } from 'astro';
import { createBillingPortalSession, getBillingProfileBySupabaseUserId } from '../../../lib/server/billing';
import { validateCsrfToken } from '../../../lib/server/csrf';
import { getSupabaseServerClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  try {
    const formData = await request.formData();
    const csrfToken = formData.get('csrf_token') as string | null;

    if (!validateCsrfToken(cookies, csrfToken)) {
      return redirect('/profile?billing=invalid-request');
    }

    const supabase = getSupabaseServerClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return redirect('/login?next=/profile');
    }

    const profile = await getBillingProfileBySupabaseUserId(user.id);

    if (!profile || profile.isActive === false) {
      return redirect('/profile?billing=profile-unavailable');
    }

    const session = await createBillingPortalSession(profile, url.origin);

    return new Response(null, {
      status: 303,
      headers: {
        Location: session.url,
      },
    });
  } catch (error) {
    console.error('Failed to create billing portal session:', error);
    return redirect('/profile?billing=portal-error');
  }
};
