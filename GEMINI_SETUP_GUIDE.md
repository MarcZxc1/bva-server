# Gemini AI Image Generation - Setup Guide

## Quick Start

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy the generated key (starts with `AIza...`)

### Step 2: Add API Key to Environment

Edit `ml-service/.env` and add:

```bash
# Google Gemini API (for AI image generation)
GEMINI_API_KEY=AIzaSyD...your_actual_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
```

### Step 3: Verify Dependencies

```bash
cd ml-service
pip3 install google-generativeai==0.8.3
```

### Step 4: Restart ML Service

**Stop the current service** (Ctrl+C if running in terminal), then:

```bash
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Step 5: Test

```bash
# Test image generation
curl -X POST http://localhost:8001/api/v1/ads/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Coca Cola",
    "playbook": "Flash Sale",
    "style": "modern"
  }' | jq .
```

**Expected Response (with API key):**
```json
{
  "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Expected Response (without API key - fallback):**
```json
{
  "image_url": "https://placehold.co/1200x630/FF6B6B/FFFFFF?text=Flash+Sale:+Coca+Cola"
}
```

## How It Works

### Architecture

```
Frontend Request
    ↓
Backend API Gateway (Node.js)
    ↓
ML Service (Python/FastAPI)
    ↓
    ├─ GEMINI_API_KEY set? ─→ YES ─→ Call Gemini Imagen 3 ─→ AI-generated image
    │
    └─ GEMINI_API_KEY set? ─→ NO ──→ Use placeholder service ─→ Template image
```

### With Gemini API (Recommended)

**Benefits:**
- ✅ AI-generated unique images
- ✅ Fully customizable based on product
- ✅ Professional quality
- ✅ Multiple style variations
- ✅ Free tier: 60 images/minute

**Process:**
1. Receives request with product name and playbook
2. Builds custom prompt based on playbook style
3. Calls Google Gemini Imagen 3 API
4. Converts generated image to base64
5. Returns as data URL for immediate display

### Without Gemini API (Fallback)

**Benefits:**
- ✅ No setup required
- ✅ Instant response (< 100ms)
- ✅ No costs
- ⚠️ Template-based (not unique)

**Process:**
1. Detects missing API key
2. Logs warning about fallback mode
3. Generates placeholder URL with color coding
4. Returns placeholder image

## Playbook Styles

Each playbook generates unique prompts and visuals:

| Playbook | Colors | Visual Elements | Mood |
|----------|--------|-----------------|------|
| Flash Sale | Red/Orange (#FF6B6B) | Lightning, fire effects | Urgent, energetic |
| New Arrival | Turquoise/Blue (#4ECDC4) | NEW badge, sparkles | Fresh, exciting |
| Best Seller | Gold/Yellow (#FFE66D) | Stars, trophies | Premium, popular |
| Bundle Up! | Green (#A8E6CF) | Gift boxes, multiple items | Value, savings |

## Troubleshooting

### Issue: Still getting placeholder images after adding API key

**Solution:**
```bash
# 1. Verify API key is in .env file
cat ml-service/.env | grep GEMINI_API_KEY

# 2. Restart ML service (IMPORTANT!)
# Stop current process (Ctrl+C), then:
cd ml-service
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# 3. Check logs for errors
# Look for "gemini_not_configured" or "gemini_api_error" in output
```

### Issue: "Invalid API key" error

**Solution:**
1. Verify your API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Check for extra spaces in `.env` file
3. Ensure key starts with `AIza`
4. Try generating a new API key

### Issue: "Quota exceeded" error

**Solution:**
- Free tier: 60 requests per minute
- Wait 1 minute and try again
- Or upgrade to paid tier for higher limits

### Issue: "API not enabled" error

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Generative Language API"
3. Wait a few minutes for activation
4. Try again

## API Limits & Pricing

### Free Tier (No Credit Card Required)
- **60 requests per minute**
- **1,500 requests per day**
- Perfect for development and testing

### Paid Tier
- **After free tier:** ~$0.013 per image
- Much cheaper than alternatives:
  - DALL-E 3: $0.040 per image
  - Midjourney: $10-$60/month

Learn more: [Gemini API Pricing](https://ai.google.dev/pricing)

## Testing Checklist

- [ ] Gemini API key obtained
- [ ] API key added to `ml-service/.env`
- [ ] Dependencies installed (`google-generativeai`)
- [ ] ML service restarted
- [ ] Test endpoint returns base64 image (not placeholder URL)
- [ ] Frontend displays generated images
- [ ] All 4 playbooks tested

## Examples

### Test All Playbooks

```bash
# Flash Sale
curl -X POST http://localhost:8001/api/v1/ads/generate-image \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Coca Cola", "playbook": "Flash Sale"}'

# New Arrival
curl -X POST http://localhost:8001/api/v1/ads/generate-image \
  -H "Content-Type: application/json" \
  -d '{"product_name": "iPhone 15", "playbook": "New Arrival"}'

# Best Seller
curl -X POST http://localhost:8001/api/v1/ads/generate-image \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Nike Air Max", "playbook": "Best Seller Spotlight"}'

# Bundle Up!
curl -X POST http://localhost:8001/api/v1/ads/generate-image \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Starter Kit", "playbook": "Bundle Up!"}'
```

## Production Deployment

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_production_api_key

# Optional (with defaults)
GEMINI_MODEL=gemini-2.0-flash-exp
```

### Security Best Practices

1. **Never commit API keys to Git**
   ```bash
   # Verify .env is in .gitignore
   cat .gitignore | grep .env
   ```

2. **Use environment variables in production**
   ```bash
   export GEMINI_API_KEY=your_key
   ```

3. **Rotate keys regularly**
   - Generate new key every 90 days
   - Delete old keys from Google AI Studio

4. **Monitor usage**
   - Check [Google AI Studio](https://makersuite.google.com/) for usage stats
   - Set up billing alerts

## Need Help?

- **Google AI Studio**: https://makersuite.google.com/
- **Gemini API Docs**: https://ai.google.dev/docs
- **Pricing**: https://ai.google.dev/pricing
- **Support**: https://developers.google.com/ai/support

## What's Next?

Once image generation is working:

1. ✅ Test all 4 playbook styles
2. ✅ Verify images display in frontend
3. ✅ Test with different product names
4. 🔄 Optional: Add image storage (S3, Cloud Storage)
5. 🔄 Optional: Add image caching for faster responses
6. 🔄 Optional: Add custom style preferences

Happy generating! 🎨
