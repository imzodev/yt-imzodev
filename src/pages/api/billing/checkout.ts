import type { APIRoute } from 'astro';
import { createPremiumCheckoutSession, createPremiumCheckoutWithTrial, getBillingProfileBySupabaseUserId } from '../../../lib/server/billing';
import { getSupabaseServerClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  try {
    const formData = await request.formData();
    const withTrial = formData.get('trial') === 'true';

    const supabase = getSupabaseServerClient(request, cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return redirect('/login?next=/pricing');
    }

    const profile = await getBillingProfileBySupabaseUserId(user.id);

    if (!profile || profile.isActive === false) {
      return redirect('/pricing?billing=profile-unavailable');
    }

    const session = withTrial 
      ? await createPremiumCheckoutWithTrial(profile, url.origin, 7)
      : await createPremiumCheckoutSession(profile, url.origin);

    if (!session.url) {
      return redirect('/pricing?billing=checkout-error');
    }

    return new Response(null, {
      status: 303,
      headers: {
        Location: session.url,
      },
    });
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    return redirect('/pricing?billing=checkout-error');
  }
};
