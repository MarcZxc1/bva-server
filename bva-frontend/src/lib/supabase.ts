/**
 * Supabase Client for BVA Frontend
 * 
 * Handles authentication via Supabase (Facebook OAuth, Google OAuth, etc.)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Config Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing',
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase not configured: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  console.warn('💡 Make sure you have a .env file in bva-frontend/ with:');
  console.warn('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.warn('   VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.warn('💡 Then restart your dev server (npm run dev)');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export default supabase;
