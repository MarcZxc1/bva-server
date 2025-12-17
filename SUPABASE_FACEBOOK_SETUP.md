# Supabase Facebook OAuth 2.0 Setup Guide

This guide will help you set up Supabase for handling Facebook OAuth 2.0 with automatic redirect URI management.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- A Facebook Developer App (see FACEBOOK_SETUP.md)
- Your Facebook App ID and App Secret

## Step 1: Your Supabase Project

**Your Project Dashboard:** https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz

**Project Details:**
- **Project Reference**: `zfbqgnnbfkadwprqahbz`
- **Project URL**: `https://zfbqgnnbfkadwprqahbz.supabase.co`
- **API Settings**: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz/settings/api
- **Auth Settings**: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz/auth/providers

## Step 2: Get Supabase Credentials

1. Go to your Supabase API Settings: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz/settings/api
2. You'll find:
   - **Project URL**: `https://zfbqgnnbfkadwprqahbz.supabase.co` → This is your `VITE_SUPABASE_URL`
   - **anon public** key → This is your `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Step 3: Configure Facebook OAuth in Supabase

1. Go to your Supabase Auth Providers: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz/auth/providers
2. Find **Facebook** in the list and click to configure
3. Enable Facebook provider
4. Enter your Facebook App credentials:
   - **Facebook App ID**: Your `FACEBOOK_APP_ID`
   - **Facebook App Secret**: Your `FACEBOOK_APP_SECRET`
5. Click **"Save"**

## Step 4: Configure Facebook App for Supabase

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Settings** > **Basic**
4. Add **Valid OAuth Redirect URIs**:
   ```
   https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback
   http://localhost:5173/ads?facebook_connected=true
   http://localhost:8080/ads?facebook_connected=true
   ```
   
   **Your Supabase Project:**
   - Project URL: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz
   - Project Reference: `zfbqgnnbfkadwprqahbz`
   - Callback URL: `https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback`

5. Click **"Save Changes"**

## Step 5: Request Facebook Permissions

1. In Facebook Developers, go to **App Review** > **Permissions and Features**
2. Request the following permissions:
   - `pages_manage_posts` - To publish posts to Facebook Pages
   - `pages_read_engagement` - To read post engagement metrics
   - `pages_show_list` - To list user's Facebook Pages

3. For each permission:
   - Click **"Request"** or **"Add"**
   - Fill out the use case description
   - Submit for review (or use in development mode for testing)

## Step 6: Configure Environment Variables

### Frontend (.env or .env.local)

Add to `bva-frontend/.env`:

```env
VITE_SUPABASE_URL=https://zfbqgnnbfkadwprqahbz.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

**To get your anon key:**
- Go to: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz/settings/api
- Copy the **"anon public"** key

### Backend (.env)

Add to `server/.env`:

```env
SUPABASE_URL=https://zfbqgnnbfkadwprqahbz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Keep your Facebook credentials (still needed for page tokens)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**To get your service role key:**
- Go to: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz/settings/api
- Copy the **"service_role"** key (keep this secret!)

## Step 7: How It Works

### OAuth Flow:

1. **User clicks "Connect Facebook"** in MarketMate
2. **Supabase handles OAuth**:
   - Redirects to Facebook with proper scopes
   - Handles redirect URI automatically: `https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback`
   - Manages the OAuth callback
3. **Facebook redirects back** to Supabase callback URL
4. **Supabase processes the token** and creates a session
5. **Frontend receives session** with `provider_token`
6. **Backend processes token**:
   - Uses `provider_token` to fetch user's Facebook Pages
   - Gets page access tokens
   - Stores page tokens in database
7. **Connection complete** - User can now publish to Facebook

**Your Supabase Project:**
- Dashboard: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz
- Callback URL: `https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback`

### Benefits of Using Supabase:

✅ **Automatic Redirect URI Management** - No need to manually configure redirect URIs  
✅ **Secure Token Handling** - Tokens are managed securely by Supabase  
✅ **Session Management** - Automatic token refresh and session handling  
✅ **Built-in Security** - Supabase handles OAuth security best practices  
✅ **Easy Integration** - Simple API for OAuth flows  

## Step 8: Test Your Setup

1. Start your frontend and backend servers
2. Navigate to MarketMate (`/ads`)
3. Click **"Connect Facebook"**
4. You should be redirected to Facebook login
5. After authorizing, you'll be redirected back
6. Check that the "Facebook Connected" badge appears
7. Try publishing a campaign

## Troubleshooting

### Error: "Invalid OAuth Redirect URI"

- Make sure you've added the Supabase callback URL to Facebook App settings
- **Required URL**: `https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback`
- Check for typos in the URL
- Verify the URL is added in Facebook App Settings > Basic > Valid OAuth Redirect URIs

### Error: "App Not Setup"

- Verify Facebook provider is enabled in Supabase
- Check that App ID and App Secret are correct
- Ensure Facebook App is not in restricted mode (for development)

### Error: "Permissions Not Granted"

- Make sure all required permissions are requested in Facebook App Review
- Check that permissions are approved (for production)
- Verify scopes are correctly set in Supabase Facebook provider config

### Error: "No Facebook Pages Found"

- User must have at least one Facebook Page
- User must be an admin of the Page
- Check that `pages_show_list` permission is granted

### Session Not Found

- Check browser console for Supabase errors
- Verify `VITE_SUPABASE_URL` is set to: `https://zfbqgnnbfkadwprqahbz.supabase.co`
- Verify `VITE_SUPABASE_ANON_KEY` is set correctly
- Check that Supabase project is active: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz

## Security Notes

1. **Never commit** service role keys to version control
2. **Use environment variables** for all sensitive credentials
3. **Anon key is safe** for frontend use (has Row Level Security)
4. **Service role key** should only be used on the backend
5. **Rotate keys** if compromised

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Facebook Page Access Tokens](https://developers.facebook.com/docs/pages/access-tokens)

## Migration from Direct OAuth

If you were using direct Facebook OAuth before:

1. The old endpoints (`/api/auth/facebook/connect`) are still available as fallback
2. Supabase OAuth is now the primary method
3. Existing connections will continue to work
4. New connections will use Supabase

