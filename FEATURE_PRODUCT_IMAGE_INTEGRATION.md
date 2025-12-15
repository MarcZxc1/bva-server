# Product Image Integration Feature

## Overview
This feature enhancement allows MarketMate to fetch real product images from Shopee-Clone and Lazada-Clone platforms when generating AI-powered advertisements. This provides more accurate and contextual ad generation with actual product visuals.

## Implementation Date
December 15, 2025

## Components Modified

### Backend (server/)

#### 1. **New Service: `productImage.service.ts`**
**Location:** `server/src/service/productImage.service.ts`

**Purpose:** Fetches product images from integrated platforms (Shopee-Clone, Lazada-Clone)

**Key Functions:**
- `getProductWithImage(productId: string)` - Main function that:
  - Checks if BVA database already has the image (cache)
  - If not, fetches from the source platform (Shopee/Lazada)
  - Updates BVA database with fetched image
  - Returns product data with imageUrl
  
- `getProductImageByExternalId(externalId: string, platform: string)` - Helper for direct platform queries

**Features:**
- ✅ Caching mechanism (stores fetched images in BVA database)
- ✅ Multi-platform support (Shopee, Lazada)
- ✅ Graceful error handling
- ✅ Detailed logging for debugging
- ✅ Respects active integrations only

#### 2. **Product Controller Enhancement**
**Location:** `server/src/controllers/product.controller.ts`

**New Endpoint:** `GET /api/products/:id/with-image`

**Response Format:**
```json
{
  "id": "product-uuid",
  "name": "Product Name",
  "imageUrl": "https://platform.com/image.jpg",
  "platform": "SHOPEE",
  "externalId": "SHOPEE-123"
}
```

#### 3. **Product Routes Update**
**Location:** `server/src/routes/product.routes.ts`

**New Route:** `GET /:id/with-image`

### Frontend (bva-frontend/)

#### 1. **AdGeneratorDialog Component Enhancement**
**Location:** `bva-frontend/src/components/AdGeneratorDialog.tsx`

**New Props:**
- `initialProductId?: string` - Pre-selected product from SmartShelf
- `initialProductImageUrl?: string` - Pre-fetched product image URL

**New State:**
- `productImageUrl` - Stores fetched product image

**Flow:**
1. Dialog opens with optional product ID
2. Fetches product image from backend API
3. Passes image URL to Gemini API for context-aware ad generation
4. Displays product image in the dialog

#### 2. **MarketMate Page Enhancement**
**Location:** `bva-frontend/src/pages/MarketMate.tsx`

**New Features:**
- Product preview card when navigating from SmartShelf
- Displays selected product with image
- "Clear Selection" button to reset
- All AdGeneratorDialog instances now receive product data
- Product context passed to all campaign playbooks

**Visual Changes:**
- New card shows selected product from SmartShelf
- Image preview (80x80px) with product name
- Highlighted border (border-primary/50)
- Informative message about ad generation readiness

### Configuration

#### Environment Variables
**Location:** `server/.env.example`

**New Variables:**
```env
# Platform Integration URLs
SHOPEE_CLONE_URL=http://localhost:5174
LAZADA_CLONE_URL=http://localhost:3001
```

**Default Fallbacks:**
- Shopee-Clone: `http://localhost:5174`
- Lazada-Clone: `http://localhost:3001`

## User Flow

### SmartShelf → MarketMate Integration

1. **User navigates to SmartShelf**
   - Views at-risk inventory items
   - Identifies product needing promotional campaign

2. **Click "Generate Ad" button on product**
   - Navigates to MarketMate
   - Passes product ID and basic info via React Router state

3. **MarketMate receives product context**
   - Displays product preview card at top
   - Shows product image and name
   - All campaign playbooks pre-filled with product context

4. **User selects campaign playbook**
   - Opens AdGeneratorDialog
   - Dialog automatically fetches product image
   - Image is sent to Gemini AI for context

