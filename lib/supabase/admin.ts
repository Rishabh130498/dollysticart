import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const validUrl = url.startsWith('http') ? url : 'https://placeholder-project.supabase.co';
  const validKey = serviceKey || 'placeholder-service-key';

  return createClient(
    validUrl,
    validKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );
}

