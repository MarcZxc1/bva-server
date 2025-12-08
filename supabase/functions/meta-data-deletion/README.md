# Meta Data Deletion Edge Function

This Supabase Edge Function handles Meta's (Facebook) user data deletion callback requests.

## What It Does

1. Receives POST request from Meta with `signed_request` parameter
2. Parses the signed request to extract Facebook user ID
3. Deletes user from Supabase Auth
4. Calls your backend API to delete user data from local database
5. Returns confirmation code and status URL to Meta

## Deployment

### 1. Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase

# Or using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
cd /home/marc/cloned/bva-server
supabase link --project-ref zfbqgnnbfkadwprqahbz
```

### 4. Set Environment Variables

Set secrets in Supabase Dashboard or via CLI:

```bash
# Set Facebook App Secret (optional, for signature verification)
supabase secrets set FACEBOOK_APP_SECRET=your-facebook-app-secret

# Set Backend URL (optional, defaults to localhost:3000)
supabase secrets set BACKEND_URL=https://your-backend-url.com
```

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in Edge Functions.

### 5. Deploy the Function

```bash
supabase functions deploy meta-data-deletion
```

### 6. Get the Function URL

After deployment, your function will be available at:

```
https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/meta-data-deletion
```

## Configure in Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Settings** → **Basic**
4. In **"User Data Deletion"** section, enter:

```
https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/meta-data-deletion
```

## Backend API Endpoint

The function calls your backend to delete local user data. You need to create this endpoint:

### Endpoint: `DELETE /api/auth/facebook/delete-user`

**Request Body:**
```json
{
  "facebookUserId": "123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User data deleted"
}
```

## Testing

### Test with curl:

```bash
# Simulate Meta's request
curl -X POST https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/meta-data-deletion \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "signed_request=YOUR_SIGNED_REQUEST"
```

### Test locally:

```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve meta-data-deletion

# Test
curl -X POST http://localhost:54321/functions/v1/meta-data-deletion \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "signed_request=YOUR_SIGNED_REQUEST"
```

## Response Format

Meta expects this response format:

```json
{
  "url": "https://your-backend.com/data-deletion-status?code=DEL-1234567890-abc123",
  "confirmation_code": "DEL-1234567890-abc123"
}
```

## Security Notes

1. **Service Role Key**: The function uses Supabase Service Role Key (automatically available)
2. **Signature Verification**: Currently, signature verification is optional. For production, you should verify the HMAC signature.
3. **CORS**: The function allows CORS from any origin (Meta's requirement)

## Troubleshooting

### Function not found
- Make sure you've deployed the function: `supabase functions deploy meta-data-deletion`
- Check the function name matches exactly

### Environment variables not set
- Set secrets via CLI: `supabase secrets set KEY=value`
- Or in Supabase Dashboard → Project Settings → Edge Functions → Secrets

### Backend API not responding
- Check `BACKEND_URL` secret is set correctly
- Ensure your backend is accessible from the internet
- The function will still return success to Meta even if backend deletion fails (logs the error)

