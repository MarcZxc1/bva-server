# Facebook & Instagram Integration Guide

## Overview

The MarketMate feature now supports **automatic posting** of generated ads to Facebook and Instagram using the Meta Business API.

## Features

✅ Generate AI-powered ads (copy + image)
✅ Post directly to Facebook Pages
✅ Post to Instagram Business Accounts
✅ Post to both platforms simultaneously
✅ Schedule posts for later
✅ Automatic hashtag inclusion
✅ Image upload handling

## Setup Steps

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" type
4. Fill in app details and create

### 2. Get Access Tokens

#### For Facebook Pages:

1. In your Facebook App, go to **Tools** → **Graph API Explorer**
2. Select your app
3. Add permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
4. Click "Generate Access Token"
5. **Important**: Convert to long-lived token:
   ```bash
   curl "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```

#### For Instagram Business:

1. Link Instagram Business Account to Facebook Page
2. Use the same access token as Facebook (if connected)
3. Or generate Instagram-specific token with permissions:
   - `instagram_basic`
   - `instagram_content_publish`

### 3. Get Account IDs

#### Facebook Page ID:
```bash
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_TOKEN"
```

#### Instagram Account ID:
```bash
curl "https://graph.facebook.com/v18.0/PAGE_ID?fields=instagram_business_account&access_token=YOUR_TOKEN"
```

### 4. Configure Environment

Edit `ml-service/.env`:

```bash
# Social Media APIs
FACEBOOK_ACCESS_TOKEN=YOUR_FACEBOOK_PAGE_ACCESS_TOKEN
INSTAGRAM_ACCESS_TOKEN=YOUR_INSTAGRAM_ACCESS_TOKEN
```

## API Usage

### Endpoint: Generate and Post

```http
POST /api/v1/ads/generate-and-post
Content-Type: application/json

{
  "product_name": "iPhone 15 Pro",
  "playbook": "Flash Sale",
  "discount": "50% OFF",
  "post_to_facebook": true,
  "post_to_instagram": true,
  "facebook_page_id": "123456789",
  "instagram_account_id": "987654321",
  "schedule_time": null
}
```

### Response Example

```json
{
  "success": true,
  "posted_to": 2,
  "total_platforms": 2,
  "results": {
    "facebook": {
      "success": true,
      "platform": "facebook",
      "post_id": "123456789_987654321",
      "post_url": "https://facebook.com/123456789_987654321",
      "scheduled": false
    },
    "instagram": {
      "success": true,
      "platform": "instagram",
      "post_id": "abc123xyz456",
      "post_url": "https://instagram.com/p/abc123xyz456"
    }
  }
}
```

## Testing

### 1. Test Ad Generation Only

```bash
curl -X POST http://localhost:8001/api/v1/ads/generate \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Test Product",
    "playbook": "Flash Sale",
    "discount": "50% OFF"
  }'
```

### 2. Test Facebook Posting

```bash
curl -X POST http://localhost:8001/api/v1/ads/generate-and-post \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "iPhone 15 Pro",
    "playbook": "Flash Sale",
    "discount": "50% OFF",
    "post_to_facebook": true,
    "post_to_instagram": false,
    "facebook_page_id": "YOUR_PAGE_ID"
  }'
```

### 3. Test Both Platforms

```bash
curl -X POST http://localhost:8001/api/v1/ads/generate-and-post \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Nike Air Max",
    "playbook": "New Arrival",
    "post_to_facebook": true,
    "post_to_instagram": true,
    "facebook_page_id": "YOUR_FB_PAGE_ID",
    "instagram_account_id": "YOUR_IG_ACCOUNT_ID"
  }'
```

## Important Notes

### Image Requirements

**Facebook:**
- Accepts URLs and base64 images
- Automatically uploads base64 images

**Instagram:**
- Requires publicly accessible URLs only
- Base64 images must be hosted on a CDN first
- Images should be at least 1080x1080px

### Scheduling Posts

```json
{
  "schedule_time": "2025-12-04T15:00:00Z",
  ...
}
```

**Note:** Scheduled posts are only supported on Facebook.

### Rate Limits

- **Facebook**: 200 API calls per hour per user
- **Instagram**: 25 API calls per 24 hours for content publishing

## Troubleshooting

### Error: "Invalid OAuth access token"

**Solution:**
- Token expired - generate a new long-lived token
- Check token has correct permissions
- Verify token is for the correct app

### Error: "Instagram requires publicly accessible image URLs"

**Solution:**
- The generated image is base64
- Upload to your CDN/S3 bucket first
- Or use placeholder URL images

### Error: "Page ID not found"

**Solution:**
- Verify Page ID is correct
- Check access token has access to this page
- Ensure Page is published (not draft)

## Frontend Integration

Update your frontend to call the new endpoint:

```typescript
// bva-frontend/src/api/ai.service.ts

export const generateAndPostAd = async (data: {
  product_name: string;
  playbook: string;
  discount?: string;
  facebook_page_id: string;
  instagram_account_id: string;
}) => {
  const response = await mainApi.post('/ads/generate-and-post', data);
  return response.data;
};
```

## Security Best Practices

1. **Never commit tokens to Git**
   ```bash
   # Always use environment variables
   ```

2. **Rotate tokens regularly**
   - Generate new tokens every 60 days

3. **Use page access tokens**
   - Not personal user tokens

4. **Monitor API usage**
   - Check Facebook's API usage dashboard

## Next Steps

1. ✅ Set up Facebook App
2. ✅ Get access tokens
3. ✅ Configure `.env` file
4. ✅ Test with one platform
5. ✅ Test with both platforms
6. ✅ Integrate into frontend
7. 🔄 Add analytics tracking
8. 🔄 Add post performance metrics

## Need Help?

- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Meta Business Help](https://www.facebook.com/business/help)
