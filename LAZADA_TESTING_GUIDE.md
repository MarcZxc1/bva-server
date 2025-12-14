# Lazada-Clone to BVA Integration - Quick Start Guide

## 🚀 Quick Start: Test the Integration in 5 Minutes

This guide will walk you through testing the complete Lazada-Clone to BVA integration.

---

## Prerequisites

- PostgreSQL database running
- Redis running (optional, for caching)
- Node.js 18+ installed
- All dependencies installed (`npm install` in all workspaces)

---

## Step 1: Start All Services

Open **4 separate terminals** and run:

### Terminal 1: BVA Server
```bash
cd /home/marc/cloned/backup/bva-server/server
npm run dev
```
**Wait for**: `✓ Server listening on http://localhost:3000`

### Terminal 2: BVA Frontend
```bash
cd /home/marc/cloned/backup/bva-server/bva-frontend
npm run dev
```
**Wait for**: `VITE ready in X ms` on `http://localhost:5174`

### Terminal 3: Lazada-Clone
```bash
cd /home/marc/cloned/backup/bva-server/lazada-clone
npm run dev
```
**Wait for**: `Ready in X ms` on `http://localhost:3001`

### Terminal 4: Shopee-Clone (Optional - for comparison)
```bash
cd /home/marc/cloned/backup/bva-server/shopee-clone
npm run dev
```
**Wait for**: `VITE ready in X ms` on `http://localhost:5173`

---

## Step 2: Create Test Accounts

### Create Lazada-Clone Seller Account

1. Open browser: `http://localhost:3001/seller-signup`
2. Fill in registration:
   - Email: `lazada-seller@test.com`
   - Password: `password123`
   - Shop Name: `Lazada Test Shop`
3. Click **Register**
4. Login if redirected to login page

### Create BVA Account

1. Open browser: `http://localhost:5174/register`
2. Fill in registration:
   - Email: `bva-user@test.com`
   - Password: `password123`
   - Name: `BVA Test User`
3. Click **Register**
4. Login if redirected to login page

---

## Step 3: Add Test Products to Lazada

1. Go to `http://localhost:3001/seller-dashboard`
2. Click **Add Product**
3. Create 3 test products:

**Product 1:**
- Name: `Wireless Mouse`
- Price: `299`
- Stock: `50`
- Description: `Ergonomic wireless mouse`
- Category: `Electronics`

**Product 2:**
- Name: `USB Cable`
- Price: `149`
- Stock: `100`
- Description: `Fast charging USB-C cable`
- Category: `Electronics`

**Product 3:**
- Name: `Laptop Stand`
- Price: `899`
- Stock: `25`
- Description: `Adjustable aluminum laptop stand`
- Category: `Accessories`

4. **Important**: Leave Lazada-Clone tab open and logged in

---

## Step 4: Connect Lazada to BVA

### 4.1 Open BVA Settings
1. Go to `http://localhost:5174`
2. Login if needed
3. Click **Settings** in sidebar
4. Navigate to **Integrations** tab

### 4.2 Initiate Connection
1. Find **Lazada Integration** card
2. Click **Connect Lazada** button
3. Modal opens with embedded Lazada iframe

### 4.3 Grant Permission
1. **If you see login page**: 
   - Login with `lazada-seller@test.com` / `password123`
   - You'll be redirected to permission page

2. **Permission page should show**:
   - Shop name: "Lazada Test Shop"
   - Owner email: "lazada-seller@test.com"
   - List of permissions (read products, orders, etc.)

3. Click **Grant Permission** button

### 4.4 Verify Connection
1. Success toast should appear: "Lazada integrated successfully"
2. Modal closes
3. Integration card shows: **Status: Connected**
4. Shop name displays: "Lazada Test Shop"

---

## Step 5: Verify Data Sync

### 5.1 Check Initial Sync
1. In BVA, navigate to **Dashboard** or **Products** page
2. You should see the 3 products from Lazada:
   - Wireless Mouse ($299)
   - USB Cable ($149)
   - Laptop Stand ($899)

