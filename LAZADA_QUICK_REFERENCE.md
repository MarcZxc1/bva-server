# Lazada Integration - Quick Reference Card

## 🎯 Quick Status Check

**Integration Status**: ✅ Complete  
**Build Status**: ✅ All Passed  
**Ready for Testing**: ✅ Yes

---

## 📁 Key Files

### Lazada-Clone
```
✅ /.env.local                           (Environment config)
✅ /src/services/webhook.service.ts      (Real-time sync)
✅ /src/app/bva-integration-check/page.tsx (Permission flow)
✅ /src/app/(seller)/seller-dashboard/add-product/page.tsx (Product webhooks)
✅ /src/app/(buyer)/cart/page.tsx        (Order webhooks)
✅ /src/app/(buyer)/products/[productId]/page.tsx (Order webhooks)
```

### BVA Server (Already Complete)
```
✅ /prisma/schema.prisma                 (LAZADA in Platform enum)
✅ /src/service/lazadaIntegration.service.ts (Data sync logic)
✅ /src/service/integration.service.ts   (Integration management)
✅ /src/controllers/webhook.controller.ts (Webhook handlers)
✅ /src/middlewares/webhook.middleware.ts (JWT validation)
✅ /src/routes/webhook.routes.ts         (Webhook endpoints)
```

### BVA Frontend (Already Complete)
```
✅ /src/components/LazadaIntegrationModal.tsx (Integration UI)
✅ /src/pages/Settings.tsx               (Integration settings)
```

---

## 🚀 Quick Start Commands

### Start All Services
```bash
# Terminal 1 - BVA Server
cd server && npm run dev

# Terminal 2 - BVA Frontend  
cd bva-frontend && npm run dev

# Terminal 3 - Lazada-Clone
cd lazada-clone && npm run dev

# Terminal 4 - Shopee-Clone (optional)
cd shopee-clone && npm run dev
```

### Build All Services
```bash
# Lazada-Clone
cd lazada-clone && npm run build

# BVA Server
cd server && npm run build

# BVA Frontend
cd bva-frontend && npm run build
```

---

## 🔗 Service URLs

| Service | Port | URL |
|---------|------|-----|
| BVA Server | 3000 | http://localhost:3000 |
| BVA Frontend | 5174 | http://localhost:5174 |
| Lazada-Clone | 3001 | http://localhost:3001 |
| Shopee-Clone | 5173 | http://localhost:5173 |

---

## 🧪 Quick Test Steps

### 1. Initial Integration (2 minutes)
1. Open BVA: http://localhost:5174
2. Go to Settings → Integrations
3. Click "Connect Lazada"
4. Grant permission
5. ✅ Verify "Connected" status

### 2. Real-time Webhook (30 seconds)
1. Open Lazada: http://localhost:3001/seller-dashboard/add-product
2. Create product: "Test Mouse" - $299 - 50 stock
3. Save product
4. Switch to BVA Products page
5. ✅ Product appears instantly (no refresh!)

### 3. Order Webhook (30 seconds)
1. In Lazada, go to Products page
2. Add "Test Mouse" to cart
3. Checkout
4. Switch to BVA Orders page
5. ✅ Order appears instantly

---

## 🔍 Debugging Quick Tips

### Check Webhook Logs
```bash
# In BVA Server terminal, look for:
📥 Webhook received: product created
✅ Product created in BVA: Test Mouse
```

### Check Browser Console
```javascript
// In Lazada-Clone, look for:
✅ Webhook sent to BVA: Product created
✅ Webhook sent to BVA: Order created
```

### Check Integration Status
```bash
# In server directory
npm run db:studio

# Navigate to Integration table
# Look for: platform: "LAZADA", settings: { lazadaToken: "..." }
```

---

## 📊 Webhook Endpoints

All webhooks go to: `http://localhost:3000/api/webhooks`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /products/created | POST | New product |
| /products/updated | POST | Product changed |
| /products/deleted | POST | Product removed |
| /orders/created | POST | New order |
| /orders/updated | POST | Order changed |
| /orders/status-changed | POST | Status changed |
| /inventory/updated | POST | Stock changed |
| /sync/batch | POST | Manual sync |

---

## 🎯 Success Indicators

✅ **Integration Connected**
- Settings shows "Connected" status
- Shop name displays correctly
- Token stored in database

✅ **Webhooks Working**
- Console logs show webhook sent
- BVA Server logs show webhook received
- Products/orders sync in < 1 second

✅ **Data Synced**
- Products match between Lazada and BVA
- Orders appear in both systems
- Stock levels accurate

---

## 📚 Documentation Links

- **Full Status**: `/LAZADA_INTEGRATION_STATUS.md`
- **Testing Guide**: `/LAZADA_TESTING_GUIDE.md`
- **Implementation**: `/LAZADA_IMPLEMENTATION_COMPLETE.md`
- **Blueprint**: `/SHOPEE_BVA_INTEGRATION_BLUEPRINT.md`

---

## 🆘 Common Issues & Fixes

### "Modal shows loading forever"
**Fix**: Check Lazada is running on port 3001

### "Permission denied" error
**Fix**: Login to Lazada as seller first

### "Webhook not sent"
**Fix**: Check `.env.local` has correct BVA_WEBHOOK_URL

### "Token missing" error
**Fix**: Reconnect integration from BVA Settings

---

## ✅ Pre-Production Checklist

- [ ] All services build successfully
- [ ] Integration connects and syncs data
- [ ] Webhooks send and receive correctly
- [ ] Real-time updates work (< 1 second)
- [ ] Manual sync works as fallback
- [ ] Disconnect/reconnect works
- [ ] Error handling graceful
- [ ] Console logs clean (no errors)
- [ ] Database records correct
- [ ] Documentation reviewed

---

**Last Updated**: December 14, 2024  
**Status**: ✅ Production Ready (after testing)  
**Next Step**: Follow LAZADA_TESTING_GUIDE.md
