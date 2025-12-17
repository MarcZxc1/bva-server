/**
 * Supabase Client Configuration
 * Handles Facebook OAuth 2.0 and other Supabase Auth features
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are not set. Facebook OAuth will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Initiate Facebook OAuth flow via Supabase
 * This handles redirect URIs automatically
 */
export async function signInWithFacebook(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: redirectTo || `${window.location.origin}/ads?facebook_connected=true`,
      scopes: 'pages_manage_posts,pages_read_engagement,pages_show_list',
      queryParams: {
        // Request page management permissions
        auth_type: 'rerequest',
      },
    },
  });

  if (error) {
    console.error('Facebook OAuth error:', error);
    throw error;
  }

  return data;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
}

/**
 * Get Facebook access token from Supabase session
 */
export async function getFacebookAccessToken(): Promise<string | null> {
  const session = await getSession();
  if (!session?.provider_token) {
    return null;
  }
  return session.provider_token;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