### 5.2 Check Database (Optional)
```bash
cd /home/marc/cloned/backup/bva-server/server
npm run db:studio
```
- Navigate to `Integration` table
- Find record with `platform: "LAZADA"`
- Check `settings` JSON has `lazadaToken`
- Navigate to `Product` table
- Verify 3 products exist with correct shopId

---

## Step 6: Test Real-time Webhooks

### 6.1 Create New Product in Lazada
1. Go to Lazada: `http://localhost:3001/seller-dashboard/add-product`
2. Create **Product 4**:
   - Name: `Keyboard`
   - Price: `599`
   - Stock: `30`
   - Category: `Electronics`
3. Click **Save**

### 6.2 Verify Webhook Sent
**In BVA Server terminal**, you should see:
```
📥 Webhook received: product created
✅ Product created in BVA: Keyboard
```

### 6.3 Verify Real-time Update in BVA
1. Go back to BVA tab: `http://localhost:5174`
2. Navigate to **Products** page
3. **Within 1 second**, "Keyboard" should appear in the list
4. No page refresh needed!

### 6.4 Test Product Update
1. In Lazada, go to **Manage Products**
2. Edit "Keyboard" product
3. Change price to `549`
4. Change stock to `40`
5. Click **Save**
6. Check BVA - product should update automatically

### 6.5 Test Product Delete
1. In Lazada, delete "Keyboard" product
2. Check BVA - product should disappear immediately

---

## Step 7: Test Manual Sync

### 7.1 Create Product Without Webhook
1. Temporarily stop Lazada-Clone server (Ctrl+C in Terminal 3)
2. Restart without webhook: `npm run dev`
3. Create **Product 5**:
   - Name: `Monitor`
   - Price: `2999`
   - Stock: `15`

### 7.2 Trigger Manual Sync
1. In BVA, go to **Settings → Integrations**
2. Find Lazada integration card
3. Click **Sync Now** button
4. Wait for success message

### 7.3 Verify Sync Result
1. Go to **Products** page
2. "Monitor" should now appear
3. All product data should match Lazada

---

## Step 8: Test Integration Features

### 8.1 Test Restock Planner
1. Navigate to **Restock Planner** page
2. Select "Lazada Test Shop" from shop filter
3. Verify products appear with current stock levels
4. Check restock predictions

### 8.2 Test SmartShelf (Inventory)
1. Navigate to **SmartShelf** page
2. View inventory for Lazada products
3. Low stock alerts should show for products with < 20 stock

### 8.3 Test MarketMate (Ads)
1. Navigate to **MarketMate** page
2. Try generating ad for "Wireless Mouse"
3. Verify ad generation works with Lazada product data

---

## Step 9: Test Disconnection

### 9.1 Disconnect Integration
1. Go to **Settings → Integrations**
2. Find Lazada integration
3. Click **Disconnect** button
4. Confirm disconnection

### 9.2 Verify Disconnect Behavior
1. Status should change to: **Not Connected**
2. Products remain in BVA (historical data preserved)
3. Webhooks stop working (test by creating product in Lazada)
4. Manual sync no longer available

### 9.3 Reconnect (Optional)
1. Click **Connect Lazada** again
2. Grant permission
3. Verify sync resumes

---

## 🐛 Troubleshooting

### Issue: Modal Shows "Loading..." Forever

**Solution:**
1. Check Lazada-Clone is running on port 3001
2. Check browser console for CORS errors
3. Verify `.env.local` in lazada-clone has correct BVA URL
4. Clear browser cache and reload

### Issue: Permission Page Shows Login Instead

**Solution:**
1. Login to Lazada-Clone first: `http://localhost:3001/seller-login`
2. Then try connecting again from BVA
3. Make sure you're logging in as a **seller**, not buyer

### Issue: Webhooks Not Working

**Solution:**
1. Check BVA Server logs for errors
2. Verify `NEXT_PUBLIC_BVA_WEBHOOK_URL` in `.env.local`
3. Check if webhook.service.ts is being called
4. Try manual sync as fallback

