import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const validUrl = url.startsWith('http') ? url : 'https://placeholder-project.supabase.co';
  const validKey = anonKey || 'placeholder-anon-key';

  return createBrowserClient(validUrl, validKey);
}

