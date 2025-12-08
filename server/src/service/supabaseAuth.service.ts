/**
 * Supabase Auth Service
 * 
 * Handles synchronization between Supabase Auth users and local database users.
 * When a user authenticates via Supabase (Facebook OAuth), we sync their data
 * to our local Prisma database.
 */

import { User as SupabaseUser } from '@supabase/supabase-js';
import prisma from '../lib/prisma';
import { supabase } from '../lib/supabase';

export interface SyncUserResult {
  user: any;
  created: boolean;
}

export class SupabaseAuthService {
  /**
   * Sync Supabase user to local database
   * Creates or updates user in local database based on Supabase auth data
   */
  async syncUser(supabaseUser: SupabaseUser): Promise<SyncUserResult> {
    const email = supabaseUser.email;
    const supabaseId = supabaseUser.id;

    if (!email) {
      throw new Error('User email is required');
    }

    // Check if user exists by email or Supabase ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          // We can add a supabaseId field if needed, or use metadata
        ],
      },
    });

    // Extract provider-specific IDs from user identities
    // Supabase stores provider IDs in the identities array
    const facebookIdentity = supabaseUser.identities?.find(i => i.provider === 'facebook');
    const googleIdentity = supabaseUser.identities?.find(i => i.provider === 'google');
    
    // Facebook ID can be in identity.id (provider user ID) or user_metadata
    const facebookId = facebookIdentity?.identity_data?.sub || // Facebook user ID
                      facebookIdentity?.id || // Provider identity ID
                      supabaseUser.user_metadata?.facebook_id ||
                      supabaseUser.user_metadata?.sub;
    
    const googleId = googleIdentity?.identity_data?.sub ||
                     googleIdentity?.id ||
                     supabaseUser.user_metadata?.google_id;

    console.log('📋 Extracted provider IDs:', {
      facebookId,
      googleId,
      hasFacebookIdentity: !!facebookIdentity,
      hasGoogleIdentity: !!googleIdentity,
      identities: supabaseUser.identities?.map(i => ({ provider: i.provider, id: i.id })),
    });

    // Extract name from user metadata (Facebook provides different fields)
    const fullName = supabaseUser.user_metadata?.full_name || 
                     supabaseUser.user_metadata?.name ||
                     supabaseUser.user_metadata?.user_name ||
                     (supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.last_name
                       ? `${supabaseUser.user_metadata?.first_name || ''} ${supabaseUser.user_metadata?.last_name || ''}`.trim()
                       : null);

    const userData: any = {
      email,
      name: fullName || email?.split('@')[0] || 'User',
      firstName: supabaseUser.user_metadata?.first_name || 
                 supabaseUser.user_metadata?.given_name || 
                 null,
      lastName: supabaseUser.user_metadata?.last_name || 
                supabaseUser.user_metadata?.family_name || 
                null,
    };

    // Add provider-specific IDs if available
    if (facebookId) {
      userData.facebookId = facebookId;
    }
    if (googleId) {
      userData.googleId = googleId;
    }

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: userData,
      });
      
      // Check if existing SELLER user has a shop, create one if missing
      if (user.role === 'SELLER') {
        const existingShops = await prisma.shop.findMany({
          where: { ownerId: user.id },
          select: { id: true },
        });
        
        if (existingShops.length === 0) {
          try {
            await prisma.shop.create({
              data: {
                name: `${user.name || user.firstName || user.email?.split("@")[0] || 'My'}'s Shop`,
                ownerId: user.id,
              },
            });
            console.log(`✅ Created shop for existing SELLER user: ${user.email}`);
          } catch (shopError) {
            console.error("Error creating shop for existing SELLER:", shopError);
            // Continue even if shop creation fails
          }
        }
      }
      
      return { user, created: false };
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          ...userData,
          password: null, // OAuth users don't need passwords
          role: 'SELLER', // Default role
        },
      });

      // Create a shop for new SELLER users
      if (user.role === 'SELLER') {
        await prisma.shop.create({
          data: {
            name: `${user.name || user.firstName || user.email?.split("@")[0] || 'My'}'s Shop`,
            ownerId: user.id,
          },
        });
      }

      return { user, created: true };
    }
  }

  /**
   * Get user by Supabase ID
   */
  async getUserBySupabaseId(supabaseId: string) {
    // Since we don't store Supabase ID directly, we'll need to query by email
    // or add a supabaseId field to the User model
    // For now, we'll use the sync method which handles this
    return null;
  }

  /**
   * Verify Supabase access token and get user
   */
  async verifyToken(accessToken: string): Promise<SupabaseUser | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Use the service role client to verify the token
      // This bypasses RLS and allows server-side verification
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error) {
        console.error('Error verifying token:', error);
        return null;
      }

      if (!user) {
        console.error('No user returned from token verification');
        return null;
      }

      console.log('✅ Verified Supabase user:', {
        id: user.id,
        email: user.email,
        providers: user.app_metadata?.providers,
        identities: user.identities?.map(i => ({ provider: i.provider, id: i.id })),
      });

      return user;
    } catch (error) {
      console.error('Error verifying Supabase token:', error);
      return null;
    }
  }

  /**
   * Get user's Facebook access token from Supabase
   * This is used for ad publishing
   */
  async getFacebookAccessToken(supabaseUserId: string): Promise<string | null> {
    if (!supabase) {
      return null;
    }

    try {
      // Get user's session to extract provider tokens
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      // Facebook access token might be in session.provider_token
      // or we need to refresh it via Supabase
      return session.provider_token || null;
    } catch (error) {
      console.error('Error getting Facebook access token:', error);
      return null;
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();

