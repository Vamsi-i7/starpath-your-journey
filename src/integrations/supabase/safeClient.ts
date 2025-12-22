// Supabase client with hardcoded fallback values
// This ensures the app works even if environment variables fail to load

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded fallback values (these are public/publishable, safe to include)
const FALLBACK_PROJECT_ID = 'lfewszmkscodyyrhrlpf';
const FALLBACK_URL = `https://${FALLBACK_PROJECT_ID}.supabase.co`;
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXdzem1rc2NvZHl5cmhybHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjM4NjYsImV4cCI6MjA4MTk5OTg2Nn0.GREbPk1W_KTf-JOdbKr0cKrOdBwR8gazP416vKW7LBY';

// Try to get from environment, fall back to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
