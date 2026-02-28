import { supabase } from '../../../lib/supabase';

export async function POST({ Astro }) {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return new Response(JSON.stringify({ error: 'Logout failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return Astro.redirect('/login');
  } catch (err) {
    console.error('Unexpected logout error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