5. **AI generates ad with product awareness**
   - Copy mentions actual product details
   - Generated image incorporates product context
   - More accurate and relevant marketing content

## API Integration

### Backend → Platform Clones

**Shopee-Clone API:**
```
GET http://localhost:5174/api/products/{platformProductId}
Response: { success: true, data: { image: "url" } }
```

**Lazada-Clone API:**
```
GET http://localhost:3001/api/products/{platformProductId}
Response: { success: true, data: { image: "url" } }
```

### Frontend → Backend

**Fetch Product with Image:**
```
GET /api/products/{productId}/with-image
```

### Frontend → ML Service

**Generate Ad Image (with product context):**
```
POST /api/v1/ads/generate-ad-image
Body: {
  product_name: "Product Name",
  campaign_message: "Ad copy...",
  product_image_url: "https://platform.com/image.jpg",  // NEW
  style: "vibrant"
}
```

## Technical Details

### Product Identification

Products are linked to platforms via:
- **externalId format:** `"PLATFORM-ID"` (e.g., `"SHOPEE-123"`, `"LAZADA-456"`)
- **Shop.platform:** Platform enum (SHOPEE, LAZADA, BVA)
- **Integration table:** Links shops to platforms with settings

### Caching Strategy

1. **First Request:**
   - Check BVA Product.imageUrl
   - If null, fetch from platform
   - Update Product.imageUrl
   - Return image

2. **Subsequent Requests:**
   - Return cached Product.imageUrl
   - No external API calls

### Error Handling

**Graceful Degradation:**
- Missing externalId → Returns null imageUrl
- No active integration → Returns null imageUrl
- Platform API failure → Returns null imageUrl
- Invalid product ID → Throws 404 error

**User Experience:**
- Missing images don't block ad generation
- Gemini AI generates ads without product image if unavailable
- Clear logging for troubleshooting

## Benefits

### For Users
- ✅ More accurate AI-generated ads
- ✅ Product-aware marketing copy
- ✅ Visual consistency with actual products
- ✅ Seamless SmartShelf → MarketMate workflow
- ✅ Preview product before generating ads

### For System
- ✅ Efficient caching mechanism
- ✅ Reduced redundant API calls
- ✅ Platform-agnostic design
- ✅ Easy to extend to new platforms
- ✅ Respects integration settings

## Testing Checklist

- [ ] Test image fetch from Shopee-Clone
- [ ] Test image fetch from Lazada-Clone
- [ ] Test caching (second request shouldn't hit platform)
- [ ] Test with missing externalId
- [ ] Test with no active integration
- [ ] Test SmartShelf → MarketMate navigation
- [ ] Test product preview display
- [ ] Test "Clear Selection" button
- [ ] Test all campaign playbooks with product context
- [ ] Test ad generation with and without product images

## Future Enhancements

1. **Image Optimization:**
   - Resize/compress images for faster loading
   - CDN integration for image delivery

2. **Multiple Images:**
   - Support product galleries
   - Let users choose which image to use

3. **Image Analytics:**
   - Track which product images generate better engagement
   - A/B testing for ad images

4. **Platform Sync:**
   - Periodic background job to sync images
   - Webhook integration for real-time updates

5. **Fallback Images:**
   - Default placeholder images by category
   - AI-generated product images when unavailable

## Documentation References

- **Main Project Documentation:** `BVA_PROJECT_DOCUMENTATION.md`
- **API Reference:** See "API Endpoints" section in main documentation
- **MarketMate Feature:** Section 5.0 in main documentation
- **SmartShelf Feature:** Section 3.0 in main documentation

## Contributors

- Implementation: AI Assistant (GitHub Copilot)
- Feature Request: Marc Gerald Dagode
- Testing: Team BVA

---

**Status:** ✅ Implemented and Ready for Testing
**Version:** 1.0.0
**Last Updated:** December 15, 2025
