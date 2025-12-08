# Privacy Policy Edge Function

This Supabase Edge Function serves the Privacy Policy page required by Facebook OAuth.

## Deployment

```bash
# Deploy the function
supabase functions deploy privacy-policy
```

## URL

After deployment, the function will be available at:

```
https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/privacy-policy
```

## Configure in Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Enter **Privacy Policy URL**:

```
https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/privacy-policy
```

## Testing

```bash
# Test locally (if Supabase is running locally)
curl http://localhost:54321/functions/v1/privacy-policy

# Test deployed function
curl https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/privacy-policy
```

## Features

- Returns HTML privacy policy page
- CORS enabled for Facebook access
- Cached for 1 hour
- Mobile-responsive design
- Links to Terms of Service and Data Deletion Instructions

