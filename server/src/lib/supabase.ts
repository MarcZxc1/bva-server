/**
 * Supabase Client Configuration
 * 
 * This file initializes the Supabase client for server-side operations.
 * Supabase handles OAuth authentication (Facebook, Google, etc.)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for server-side operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase not configured: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Create Supabase client for user operations (uses anon key)
// This is used when we need to verify user tokens
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;

