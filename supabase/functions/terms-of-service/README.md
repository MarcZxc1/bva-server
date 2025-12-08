# Terms of Service Edge Function

This Supabase Edge Function serves the Terms of Service page required by Facebook OAuth.

## Deployment

```bash
# Deploy the function
supabase functions deploy terms-of-service
```

## URL

After deployment, the function will be available at:

```
https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/terms-of-service
```

## Configure in Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Enter **Terms of Service URL**:

```
https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/terms-of-service
```

## Testing

```bash
# Test locally (if Supabase is running locally)
curl http://localhost:54321/functions/v1/terms-of-service

# Test deployed function
curl https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/terms-of-service
```

## Features

- Returns HTML terms of service page
- CORS enabled for Facebook access
- Cached for 1 hour
- Mobile-responsive design
- Links to Privacy Policy and Data Deletion Instructions

