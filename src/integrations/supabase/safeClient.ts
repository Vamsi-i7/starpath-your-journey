// Supabase client - YOUR OWN Supabase project
// NO FALLBACKS - Only uses your environment variables

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get credentials from environment variables ONLY
// No fallback to Lovable Cloud - we own this database now!
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate that credentials exist
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase credentials! Check your .env file.');
}

// Validate correct Supabase URL in development
if (import.meta.env.DEV) {
  console.log('🔍 Supabase URL being used:', SUPABASE_URL);
  console.log('✅ Expected:', 'https://ryzhsfmqopywoymghmdp.supabase.co');
  if (SUPABASE_URL !== 'https://ryzhsfmqopywoymghmdp.supabase.co') {
    console.error('❌ WRONG SUPABASE URL! Still using old Lovable credentials!');
  }
}

export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
