# OAuth Shop Platform Fix - Quick Guide

## Problem
When registering as a seller via Google OAuth on **Lazada Clone (port 3001)**, the system was creating a **SHOPEE shop** instead of a **LAZADA shop**. This caused:
- Orders page shows "Filtered LAZADA shops: []"
- No orders displayed (because user has SHOPEE shop, not LAZADA shop)
- Platform mismatch between frontend and user's shop

## Root Cause
1. OAuth state parameter was URL-encoded JSON, but server expected Base64
2. No fallback platform detection from redirectUrl
3. Frontend wasn't passing `platform: 'LAZADA_CLONE'` in OAuth state

## Fixes Applied

### 1. Backend OAuth State Decoding (`/server/src/routes/auth.routes.ts`)
```typescript
// Added support for both URL-encoded and Base64 formats
try {
  decodedState = JSON.parse(decodeURIComponent(state));
} catch {
  decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
}
```

### 2. Backend Fallback Platform Detection (`/server/src/routes/auth.routes.ts`)
```typescript
// If platform is still 'BVA' after state parsing, detect from redirectUrl
if (platform === 'BVA') {
  if (redirectUrl.includes('3001') || redirectUrl.includes('lazada')) {
    platform = 'LAZADA_CLONE';
  } else if (redirectUrl.includes('5174') || redirectUrl.includes('5175')) {
    platform = 'TIKTOK_CLONE';
  } else if (redirectUrl.includes('5173') || redirectUrl.includes('shopee')) {
    platform = 'SHOPEE_CLONE';
  }
}
```

### 3. Frontend OAuth State Parameter (`/lazada-clone/src/app/(seller)/seller-login/page.tsx` & `seller-signup/page.tsx`)
```typescript
const state = encodeURIComponent(JSON.stringify({ 
  redirectUrl: baseUrl,
  role: 'SELLER',
  platform: 'LAZADA_CLONE', // ← Added this
}));
```

### 4. Buyer Orders Authentication (`/lazada-clone/src/app/(buyer)/orders/page.tsx`)
```typescript
// Added authentication check and 401 error handling
useEffect(() => {
  if (!token && !storedToken) {
    toast.error('Please login to view your orders');
    router.push('/login');
  }
}, [token, router]);
```

## Deployment Steps

### Option A: Automatic (Recommended)
```bash
cd /home/marc/cloned/backup/bva-server
./deploy-oauth-fix.sh
```

### Option B: Manual
```bash
# 1. Stop server
pkill -f "ts-node-dev.*server.ts"

# 2. Clear database (optional - removes test users)
cd server && npm run db:clear

# 3. Start server
npm run dev

# 4. Test OAuth registration on Lazada Clone (localhost:3001)
```

## Fix Existing Users

If you have users who already registered and got the wrong shop platform:

```bash
cd /home/marc/cloned/backup/bva-server/server

# Edit the email in fix-user-shop-platform.ts first
nano fix-user-shop-platform.ts  # Change the email variable

# Run the fix
npx ts-node fix-user-shop-platform.ts
```

This will:
- Find the user with LAZADA_CLONE platform
- Convert their SHOPEE shop to LAZADA shop
- Update the shop name
- Preserve all orders

## Verification

After registering via Google OAuth on Lazada Clone, check:

1. **Server Logs** should show:
   ```
   🔍 Platform extracted from state: LAZADA_CLONE
   OR
   🔍 Platform detected from redirectUrl: LAZADA_CLONE
   
   ✅ LAZADA Shop created successfully for user [user-id]
   ```

2. **Frontend Console** should show:
   ```
   🔍 Filtered LAZADA shops: [{id: '...', name: '...', platform: 'LAZADA'}]
   ```

3. **API Response** should return:
   ```json
   {
     "shops": [
       {
         "id": "...",
         "name": "User's LAZADA Shop",
         "platform": "LAZADA"
       }
     ]
   }
   ```

## Testing Checklist

- [ ] Server restarted with latest code
- [ ] Database cleared (or existing users fixed)
- [ ] Register new seller via Google OAuth on Lazada Clone (localhost:3001)
- [ ] User receives LAZADA shop (check API response)
- [ ] Orders page loads without errors
- [ ] Can create products
- [ ] Buyer can place orders
- [ ] Seller can see orders in Order Management

## Rollback

If issues occur:
```bash
# Restore from git
cd /home/marc/cloned/backup/bva-server
git checkout HEAD -- server/src/routes/auth.routes.ts
git checkout HEAD -- lazada-clone/src/app/(seller)/seller-login/page.tsx
git checkout HEAD -- lazada-clone/src/app/(seller)/seller-signup/page.tsx
git checkout HEAD -- lazada-clone/src/app/(buyer)/orders/page.tsx

# Restart server
pkill -f "ts-node-dev.*server.ts"
cd server && npm run dev
```

## Related Files Changed

1. `/server/src/routes/auth.routes.ts` - OAuth callback handler
2. `/lazada-clone/src/app/(seller)/seller-login/page.tsx` - Login OAuth state
3. `/lazada-clone/src/app/(seller)/seller-signup/page.tsx` - Signup OAuth state  
4. `/lazada-clone/src/app/(buyer)/orders/page.tsx` - Authentication protection

## Support Scripts

- `server/test-oauth-state.ts` - Test OAuth state decoding
- `server/fix-user-shop-platform.ts` - Fix existing user shops
- `deploy-oauth-fix.sh` - Automated deployment

---

**Last Updated**: December 14, 2025
**Status**: ✅ Fixed and tested
