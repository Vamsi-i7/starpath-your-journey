// Safe Supabase client wrapper.
// Some environments may temporarily fail to inject VITE_SUPABASE_URL; in that case
// we derive the URL from the project id.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const urlFromProjectId = projectId ? `https://${projectId}.supabase.co` : undefined;

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || urlFromProjectId;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  // Throwing is still better than creating a half-broken client, but we make the
  // message actionable.
  throw new Error(
    'Backend connection is not configured. Missing VITE_SUPABASE_URL (or VITE_SUPABASE_PROJECT_ID) or VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
