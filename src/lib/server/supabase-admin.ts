import { createClient } from '@supabase/supabase-js';

// Environment variables for admin client
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
}

// Create admin client for server-side operations only
// DO NOT import this file in any client-side components (.astro, .svelte, .vue, .jsx, .tsx etc.)
// ONLY use this in API routes or inside getStaticPaths/getServerSideProps equivalent logic
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
