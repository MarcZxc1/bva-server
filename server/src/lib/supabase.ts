/**
 * Supabase Server Client Configuration
 * For server-side operations with service role key
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('⚠️ Supabase server environment variables are not set.');
}

// Server client with service role key (has admin privileges)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Get user's Facebook access token from Supabase
 */
export async function getFacebookTokenFromSupabase(userId: string): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
} | null> {
  try {
    // Get user's auth session from Supabase
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users from Supabase:', error);
      return null;
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return null;
    }

    // Get identity (OAuth provider info)
    const { data: identities, error: identityError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (identityError || !identities?.user?.identities) {
      console.error('Error fetching user identities:', identityError);
      return null;
    }

    // Find Facebook identity
    const facebookIdentity = identities.user.identities.find(
      (identity: any) => identity.provider === 'facebook'
    );

    if (!facebookIdentity) {
      return null;
    }

    // Note: Supabase stores provider tokens in the session, not in identities
    // We need to get the active session for the user
    // For now, we'll need to store the token in our database after OAuth
    
    return null;
  } catch (error) {
    console.error('Error getting Facebook token from Supabase:', error);
    return null;
  }
}

