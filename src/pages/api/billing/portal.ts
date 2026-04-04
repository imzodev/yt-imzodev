import type { APIRoute } from 'astro';
import { createBillingPortalSession, getBillingProfileBySupabaseUserId } from '../../../lib/server/billing';
import { getSupabaseServerClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  try {

    const supabase = getSupabaseServerClient(request, cookies);
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
