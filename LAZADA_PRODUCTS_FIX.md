# Lazada Integration Fix - Products Visibility & Status Indicator

## Issues Fixed
1. **Lazada products not showing in SmartShelf** - Products were synced to Lazada shop but SmartShelf was only querying BVA shop
2. **Integration status staying orange** - Integration queries only looked at BVA shop, not linked Lazada shop

## Root Cause
When a BVA user connects to Lazada-clone:
1. User links Lazada shop → Creates `ShopAccess` record (BVA user → Lazada shop)
2. User creates integration → Backend finds linked Lazada shop and creates `Integration` on that shop
3. Products are synced to the Lazada shop (correct)
4. **BUT** Frontend queries products/integrations using only the BVA shop ID (first shop in user.shops[])
5. **RESULT**: Products exist in DB but aren't visible, integration exists but shows as disconnected

## Solution Overview
Created new endpoints and hooks that query data from ALL shops a user has access to (both owned and linked):

### Backend Changes

#### 1. New Product Endpoint - `/api/products/user/all`
**File**: `server/src/service/product.service.ts`
```typescript
export async function getProductsForUser(userId: string, platform?: string) {
  // Get all shops the user owns
  const ownedShops = await prisma.shop.findMany({
    where: { ownerId: userId },
    select: { id: true, platform: true },
  });

  // Get all shops the user has access to via ShopAccess
  const linkedShops = await prisma.shopAccess.findMany({
    where: { userId: userId },
    include: { Shop: { select: { id: true, platform: true } } },
  });

  // Combine all shop IDs and query products
  const allShopIds = [
    ...ownedShops.map(s => s.id),
    ...linkedShops.map(sa => sa.Shop.id),
  ];

  return prisma.product.findMany({
    where: { shopId: { in: allShopIds } },
    // ... include shop, inventory, etc.
  });
}
```

**File**: `server/src/controllers/product.controller.ts`
```typescript
export const getUserProducts = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const products = await productService.getProductsForUser(user.userId);
  res.json({ success: true, data: products });
};
```

**File**: `server/src/routes/product.routes.ts`
```typescript
// New route - must be placed before "/:id" route to avoid conflicts
router.get("/user/all", authMiddleware, productController.getUserProducts);
```

#### 2. Updated Integration Endpoint - `/api/integrations`
**File**: `server/src/service/integration.service.ts`
```typescript
async getUserIntegrations(userId: string) {
  // Get all shops (owned + linked)
  const ownedShops = await prisma.shop.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });

  const linkedShops = await prisma.shopAccess.findMany({
    where: { userId: userId },
    include: { Shop: { select: { id: true } } },
  });

  const allShopIds = [
    ...ownedShops.map(s => s.id),
    ...linkedShops.map(sa => sa.Shop.id),
  ];

  // Return integrations from all accessible shops
  return prisma.integration.findMany({
    where: { shopId: { in: allShopIds } },
    include: { Shop: true },
  });
}
```

**File**: `server/src/controllers/integration.controller.ts`
```typescript
async getIntegrations(req: Request, res: Response) {
  const user = (req as any).user;
  const integrations = await integrationService.getUserIntegrations(user.userId);
  res.json({ success: true, data: integrations });
}
```

### Frontend Changes

#### 1. New Product Hook - `useAllUserProducts()`
**File**: `bva-frontend/src/services/product.service.ts`
```typescript
fetchAllUserProducts: async (): Promise<Product[]> => {
  return apiClient.get<Product[]>(`/api/products/user/all`);
}
```

**File**: `bva-frontend/src/hooks/useProducts.ts`
```typescript
export function useAllUserProducts() {
  return useQuery<Product[]>({
    queryKey: ["products", "all-user"],
    queryFn: async () => {
      const products = await productService.fetchAllUserProducts();
      return products;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
```

#### 2. Updated Components to Use New Hook
**Files Updated**:
- `bva-frontend/src/pages/SmartShelf.tsx`
- `bva-frontend/src/pages/Inventory.tsx`

