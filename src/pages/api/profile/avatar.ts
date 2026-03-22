import type { APIRoute } from 'astro';
import { validateCsrfToken } from '../../../lib/server/csrf';
import { getSupabaseServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token') as string | null;
    if (!validateCsrfToken(cookies, csrfToken)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 403 });
    }

    // Get session securely
    const supabase = getSupabaseServerClient(request, cookies);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const file = formData.get('avatar') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    // Basic validation
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'File must be an image' }), { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      return new Response(JSON.stringify({ error: 'File size must be less than 2MB' }), { status: 400 });
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload image' }), { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    // Update user profile in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar: publicUrl })
      .eq('supabase_user_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, url: publicUrl }), { status: 200 });
  } catch (error) {
    console.error('Unexpected error during avatar upload:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};