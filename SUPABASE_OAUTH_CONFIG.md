# Supabase OAuth App Configuration Guide

## OAuth App Settings

### Name
```
Facebook Oauth2.0
```
or
```
BVA Facebook OAuth
```

### Redirect URIs

Add **ALL** of these redirect URIs (one per line or separated by commas):

#### 1. Supabase Callback URL (Required)
```
https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback
```

**Your Supabase Project:**
- Project Dashboard: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz
- Project Reference: `zfbqgnnbfkadwprqahbz`
- API Settings: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz/settings/api

#### 2. Frontend Development URL
```
http://localhost:5173/ads?facebook_connected=true
```

#### 3. Frontend Production URL (if applicable)
```
https://your-production-domain.com/ads?facebook_connected=true
```

#### 4. Alternative Development Ports (if you use different ports)
```
http://localhost:8080/ads?facebook_connected=true
http://localhost:3000/ads?facebook_connected=true
```

### Complete Example

For your Supabase project (`zfbqgnnbfkadwprqahbz`), your redirect URIs should be:

```
https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback
http://localhost:5173/ads?facebook_connected=true
http://localhost:8080/ads?facebook_connected=true
```

If you have a production domain, add it too:
```
https://your-production-domain.com/ads?facebook_connected=true
```

## Public Client Setting

### Should you enable "Public Client"?

**For Web Applications: NO** (Leave it unchecked)

- Public Client (PKCE) is designed for **native mobile apps** and **SPAs** that cannot securely store client secrets
- Since you have a backend server that can securely store the client secret, you should **NOT** enable this
- Your backend will handle the OAuth flow securely with the client secret

**Only enable if:**
- You're building a pure client-side app with no backend
- You're building a mobile app
- You cannot securely store the client secret

## Important Notes

1. **Supabase Callback is Required**: The Supabase callback URL (`/auth/v1/callback`) is **mandatory** - Supabase needs this to process the OAuth response

2. **Frontend URLs are Optional but Recommended**: These are where users land after Supabase processes the OAuth. Supabase will redirect here after successful authentication.

3. **Order Doesn't Matter**: You can add redirect URIs in any order

4. **Wildcards Not Supported**: You cannot use wildcards like `*.supabase.co` - each URL must be exact

5. **HTTPS Required for Production**: Production URLs must use HTTPS

## Step-by-Step Configuration

1. **Your Supabase Project**:
   - Project Dashboard: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz
   - Project Reference: `zfbqgnnbfkadwprqahbz`
   - API Settings: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz/settings/api

2. **Add Redirect URIs**:
   - Click "Add redirect URI" for each URL
   - Or paste them one per line in the text field
   - Make sure the Supabase callback URL is included

3. **Save Configuration**:
   - Click "Save" or "Create"
   - The OAuth app will be created

4. **Copy Client ID and Secret**:
   - After creation, you'll see:
     - **Client ID** (this is your `FACEBOOK_APP_ID`)
     - **Client Secret** (this is your `FACEBOOK_APP_SECRET`)
   - Save these for your `.env` files

## Verification

After configuration, test the flow:

1. User clicks "Connect Facebook" in MarketMate
2. Redirects to Facebook login
3. After login, Facebook redirects to: `https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback`
4. Supabase processes the OAuth
5. Supabase redirects to: `http://localhost:5173/ads?facebook_connected=true` (or your production URL)
6. Your app receives the session and processes it

**Your Supabase Project:**
- Dashboard: https://supabase.com/dashboard/project/zfbqgnnbfkadwprqahbz
- Callback URL: `https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback`

## Troubleshooting

**Error: "Invalid redirect URI"**
- Make sure the Supabase callback URL is exactly: `https://zfbqgnnbfkadwprqahbz.supabase.co/auth/v1/callback`
- Check for typos in the project reference
- Ensure no trailing slashes
- Verify the URL is added in your OAuth app settings

**Error: "Redirect URI mismatch"**
- Verify all redirect URIs are added in Supabase OAuth app settings
- Check that the URL in your code matches one of the configured URIs
- Ensure protocol (http/https) matches