**Changes**:
```typescript
// OLD: Only queries first shop (BVA shop)
import { useProducts } from "@/hooks/useProducts";
const { data: products } = useProducts(shopId || "");

// NEW: Queries all accessible shops (BVA + Lazada + others)
import { useAllUserProducts } from "@/hooks/useProducts";
const { data: products } = useAllUserProducts();
```

## Integration Status Detection
The `useIntegration` hook already correctly detects platform connections:
```typescript
const connectedPlatforms = new Set(
  integrations
    ?.filter((integration) => {
      const settings = integration.settings as any;
      return settings?.termsAccepted === true && settings?.isActive !== false;
    })
    .map((integration) => integration.platform) || []
);
```

With the updated `/api/integrations` endpoint returning integrations from all shops, the status indicator now correctly shows:
- ✅ **Green**: Integration found with `termsAccepted: true` and `isActive: true`
- 🟠 **Orange**: No integration found or not active

## Testing Steps

### 1. Verify Database State
```bash
cd server
npx tsx check_lazada_integration.ts
```

Expected output:
```
Found 1 Lazada integration(s):
  Settings: {
    "isActive": true,
    "termsAccepted": true,
    "lazadaToken": "...",
    ...
  }

Shop d4cc7b60-... has 1 products (showing first 5):
  - DSADAS (SKU: SKU-..., Stock: 18)
```

### 2. Test Products Endpoint
```bash
# Get auth token from BVA user
curl -H "Authorization: Bearer <bva_token>" \
  http://localhost:3000/api/products/user/all
```

Expected: Returns products from both BVA shop and Lazada shop

### 3. Test Integrations Endpoint
```bash
curl -H "Authorization: Bearer <bva_token>" \
  http://localhost:3000/api/integrations
```

Expected: Returns Lazada integration with `platform: "LAZADA"` and correct settings

### 4. Frontend Testing
1. Log into BVA as user with Lazada integration
2. Navigate to SmartShelf page
3. Check console for: `✅ useAllUserProducts: Fetched X products`
4. Verify Lazada products appear in product list
5. Check sidebar - Lazada status should be 🟢 green
6. Check console for: `🔌 Integration Status: { connectedPlatforms: ["LAZADA"], ... }`

## Files Modified

### Backend
- `server/src/service/product.service.ts` - Added `getProductsForUser()`
- `server/src/controllers/product.controller.ts` - Added `getUserProducts()` endpoint
- `server/src/routes/product.routes.ts` - Added `/user/all` route
- `server/src/service/integration.service.ts` - Added `getUserIntegrations()`
- `server/src/controllers/integration.controller.ts` - Updated `getIntegrations()` to use new service method

### Frontend
- `bva-frontend/src/services/product.service.ts` - Added `fetchAllUserProducts()`
- `bva-frontend/src/hooks/useProducts.ts` - Added `useAllUserProducts()` hook
- `bva-frontend/src/pages/SmartShelf.tsx` - Updated to use `useAllUserProducts()`
- `bva-frontend/src/pages/Inventory.tsx` - Updated to use `useAllUserProducts()`

### Testing
- `server/check_lazada_integration.ts` - Created diagnostic script

## Key Architectural Pattern
This fix establishes a pattern for multi-platform integration:

**Before**: Single shop per user → Simple queries
```typescript
// Query user's first shop
const shopId = user.shops[0].id;
const products = await getProductsByShop(shopId);
```

**After**: Multiple shops per user (owned + linked) → Aggregate queries
```typescript
// Query all accessible shops
const products = await getProductsForUser(userId);
```

This pattern should be applied to other data types that need to span multiple platforms:
- Sales/Orders
- Analytics
- Campaigns
- Forecasts

## Notes
- The old `useProducts(shopId)` hook is kept for backward compatibility
- Route order matters: `/user/all` must come before `/:id` to avoid matching issues
- Integration auto-sync was already working correctly - this fix only addresses visibility
- Shop linking via `ShopAccess` is the key mechanism enabling cross-platform data access
