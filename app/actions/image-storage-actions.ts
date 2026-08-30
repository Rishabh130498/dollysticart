'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Generates a short-lived signed URL for an original master image stored in the private `products-originals` bucket.
 * Restricted strictly to authenticated admin users.
 */
export async function getOriginalMasterSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized: User authentication required.' };
    }

    // Verify Admin Role in profiles table or email check matching is_admin SQL helper
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || user.email?.toLowerCase() === 'rishabhagarwal.me@gmail.com';

    if (!isAdmin) {
      return { success: false, error: 'Forbidden: Admin access required to access master original assets.' };
    }

    // Use admin client with service key or server client to generate signed URL
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.storage
      .from('products-originals')
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      // Fallback: check legacy 'products' bucket if originals bucket path not found
      const { data: fallbackData, error: fallbackError } = await adminSupabase.storage
        .from('products')
        .createSignedUrl(filePath, expiresInSeconds);

      if (fallbackError || !fallbackData?.signedUrl) {
        return { success: false, error: error.message || 'Failed to generate signed URL for original asset.' };
      }
      return { success: true, signedUrl: fallbackData.signedUrl };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err: any) {
    console.error('Error generating original asset signed URL:', err);
    return { success: false, error: err.message || 'Internal server error.' };
  }
}
