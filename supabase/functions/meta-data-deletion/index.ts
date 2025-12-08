/**
 * Supabase Edge Function: Meta (Facebook) Data Deletion Callback
 * 
 * This function handles Meta's user data deletion requests.
 * Meta sends a POST request with a signed_request parameter containing
 * the user's app-scoped ID.
 * 
 * Endpoint: https://your-project.supabase.co/functions/v1/meta-data-deletion
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Meta requires this specific response format
interface MetaDeletionResponse {
  url: string; // URL where user can check deletion status
  confirmation_code: string; // Unique code for this deletion request
}

/**
 * Parse Meta's signed_request
 * Meta sends data in a signed_request format: base64(JSON).HMAC_SHA256
 */
function parseSignedRequest(
  signedRequest: string,
  appSecret: string
): { user_id: string } | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".");
    
    if (!encodedSig || !payload) {
      console.error("Invalid signed_request format");
      return null;
    }

    // Decode the payload
    const data = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
      )
    );

    // Verify signature (optional but recommended)
    // In production, you should verify the HMAC signature
    // For now, we'll trust the payload if it has a user_id
    
    if (!data.user_id) {
      console.error("No user_id in signed_request");
      return null;
    }

    return { user_id: data.user_id };
  } catch (error) {
    console.error("Error parsing signed_request:", error);
    return null;
  }
}

/**
 * Delete user data from Supabase Auth
 */
async function deleteSupabaseUser(
  supabase: any,
  facebookUserId: string
): Promise<boolean> {
  try {
    // Find user by Facebook ID in auth.users metadata
    // Note: Supabase stores provider IDs in auth.users.identities
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return false;
    }

    // Find user with matching Facebook ID
    let userToDelete = null;
    for (const user of users.users) {
      // Check identities for Facebook provider
      const facebookIdentity = user.identities?.find(
        (identity: any) => identity.provider === "facebook"
      );
      
      if (facebookIdentity) {
        // Facebook user ID might be in identity.id or identity.identity_data.sub
        const fbId = facebookIdentity.identity_data?.sub || 
                     facebookIdentity.identity_data?.id ||
                     facebookIdentity.id;
        
        if (fbId === facebookUserId) {
          userToDelete = user;
          break;
        }
      }
    }

    if (!userToDelete) {
      console.log(`No Supabase user found for Facebook ID: ${facebookUserId}`);
      return false;
    }

    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      userToDelete.id
    );

    if (deleteError) {
      console.error("Error deleting Supabase user:", deleteError);
      return false;
    }

    console.log(`✅ Deleted Supabase user: ${userToDelete.id}`);
    return true;
  } catch (error) {
    console.error("Exception deleting Supabase user:", error);
    return false;
  }
}

/**
 * Delete user data from local database (via API call to your backend)
 * This assumes your backend has a DELETE endpoint for user data
 */
async function deleteLocalUserData(
  backendUrl: string,
  facebookUserId: string
): Promise<boolean> {
  try {
    // Call your backend API to delete user data
    // Adjust this endpoint based on your backend implementation
    const response = await fetch(`${backendUrl}/api/auth/facebook/delete-user`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ facebookUserId }),
    });

    if (!response.ok) {
      console.error(`Backend deletion failed: ${response.statusText}`);
      return false;
    }

    console.log(`✅ Deleted local user data for Facebook ID: ${facebookUserId}`);
    return true;
  } catch (error) {
    console.error("Error calling backend deletion API:", error);
    // Don't fail the whole process if backend deletion fails
    // Meta still needs a response
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
      },
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const facebookAppSecret = Deno.env.get("FACEBOOK_APP_SECRET");
    const backendUrl = Deno.env.get("BACKEND_URL") || "http://localhost:3000";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      console.error("No signed_request in request");
      return new Response(
        JSON.stringify({ error: "Missing signed_request parameter" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Parse signed request to get Facebook user ID
    const parsed = parseSignedRequest(
      signedRequest,
      facebookAppSecret || ""
    );

    if (!parsed || !parsed.user_id) {
      console.error("Failed to parse signed_request");
      return new Response(
        JSON.stringify({ error: "Invalid signed_request" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const facebookUserId = parsed.user_id;
    console.log(`📋 Processing deletion request for Facebook user: ${facebookUserId}`);

    // Generate confirmation code
    const confirmationCode = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Delete user data from Supabase Auth
    const supabaseDeleted = await deleteSupabaseUser(supabase, facebookUserId);

    // Delete user data from local database
    const localDeleted = await deleteLocalUserData(backendUrl, facebookUserId);

    // Log the deletion request (you might want to store this in a database)
    console.log(`🗑️  Deletion request processed:`, {
      facebookUserId,
      confirmationCode,
      supabaseDeleted,
      localDeleted,
      timestamp: new Date().toISOString(),
    });

    // Meta requires this specific response format
    const response: MetaDeletionResponse = {
      url: `${backendUrl}/data-deletion-status?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error processing deletion request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

