# Product Fetch API Documentation

This document explains how products are fetched and synchronized across the BVA ecosystem: **Shopee-Clone**, **BVA Server**, and **BVA Frontend**.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Flow](#architecture-flow)
3. [Integration Architecture](#integration-architecture)
4. [Integration Setup Flow](#integration-setup-flow)
5. [Data Synchronization Process](#data-synchronization-process)
6. [Data Flow Architecture](#data-flow-architecture)
7. [Platform Integration Pattern](#platform-integration-pattern)
8. [API Endpoints](#api-endpoints)
9. [Frontend Product Display](#frontend-product-display)
10. [Data Flow Diagrams](#data-flow-diagrams)
11. [Extending to Other Platforms](#extending-to-other-platforms)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The product fetching system enables BVA to read product data from Shopee-Clone and display it in the BVA Frontend. The system follows a **read-only** approach where BVA only reads data from Shopee-Clone and never modifies it.

### Key Principles

- **Read-Only Sync**: BVA only reads from Shopee-Clone API, never writes
- **Unified Access**: Products from both synced (Shopee-Clone) and local (BVA-created) sources are displayed together
- **Real-Time Refresh**: Users can manually trigger sync to get the latest product data
- **Shop Linking**: Users can link Shopee-Clone shops to their BVA account for data access

---

## Architecture Flow

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────┐
│  Shopee-Clone   │ ──────> │ BVA Server   │ ──────> │ BVA Frontend │
│   (Source)      │  GET    │  (Sync)      │  GET    │  (Display)   │
└─────────────────┘         └──────────────┘         └──────────────┘
     Products                    Database                 UI Components
```

### Component Roles

1. **Shopee-Clone**: E-commerce platform that stores seller products
2. **BVA Server**: Middleware that syncs products from Shopee-Clone to BVA database
3. **BVA Frontend**: React application that displays products to users

---

## Integration Architecture

### Core Components

The integration system consists of three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Backend    │  │  External    │      │
│  │  Integration │  │  Integration │  │  Platform    │      │
│  │    Modal     │  │   Service    │  │     API      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Shop       │  │ Integration  │  │   Product    │      │
│  │   Access     │  │   Record     │  │    Data     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

**Integration Table** (`server/prisma/schema.prisma`):
```prisma
model Integration {
  id        String   @id @default(uuid())
  shopId   String
  platform  Platform // SHOPEE, TIKTOK, LAZADA, etc.
  settings  Json     // Stores platform-specific config (tokens, API keys, etc.)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  Shop      Shop     @relation(fields: [shopId], references: [id])
  
  @@unique([shopId, platform])
}
```

**ShopAccess Table** (for cross-platform shop linking):
```prisma
model ShopAccess {
  id        String   @id @default(uuid())
  userId    String
  shopId    String
  createdAt DateTime @default(now())
  
  User      User     @relation(fields: [userId], references: [id])
  Shop      Shop     @relation(fields: [shopId], references: [id])
  
  @@unique([userId, shopId])
}
```

### Integration States

1. **Not Connected**: No integration record exists
2. **Connected**: Integration record exists with valid token
3. **Active**: Integration is connected and terms are accepted
4. **Synced**: Data has been successfully synchronized

---

## Integration Setup Flow

### Complete Integration Process

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: User Initiates Integration                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to Settings → Platform Integrations           │
│    → Sees list of available platforms (Shopee, TikTok, etc.)     │
│    → Clicks "Connect" on desired platform                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Frontend opens platform-specific integration modal           │
│    → ShopeeCloneIntegrationModal for Shopee                      │
│    → TikTokIntegrationModal for TikTok (future)                  │
│    → Modal embeds external platform's auth page in iframe        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: External Platform Authentication                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. External platform checks authentication status               │
│    → If logged in: Returns shop info + auth token               │
│    → If not logged in: Shows login/register flow                 │
│    → After login: Returns shop info + auth token                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. External platform sends data to BVA via postMessage          │
│    Message: {                                                    │
│      type: 'PLATFORM_AUTH_SUCCESS',                             │
│      shop: { id, name },                                         │
│      token: 'platform_jwt_token'                                │
│    }                                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: BVA Backend Processing                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Frontend receives auth data and calls BVA API                 │
│    a) POST /api/shops/link                                       │
│       → Links external shop to user's BVA account                │
│       → Creates ShopAccess record                                │
│                                                                   │
│    b) POST /api/integrations                                     │
│       → Creates Integration record                               │
│       → Stores platform token in settings JSON                  │
│       → Sets platform type (SHOPEE, TIKTOK, etc.)                │
│                                                                   │
│    c) POST /api/integrations/:id/sync                            │
│       → Triggers initial data synchronization                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: Data Synchronization                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. BVA Server syncs data from external platform                  │
│    → Fetches products: GET /api/products/shop/:shopId            │
│    → Fetches sales: GET /api/orders/seller/:shopId               │
│    → Maps and saves to BVA database                             │
│    → Links via externalId field                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: Integration Complete                                    │
│    → Integration status: "Active"                                │
│    → Data available in BVA Frontend                               │
│    → User can use all BVA features with synced data              │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: User Authentication

When a user wants to connect their Shopee-Clone shop to BVA:

1. User navigates to **Settings → Platform Integrations** in BVA Frontend
2. Clicks "Connect" on Shopee-Clone platform
3. `ShopeeCloneIntegrationModal` opens an iframe to Shopee-Clone's `/bva-integration-check` page

**File**: `bva-frontend/src/components/ShopeeCloneIntegrationModal.tsx`

```typescript
// Modal embeds Shopee-Clone page in iframe
<iframe
  src={`${SHOPEE_CLONE_URL}/bva-integration-check`}
  className="w-full h-96 border rounded"
/>
```

### Step 2: Shopee-Clone Authentication Check

**File**: `shopee-clone/src/pages/BVAIntegrationCheck.tsx`

The Shopee-Clone page checks if the user is logged in:

```typescript
const { user, shop } = useAuth();

if (user && shop) {
  // Send shop info and token to BVA parent window
  window.parent.postMessage({
    type: 'SHOPEE_CLONE_AUTH_SUCCESS',
    shop: { id: shop.id, name: shop.name },
    token: authToken,
  }, '*');
} else {
  // Request authentication
  window.parent.postMessage({
    type: 'SHOPEE_CLONE_AUTH_REQUIRED',
  }, '*');
}
```

### Step 3: Shop Linking

**File**: `bva-frontend/src/pages/Settings.tsx`

When BVA receives shop info from Shopee-Clone:

```typescript
const handleShopeeConnect = async (shopId: string, shopName: string, shopeeToken: string) => {
  // 1. Link the shop to user's account
  await shopAccessApi.linkShop(shopId);
  
  // 2. Create integration record
  await createIntegrationMutation.mutateAsync({
    platform: "SHOPEE",
    shopeeToken: shopeeToken,
  });
  
  // 3. Trigger data sync
  await syncIntegrationMutation.mutateAsync(integrationId);
};
```

**API Endpoint**: `POST /api/shops/link`

**File**: `server/src/controllers/shopAccess.controller.ts`

```typescript
async linkShop(req: Request, res: Response) {
  const userId = (req as any).user.userId;
  const { shopId } = req.body;
  
  // Creates ShopAccess record linking user to shop
  await shopAccessService.linkShop(userId, shopId);
}
```

---

## Data Synchronization Process

### Step 1: Sync Trigger

**File**: `bva-frontend/src/pages/Settings.tsx`

User clicks "Sync" button or sync is triggered automatically after integration:

```typescript
const syncIntegration = async (integrationId: string) => {
  await integrationService.syncIntegration(integrationId);
};
```

**API Endpoint**: `POST /api/integrations/:id/sync`

### Step 2: Server-Side Sync

**File**: `server/src/controllers/integration.controller.ts`

```typescript
async syncIntegration(req: Request, res: Response) {
  const { id } = req.params;
  const integration = await prisma.integration.findUnique({ where: { id } });
  
  // Get Shopee-Clone token from integration settings
  const token = integration.settings.shopeeToken;
  
  // Call sync service
  const result = await shopeeIntegrationService.syncAllData(
    integration.shopId,
    token
  );
}
```

### Step 3: Fetch Products from Shopee-Clone

**File**: `server/src/service/shopeeIntegration.service.ts`

```typescript
async syncProducts(shopId: string, token: string): Promise<number> {
  // READ-ONLY GET request to Shopee-Clone API
  const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/products/shop/${shopId}`, {
    method: "GET", // READ-ONLY - no POST/PUT/PATCH/DELETE
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  
  const products: ShopeeProduct[] = await response.json();
  
  // Map and save to BVA database
  for (const product of products) {
    await prisma.product.upsert({
      where: { shopId_externalId: { shopId, externalId: product.id } },
      update: {
        name: product.name,
        price: product.price,
        stock: product.stock,
        imageUrl: product.image,
        // ... other fields
      },
      create: {
        shopId,
        externalId: product.id, // Links to Shopee-Clone product
        name: product.name,
        price: product.price,
        stock: product.stock,
        imageUrl: product.image,
        // ... other fields
      },
    });
  }
}
```

### Step 4: Data Mapping

**Shopee-Clone Product → BVA Product**

| Shopee-Clone Field | BVA Database Field | Purpose |
|-------------------|-------------------|---------|
| `product.id` | `Product.externalId` | Links to Shopee-Clone |
| `product.name` | `Product.name` | Display name |
| `product.price` | `Product.price` | Pricing for Restock Planner, MarketMate |
| `product.stock` | `Product.stock` | Inventory for SmartShelf, Restock Planner |
| `product.image` | `Product.imageUrl` | Image for MarketMate campaigns |
| `product.cost` | `Product.cost` | Cost for profit calculation |
| `product.description` | `Product.description` | Product details |
| `product.category` | `Product.category` | Category filtering |

---

## API Endpoints

### Shopee-Clone API (Source)

#### Get Products by Shop
```
GET /api/products/shop/:shopId
Authorization: Bearer <shopee_token>
```

**Response**:
```json
[
  {
    "id": "prod-123",
    "name": "Adobo",
    "price": 350,
    "cost": 150,
    "stock": 10,
    "image": "https://...",
    "description": "Delicious adobo",
    "category": "Food"
  }
]
```

**File**: `shopee-clone/src/...` (Shopee-Clone backend)

---

### BVA Server API (Sync & Storage)

#### Link Shop to User
```
POST /api/shops/link
Authorization: Bearer <bva_token>
Body: { "shopId": "shop-123" }
```

**File**: `server/src/controllers/shopAccess.controller.ts`

#### Create Integration
```
POST /api/integrations
Authorization: Bearer <bva_token>
Body: {
  "platform": "SHOPEE",
  "shopeeToken": "shopee_jwt_token"
}
```

**File**: `server/src/controllers/integration.controller.ts`

#### Sync Integration Data
```
POST /api/integrations/:id/sync
Authorization: Bearer <bva_token>
```

**File**: `server/src/controllers/integration.controller.ts`

#### Get Products by Shop
```
GET /api/products/shop/:shopId
Authorization: Bearer <bva_token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "bva-prod-456",
      "externalId": "prod-123",
      "name": "Adobo",
      "price": 350,
      "cost": 150,
      "stock": 10,
      "imageUrl": "https://...",
      "sku": "SHOPEE-prod-123",
      "shopId": "shop-123"
    }
  ]
}
```

**File**: `server/src/controllers/product.controller.ts`

---

### BVA Frontend API Client

#### Product Service
**File**: `bva-frontend/src/services/product.service.ts`

```typescript
export const productService = {
  fetchProducts: async (shopId: string): Promise<Product[]> => {
    const products = await apiClient.get<Product[]>(`/api/products/shop/${shopId}`);
    return products || [];
  },
};
```

#### React Query Hook
**File**: `bva-frontend/src/hooks/useProducts.ts`

```typescript
export function useProducts(shopId: string) {
  return useQuery<Product[]>({
    queryKey: ["products", shopId],
    queryFn: () => productService.fetchProducts(shopId),
    enabled: !!shopId,
  });
}
```

---

## Frontend Product Display

### Dashboard

**File**: `bva-frontend/src/pages/Dashboard.tsx`

```typescript
const { data: products } = useProducts(shopId);
// Products are displayed in dashboard metrics and charts
```

### SmartShelf

**File**: `bva-frontend/src/pages/SmartShelf.tsx`

```typescript
const { data: products } = useProducts(shopId);
// Products are analyzed for at-risk inventory
```

### Restock Planner

**File**: `bva-frontend/src/pages/RestockPlanner.tsx`

```typescript
const { data: products } = useProducts(shopId);
// Products are used for restock recommendations
```

### MarketMate

**File**: `bva-frontend/src/pages/MarketMate.tsx`

```typescript
// Products with images are used for ad generation
const productImageUrl = product?.imageUrl;
// Passed to AdGeneratorDialog for context-aware ad generation
```

---

## Data Flow Diagrams

### Complete Product Sync Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Connect" in BVA Settings                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ShopeeCloneIntegrationModal opens iframe                     │
│    → shopee-clone/bva-integration-check                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Shopee-Clone checks authentication                           │
│    → If logged in: sends shop info + token                      │
│    → If not: shows login modal                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. BVA receives shop info via postMessage                       │
│    → Links shop: POST /api/shops/link                           │
│    → Creates integration: POST /api/integrations                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Triggers sync: POST /api/integrations/:id/sync              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. BVA Server fetches from Shopee-Clone (READ-ONLY)              │
│    GET /api/products/shop/:shopId                               │
│    Authorization: Bearer <shopee_token>                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. BVA Server maps and saves to database                        │
│    → Upserts products with externalId                           │
│    → Maps: name, price, stock, imageUrl, cost, etc.             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. BVA Frontend fetches products                                │
│    GET /api/products/shop/:shopId                               │
│    → useProducts hook → productService                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Products displayed in UI                                     │
│    → Dashboard, SmartShelf, Restock Planner, MarketMate         │
└─────────────────────────────────────────────────────────────────┘
```

### Product Fetch Flow (After Sync)

```
┌─────────────────────────────────────────────────────────────────┐
│ User opens Dashboard/SmartShelf/Restock Planner                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ useProducts(shopId) hook is called                              │
│ → Checks if shopId exists                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ productService.fetchProducts(shopId)                            │
│ → apiClient.get(`/api/products/shop/${shopId}`)                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ BVA Server: GET /api/products/shop/:shopId                      │
│ → Extracts shopId from request (token or user's shops)          │
│ → Verifies user has access to shop                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ productService.getProductsByShop(shopId)                        │
│ → Queries database: Product.findMany({ shopId })                │
│ → Returns ALL products (synced + local)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Response sent to frontend                                       │
│ → Products array with all fields                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ React Query caches and returns products                         │
│ → UI components render products                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Implementation Details

### 1. Shop Access Verification

**File**: `server/src/utils/requestHelpers.ts`

```typescript
export async function getShopIdFromRequest(req: Request): Promise<string | null> {
  const user = (req as any).user;
  if (!user || !user.userId) return null;
  
  // Try shopId from token first
  if (user.shopId) return user.shopId;
  
  // Get all accessible shops (owned + linked)
  const accessibleShopIds = await shopAccessService.getAccessibleShops(user.userId);
  return accessibleShopIds[0] || null;
}
```

### 2. Product Query (No Platform Filter)

**File**: `server/src/service/product.service.ts`

```typescript
export async function getProductsByShop(shopId: string) {
  // Get ALL products for the shop (both synced and locally created)
  const products = await prisma.product.findMany({
    where: { 
      shopId,
      // No filter by externalId - shows all products
    },
    include: {
      Inventory: { take: 1 },
    },
    orderBy: { name: "asc" },
  });
  
  return products;
}
```

### 3. Read-Only Sync Verification

**File**: `server/src/service/shopeeIntegration.service.ts`

```typescript
/**
 * Sync all data from Shopee-Clone for a shop (READ-ONLY)
 * This method ONLY READS from Shopee-Clone API and writes to BVA database.
 * It does NOT write, create, or modify anything in Shopee-Clone.
 */
async syncAllData(shopId: string, token: string) {
  // All requests use GET method (read-only)
  // No POST, PUT, PATCH, or DELETE requests to Shopee-Clone
}
```

---

## Troubleshooting

### Products Not Appearing

1. **Check Shop Linking**
   ```bash
   # Verify shop is linked
   GET /api/shops/linked
   ```

2. **Check Integration Status**
   ```bash
   # Verify integration exists and is active
   GET /api/integrations
   ```

3. **Check Sync Status**
   ```bash
   # Manually trigger sync
   POST /api/integrations/:id/sync
   ```

4. **Verify Shopee-Clone API**
   ```bash
   # Test if Shopee-Clone returns products
   GET /api/products/shop/:shopId
   Authorization: Bearer <shopee_token>
   ```

### Common Issues

#### Issue: "No products found"
- **Cause**: Sync hasn't been run or failed
- **Solution**: Click "Sync" button in Settings → Integrations

#### Issue: "Shop ID not found"
- **Cause**: Shop not linked to user account
- **Solution**: Re-connect Shopee-Clone integration

#### Issue: "401 Unauthorized" from Shopee-Clone
- **Cause**: Token expired or invalid
- **Solution**: Re-authenticate and update integration token

#### Issue: Products appear but data is outdated
- **Cause**: Cache or sync not run recently
- **Solution**: Click "Sync" to refresh data

---

## Security Considerations

1. **Token Storage**: Shopee-Clone tokens are stored encrypted in integration settings
2. **Shop Access**: Users can only access shops they own or have been linked to
3. **Read-Only**: BVA never modifies Shopee-Clone data
4. **Authentication**: All API calls require valid JWT tokens

---

## Related Files

### Frontend
- `bva-frontend/src/components/ShopeeCloneIntegrationModal.tsx` - Integration modal
- `bva-frontend/src/pages/Settings.tsx` - Integration settings page
- `bva-frontend/src/services/product.service.ts` - Product API client
- `bva-frontend/src/hooks/useProducts.ts` - React Query hook
- `bva-frontend/src/pages/Dashboard.tsx` - Dashboard display
- `bva-frontend/src/pages/SmartShelf.tsx` - SmartShelf display
- `bva-frontend/src/pages/RestockPlanner.tsx` - Restock Planner display

### Backend
- `server/src/controllers/integration.controller.ts` - Integration endpoints
- `server/src/controllers/shopAccess.controller.ts` - Shop linking endpoints
- `server/src/controllers/product.controller.ts` - Product endpoints
- `server/src/service/shopeeIntegration.service.ts` - Sync service
- `server/src/service/product.service.ts` - Product service
- `server/src/service/shopAccess.service.ts` - Shop access service
- `server/src/utils/requestHelpers.ts` - Request helpers

### Shopee-Clone
- `shopee-clone/src/pages/BVAIntegrationCheck.tsx` - Integration check page
- `shopee-clone/src/contexts/AuthContext.tsx` - Auth context with postMessage

---

## Extending to Other Platforms

### Platform-Agnostic Architecture

The integration system is designed to be extensible. Here's how to add support for new platforms:

### Step-by-Step: Adding Lazada-Clone Integration (Example)

Based on the [Lazada-Clone repository](https://github.com/mndzjls21/lazada-clone.git), here's how to integrate it:

#### 1. Repository Structure

The Lazada-Clone is a Next.js application with:
- **Frontend**: Next.js 14 with App Router
- **Backend**: Node.js/Express (in `/backend` folder)
- **Tech Stack**: TypeScript, Tailwind CSS, React Icons

#### 2. Database Schema (Already Supports Multiple Platforms)

The `Integration` table already supports multiple platforms via the `Platform` enum:

```prisma
enum Platform {
  SHOPEE
  TIKTOK
  LAZADA  // Add this if not already present
  OTHER
}
```

#### 3. Create Lazada Integration Service

**File**: `server/src/service/lazadaIntegration.service.ts`

```typescript
import { LAZADA_CLONE_API_URL } from "../config";

class LazadaIntegrationService {
  /**
   * Sync all data from Lazada-Clone for a shop (READ-ONLY)
   * Follows the same pattern as ShopeeIntegrationService
   */
  async syncAllData(shopId: string, token: string): Promise<{ products: number; sales: number }> {
    console.log(`🔄 Starting Lazada-Clone sync for shop ${shopId}`);
    
    // Verify shop exists
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new Error(`Shop ${shopId} not found`);
    }
    
    // Sync products and sales in parallel
    const [productsCount, salesCount] = await Promise.all([
      this.syncProducts(shopId, token),
      this.syncSales(shopId, token),
    ]);
    
    return { products: productsCount, sales: salesCount };
  }
  
  /**
   * Fetch and sync products from Lazada-Clone (READ-ONLY)
   */
  async syncProducts(shopId: string, token: string): Promise<number> {
    // Fetch from Lazada-Clone API
    // Note: Adjust endpoint based on Lazada-Clone's actual API structure
    const response = await fetch(`${LAZADA_CLONE_API_URL}/api/products/shop/${shopId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    const products: LazadaProduct[] = await response.json();
    
    // Map and save to BVA database
    let syncedCount = 0;
    for (const product of products) {
      await prisma.product.upsert({
        where: {
          shopId_externalId: {
            shopId,
            externalId: product.id,
          },
        },
        update: {
          name: product.name,
          price: product.price,
          stock: product.stock,
          imageUrl: product.image_url || product.image,
          // ... map other fields based on Lazada-Clone schema
        },
        create: {
          shopId,
          externalId: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          imageUrl: product.image_url || product.image,
          sku: `LAZADA-${product.id}`,
          // ... other fields
        },
      });
      syncedCount++;
    }
    
    return syncedCount;
  }
  
  // Similar methods for syncSales, fetchProducts, fetchSales
}

export const lazadaIntegrationService = new LazadaIntegrationService();
```

#### 4. Update Integration Controller

**File**: `server/src/controllers/integration.controller.ts`

```typescript
import { shopeeIntegrationService } from "../service/shopeeIntegration.service";
import { lazadaIntegrationService } from "../service/lazadaIntegration.service";

async syncIntegration(req: Request, res: Response) {
  const { id } = req.params;
  const integration = await prisma.integration.findUnique({ where: { id } });
  
  const settings = integration.settings as any;
  const token = settings.lazadaToken || settings.shopeeToken; // Platform-specific token
  
  let result;
  
  // Route to platform-specific service
  switch (integration.platform) {
    case 'SHOPEE':
      result = await shopeeIntegrationService.syncAllData(integration.shopId, token);
      break;
    case 'LAZADA':
      result = await lazadaIntegrationService.syncAllData(integration.shopId, token);
      break;
    default:
      throw new Error(`Unsupported platform: ${integration.platform}`);
  }
  
  res.json({ success: true, data: result });
}
```

#### 5. Create Frontend Integration Modal

**File**: `bva-frontend/src/components/LazadaIntegrationModal.tsx`

```typescript
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const LAZADA_CLONE_URL = import.meta.env.VITE_LAZADA_CLONE_URL || "http://localhost:3001";

export function LazadaIntegrationModal({ 
  open, 
  onOpenChange, 
  onConnect 
}: Props) {
  const [shop, setShop] = useState<any>(null);
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== LAZADA_CLONE_URL) return;
      
      if (event.data.type === 'LAZADA_CLONE_AUTH_SUCCESS') {
        setShop(event.data.shop);
        onConnect(event.data.shop.id, event.data.shop.name, event.data.token);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <iframe 
          src={`${LAZADA_CLONE_URL}/bva-integration-check`}
          className="w-full h-96"
        />
      </DialogContent>
    </Dialog>
  );
}
```

#### 6. Add to Settings Page

**File**: `bva-frontend/src/pages/Settings.tsx`

```typescript
import { LazadaIntegrationModal } from "@/components/LazadaIntegrationModal";

const platforms = [
  {
    name: "Shopee-Clone",
    platform: "SHOPEE",
    modal: ShopeeCloneIntegrationModal,
  },
  {
    name: "Lazada-Clone",
    platform: "LAZADA",
    modal: LazadaIntegrationModal, // New platform
  },
];
```

#### 7. Create Integration Check Page in Lazada-Clone

**File**: `lazada-clone/src/app/bva-integration-check/page.tsx`

```typescript
'use client';

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Adjust based on Lazada-Clone's auth structure

export default function BVAIntegrationCheck() {
  const { user, shop } = useAuth(); // Adjust based on Lazada-Clone's auth structure
  
  useEffect(() => {
    if (user && shop) {
      // Send shop info to BVA parent window
      window.parent.postMessage({
        type: 'LAZADA_CLONE_AUTH_SUCCESS',
        shop: { id: shop.id, name: shop.name },
        token: localStorage.getItem('authToken') || '', // Adjust based on token storage
      }, '*');
    } else {
      window.parent.postMessage({
        type: 'LAZADA_CLONE_AUTH_REQUIRED',
      }, '*');
    }
  }, [user, shop]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div>Checking authentication...</div>
    </div>
  );
}
```

#### 8. Add Route in Lazada-Clone

**File**: `lazada-clone/src/app/layout.tsx` or routing configuration

```typescript
// Add route for /bva-integration-check
// In Next.js App Router, this is automatically handled by the page.tsx file
```

### Step-by-Step: Adding TikTok-Clone Integration

#### 1. Database Schema (Already Supports Multiple Platforms)

The `Integration` table already supports multiple platforms via the `Platform` enum:

```prisma
enum Platform {
  SHOPEE
  TIKTOK
  LAZADA
  OTHER
}
```

#### 2. Create TikTok Integration Service

**File**: `server/src/service/tiktokIntegration.service.ts`

```typescript
import { TIKTOK_CLONE_API_URL } from "../config";

class TikTokIntegrationService {
  /**
   * Sync all data from TikTok-Clone for a shop (READ-ONLY)
   * Follows the same pattern as ShopeeIntegrationService
   */
  async syncAllData(shopId: string, token: string): Promise<{ products: number; sales: number }> {
    console.log(`🔄 Starting TikTok-Clone sync for shop ${shopId}`);
    
    // Verify shop exists
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new Error(`Shop ${shopId} not found`);
    }
    
    // Sync products and sales in parallel
    const [productsCount, salesCount] = await Promise.all([
      this.syncProducts(shopId, token),
      this.syncSales(shopId, token),
    ]);
    
    return { products: productsCount, sales: salesCount };
  }
  
  /**
   * Fetch and sync products from TikTok-Clone (READ-ONLY)
   */
  async syncProducts(shopId: string, token: string): Promise<number> {
    // Fetch from TikTok-Clone API
    const response = await fetch(`${TIKTOK_CLONE_API_URL}/api/products/shop/${shopId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    const products: TikTokProduct[] = await response.json();
    
    // Map and save to BVA database
    let syncedCount = 0;
    for (const product of products) {
      await prisma.product.upsert({
        where: {
          shopId_externalId: {
            shopId,
            externalId: product.id,
          },
        },
        update: {
          name: product.name,
          price: product.price,
          stock: product.stock,
          imageUrl: product.image_url,
          // ... map other fields
        },
        create: {
          shopId,
          externalId: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          imageUrl: product.image_url,
          sku: `TIKTOK-${product.id}`,
          // ... other fields
        },
      });
      syncedCount++;
    }
    
    return syncedCount;
  }
  
  // Similar methods for syncSales, fetchProducts, fetchSales
}

export const tiktokIntegrationService = new TikTokIntegrationService();
```

#### 3. Update Integration Controller

**File**: `server/src/controllers/integration.controller.ts`

```typescript
import { shopeeIntegrationService } from "../service/shopeeIntegration.service";
import { tiktokIntegrationService } from "../service/tiktokIntegration.service";

async syncIntegration(req: Request, res: Response) {
  const { id } = req.params;
  const integration = await prisma.integration.findUnique({ where: { id } });
  
  const settings = integration.settings as any;
  const token = settings.tiktokToken || settings.shopeeToken; // Platform-specific token
  
  let result;
  
  // Route to platform-specific service
  switch (integration.platform) {
    case 'SHOPEE':
      result = await shopeeIntegrationService.syncAllData(integration.shopId, token);
      break;
    case 'TIKTOK':
      result = await tiktokIntegrationService.syncAllData(integration.shopId, token);
      break;
    default:
      throw new Error(`Unsupported platform: ${integration.platform}`);
  }
  
  res.json({ success: true, data: result });
}
```

#### 4. Create Frontend Integration Modal

**File**: `bva-frontend/src/components/TikTokIntegrationModal.tsx`

```typescript
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const TIKTOK_CLONE_URL = import.meta.env.VITE_TIKTOK_CLONE_URL || "http://localhost:8081";

export function TikTokIntegrationModal({ 
  open, 
  onOpenChange, 
  onConnect 
}: Props) {
  const [shop, setShop] = useState<any>(null);
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== TIKTOK_CLONE_URL) return;
      
      if (event.data.type === 'TIKTOK_CLONE_AUTH_SUCCESS') {
        setShop(event.data.shop);
        // Store token for later use
        onConnect(event.data.shop.id, event.data.shop.name, event.data.token);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <iframe 
          src={`${TIKTOK_CLONE_URL}/bva-integration-check`}
          className="w-full h-96"
        />
      </DialogContent>
    </Dialog>
  );
}
```

#### 5. Add to Settings Page

**File**: `bva-frontend/src/pages/Settings.tsx`

```typescript
import { TikTokIntegrationModal } from "@/components/TikTokIntegrationModal";

const platforms = [
  {
    name: "Shopee-Clone",
    platform: "SHOPEE",
    modal: ShopeeCloneIntegrationModal,
  },
  {
    name: "TikTok-Clone",
    platform: "TIKTOK",
    modal: TikTokIntegrationModal, // New platform
  },
];
```

#### 6. Create Integration Check Page in TikTok-Clone

**File**: `tiktok-clone/src/pages/BVAIntegrationCheck.tsx`

```typescript
import { useAuth } from "@/contexts/AuthContext";

export default function BVAIntegrationCheck() {
  const { user, shop } = useAuth();
  
  useEffect(() => {
    if (user && shop) {
      // Send shop info to BVA parent window
      window.parent.postMessage({
        type: 'TIKTOK_CLONE_AUTH_SUCCESS',
        shop: { id: shop.id, name: shop.name },
        token: localStorage.getItem('authToken'),
      }, '*');
    } else {
      window.parent.postMessage({
        type: 'TIKTOK_CLONE_AUTH_REQUIRED',
      }, '*');
    }
  }, [user, shop]);
  
  return <div>Checking authentication...</div>;
}
```

### Platform Integration Template

Use this template when adding a new platform:

```typescript
// 1. Integration Service Template
class [Platform]IntegrationService {
  async syncAllData(shopId: string, token: string) {
    // Fetch from platform API
    // Map to BVA schema
    // Save to database
  }
  
  async syncProducts(shopId: string, token: string) {
    // READ-ONLY GET request
    // Map products
    // Upsert to database
  }
  
  async syncSales(shopId: string, token: string) {
    // READ-ONLY GET request
    // Map sales
    // Upsert to database
  }
}

// 2. Frontend Modal Template
function [Platform]IntegrationModal({ onConnect }) {
  // Handle postMessage from platform
  // Call onConnect with shop info and token
}

// 3. Platform Integration Check Page
function BVAIntegrationCheck() {
  // Check auth status
  // Send shop info via postMessage
}
```

---

## Integration Data Flow (Detailed)

### Complete Integration Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRATION LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: INITIATION
───────────────────
User Action: Clicks "Connect" in Settings
    │
    ├─> Frontend: Opens platform integration modal
    ├─> Modal: Embeds external platform page in iframe
    └─> External Platform: Loads /bva-integration-check page

PHASE 2: AUTHENTICATION
───────────────────────
External Platform: Checks user authentication
    │
    ├─> If Authenticated:
    │   ├─> Get user's shop information
    │   ├─> Get authentication token (JWT)
    │   └─> Send to BVA via postMessage:
    │       {
    │         type: 'PLATFORM_AUTH_SUCCESS',
    │         shop: { id, name },
    │         token: 'platform_jwt_token'
    │       }
    │
    └─> If Not Authenticated:
        ├─> Show login/register UI
        ├─> After login: Get shop info + token
        └─> Send to BVA via postMessage

PHASE 3: SHOP LINKING
─────────────────────
BVA Frontend: Receives shop info
    │
    ├─> POST /api/shops/link
    │   Body: { shopId: "shop-123" }
    │   │
    │   └─> Backend: Creates ShopAccess record
    │       - Links user to external shop
    │       - Enables cross-platform access
    │
    └─> Response: { success: true, shop: {...} }

PHASE 4: INTEGRATION CREATION
─────────────────────────────
BVA Frontend: Creates integration record
    │
    ├─> POST /api/integrations
    │   Body: {
    │     platform: "SHOPEE",
    │     shopeeToken: "platform_jwt_token"
    │   }
    │   │
    │   └─> Backend: Creates Integration record
    │       - Stores platform type
    │       - Stores token in settings JSON
    │       - Links to shop
    │
    └─> Response: { success: true, data: integration }

PHASE 5: DATA SYNCHRONIZATION
─────────────────────────────
BVA Frontend: Triggers sync
    │
    ├─> POST /api/integrations/:id/sync
    │   │
    │   └─> Backend: Calls platform sync service
    │       │
    │       ├─> Fetch Products (READ-ONLY)
    │       │   GET /api/products/shop/:shopId
    │       │   Authorization: Bearer <platform_token>
    │       │   │
    │       │   └─> Map & Save to BVA Database
    │       │       - externalId: product.id
    │       │       - name, price, stock, imageUrl, etc.
    │       │
    │       └─> Fetch Sales (READ-ONLY)
    │           GET /api/orders/seller/:shopId
    │           Authorization: Bearer <platform_token>
    │           │
    │           └─> Map & Save to BVA Database
    │               - externalId: order.id
    │               - items, total, revenue, profit, etc.
    │
    └─> Response: { products: 10, sales: 25 }

PHASE 6: DATA USAGE
───────────────────
BVA Frontend: Fetches products for display
    │
    ├─> GET /api/products/shop/:shopId
    │   Authorization: Bearer <bva_token>
    │   │
    │   └─> Backend: Returns all products
    │       - Synced products (externalId not null)
    │       - Local products (externalId null)
    │
    └─> Frontend: Displays in UI
        - Dashboard: Metrics from products/sales
        - SmartShelf: Inventory analysis
        - Restock Planner: Restock recommendations
        - MarketMate: Ad generation with product images
        - Reports: Revenue/profit analytics
```

### Data Synchronization Details

#### Product Sync Process

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Fetch from External Platform                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ GET /api/products/shop/:shopId                                  │
│ Headers:                                                        │
│   Authorization: Bearer <platform_token>                        │
│   Content-Type: application/json                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Response: Array of Platform Products                            │
│ [                                                               │
│   {                                                             │
│     id: "prod-123",                                            │
│     name: "Adobo",                                              │
│     price: 350,                                                 │
│     cost: 150,                                                  │
│     stock: 10,                                                  │
│     image: "https://...",                                       │
│     description: "...",                                          │
│     category: "Food"                                            │
│   }                                                             │
│ ]                                                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Map to BVA Schema                                       │
│                                                                 │
│ For each product:                                               │
│   - externalId = product.id (link to platform)                  │
│   - name = product.name                                         │
│   - price = product.price                                       │
│   - cost = product.cost                                         │
│   - stock = product.stock                                       │
│   - imageUrl = product.image                                    │
│   - sku = "PLATFORM-{product.id}" (generated)                   │
│   - shopId = BVA shop ID                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Upsert to BVA Database                                  │
│                                                                 │
│ prisma.product.upsert({                                         │
│   where: {                                                      │
│     shopId_externalId: {                                       │
│       shopId: "bva-shop-123",                                  │
│       externalId: "prod-123"                                    │
│     }                                                           │
│   },                                                            │
│   update: { /* update fields */ },                              │
│   create: { /* create new product */ }                          │
│ })                                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Product Available in BVA                                │
│                                                                 │
│ Product is now accessible via:                                  │
│   GET /api/products/shop/:shopId                                │
│                                                                 │
│ And displayed in:                                               │
│   - Dashboard metrics                                           │
│   - SmartShelf inventory                                        │
│   - Restock Planner recommendations                             │
│   - MarketMate ad generation                                    │
│   - Reports analytics                                           │
└─────────────────────────────────────────────────────────────────┘
```

#### Sales Sync Process

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Fetch Orders from External Platform                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ GET /api/orders/seller/:shopId                                   │
│ Headers:                                                        │
│   Authorization: Bearer <platform_token>                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Response: Array of Platform Orders                              │
│ [                                                               │
│   {                                                             │
│     id: "order-456",                                           │
│     total_price: 1000,                                          │
│     items: [                                                    │
│       { productId: "prod-123", quantity: 2, price: 350 }        │
│     ],                                                          │
│     status: "completed",                                        │
│     created_at: "2024-01-15T10:00:00Z"                          │
│   }                                                             │
│ ]                                                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Calculate Profit                                        │
│                                                                 │
│ For each order item:                                            │
│   1. Fetch product cost from BVA database                     │
│   2. Calculate: profit = (item.price - product.cost) * quantity │
│   3. Sum all item profits = order profit                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Time Travel Distribution                                │
│                                                                 │
│ Distribute orders across last 30 days for ML training:          │
│   - Random date within last 30 days                            │
│   - Ensures ML service has historical data                      │
│   - Better forecasting accuracy                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Map to BVA Sale Schema                                  │
│                                                                 │
│ {                                                               │
│   externalId: "order-456",                                      │
│   platform: "SHOPEE",                                           │
│   platformOrderId: "order-456",                                  │
│   items: [mapped items],                                        │
│   total: 1000,                                                  │
│   revenue: 1000,                                                │
│   profit: 400, (calculated)                                     │
│   status: "completed",                                          │
│   createdAt: timeTraveledDate,                                  │
│   shopId: "bva-shop-123"                                        │
│ }                                                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Upsert to BVA Database                                  │
│                                                                 │
│ prisma.sale.upsert({                                           │
│   where: {                                                      │
│     shopId_externalId: {                                       │
│       shopId: "bva-shop-123",                                  │
│       externalId: "order-456"                                   │
│     }                                                           │
│   },                                                            │
│   update: { /* update sale */ },                                │
│   create: { /* create new sale */ }                             │
│ })                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Integration State Machine

```
┌─────────────┐
│  NOT_CONNECTED  │
│  (No integration)│
└──────┬──────┘
       │ User clicks "Connect"
       ▼
┌─────────────┐
│  AUTHENTICATING │
│  (Checking auth)│
└──────┬──────┘
       │ Auth successful
       ▼
┌─────────────┐
│  LINKING     │
│  (Linking shop)│
└──────┬──────┘
       │ Shop linked
       ▼
┌─────────────┐
│  CREATING    │
│  (Creating integration)│
└──────┬──────┘
       │ Integration created
       ▼
┌─────────────┐
│  SYNCING     │
│  (Syncing data)│
└──────┬──────┘
       │ Sync complete
       ▼
┌─────────────┐
│  ACTIVE      │
│  (Ready to use)│
└─────────────┘
       │
       │ User clicks "Sync" again
       ▼
┌─────────────┐
│  REFRESHING  │
│  (Re-syncing)│
└──────┬──────┘
       │ Sync complete
       ▼
   ┌─────────────┐
   │  ACTIVE      │
   └─────────────┘
```

---

## Summary

The product fetch and integration system enables seamless data flow from external platforms to BVA:

### Integration Flow

1. **User Initiates**: User clicks "Connect" in Settings → Platform Integrations
2. **Authentication**: External platform authenticates user and returns shop info + token
3. **Shop Linking**: BVA links external shop to user's account (ShopAccess table)
4. **Integration Record**: BVA creates Integration record with platform token
5. **Data Sync**: BVA Server fetches data from external platform (READ-ONLY)
6. **Data Mapping**: External platform data is mapped to BVA database schema
7. **Storage**: Data is saved to BVA database with `externalId` linking
8. **Display**: BVA Frontend fetches and displays all products (synced + local)

### Data Flow

1. **Source**: External platform (Shopee-Clone, TikTok-Clone, etc.)
2. **Middleware**: BVA Server (syncs and transforms data)
3. **Storage**: BVA Database (PostgreSQL with Prisma)
4. **Display**: BVA Frontend (React with React Query)

### Key Principles

- **Read-Only**: BVA only reads from external platforms, never writes
- **Unified Access**: Products from synced and local sources are displayed together
- **Platform Agnostic**: Architecture supports multiple platforms via service pattern
- **Extensible**: Easy to add new platforms by following the integration pattern
- **Secure**: All API calls require authentication tokens
- **Idempotent**: Sync operations can be run multiple times safely

### Usage Across BVA Features

- **Dashboard**: Displays metrics from synced sales and products
- **SmartShelf**: Analyzes inventory from synced products
- **Restock Planner**: Uses synced sales for restock recommendations
- **MarketMate**: Uses product images for context-aware ad generation
- **Reports**: Displays revenue/profit from synced sales

The system is designed to be **read-only** from external platforms' perspective, ensuring data integrity and separation of concerns while enabling powerful analytics and automation features in BVA.