### Issue: Products Not Syncing

**Solution:**
1. Check BVA Server logs for sync errors
2. Verify Integration record exists in database
3. Check `lazadaToken` in Integration settings
4. Try disconnecting and reconnecting

### Issue: "Shop not found" Error

**Solution:**
1. Make sure you created a shop when registering Lazada seller
2. Check database: `Shop` table should have Lazada shop
3. Verify shop ownership (ownerId matches user)

---

## 📊 Success Indicators

After completing all steps, you should have:

✅ **Integration Connected**
- Integration card shows "Connected"
- Shop name displays correctly
- Disconnect button available

✅ **Initial Sync Complete**
- All Lazada products appear in BVA
- Product data matches (name, price, stock)
- Inventory levels correct

✅ **Webhooks Working**
- New products appear instantly in BVA
- Product updates reflect in real-time
- Deleted products removed immediately
- BVA Server logs show webhook activity

✅ **Manual Sync Working**
- Sync Now button triggers sync
- Products created offline sync successfully
- Sync summary shows correct counts

✅ **BVA Features Working**
- Restock Planner shows Lazada products
- SmartShelf tracks Lazada inventory
- MarketMate can generate ads for Lazada products
- Dashboard displays Lazada sales data

---

## 🎯 What to Test Next

### Advanced Testing
1. **Multi-shop**: Create second Lazada shop, connect it to BVA
2. **Order Sync**: Create orders in Lazada, verify they sync
3. **Inventory Webhooks**: Update stock in Lazada, check BVA updates
4. **Error Handling**: Disconnect Lazada while syncing, verify graceful failure
5. **Token Expiration**: Wait for JWT expiry, test re-authentication
6. **Performance**: Sync 100+ products, measure sync time
7. **Concurrent Webhooks**: Rapid product creation, verify no data loss

### Cross-Platform Testing
1. Connect both Shopee and Lazada to same BVA shop
2. Verify data segregation (Shopee products don't mix with Lazada)
3. Test multi-platform dashboard views
4. Compare analytics across platforms

---

## 📝 Testing Checklist

Use this checklist to track your testing progress:

- [ ] All 4 services started successfully
- [ ] Lazada seller account created
- [ ] BVA user account created
- [ ] 3 test products created in Lazada
- [ ] Connection initiated from BVA Settings
- [ ] Permission granted in Lazada iframe
- [ ] Integration shows "Connected" status
- [ ] Initial sync completed (3 products in BVA)
- [ ] Database Integration record verified
- [ ] Real-time webhook: Product created
- [ ] Real-time webhook: Product updated
- [ ] Real-time webhook: Product deleted
- [ ] Manual sync tested and working
- [ ] Restock Planner shows Lazada products
- [ ] SmartShelf displays inventory
- [ ] MarketMate generates ads
- [ ] Disconnection tested
- [ ] Reconnection tested
- [ ] All BVA features work with Lazada data

---

## 🚀 Next Steps

After successful testing:

1. **Document Issues**: Note any bugs or unexpected behavior
2. **Performance Testing**: Test with larger datasets
3. **Production Prep**: Update environment variables for production
4. **Monitoring**: Set up logging and alerting
5. **User Testing**: Get feedback from real users
6. **TikTok Integration**: Apply same pattern to TikTok-Clone

---

## 📞 Need Help?

- **Server Logs**: Check terminal 1 (BVA Server) for errors
- **Frontend Logs**: Open browser DevTools → Console
- **Database Issues**: Run `npm run db:studio` to inspect data
- **Webhook Testing**: Use Postman to manually test webhook endpoints
- **Documentation**: Refer to `LAZADA_INTEGRATION_STATUS.md` and `SHOPEE_BVA_INTEGRATION_BLUEPRINT.md`

---

**Happy Testing! 🎉**

If all tests pass, the Lazada-Clone to BVA integration is production-ready!
