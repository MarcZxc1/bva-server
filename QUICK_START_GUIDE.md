# Quick Start Guide: Setting Up BVA with Shopee-Clone Integration

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Redis (optional, for caching)

## Step 1: Environment Setup

### 1.1 BVA Server (.env)

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/bva_db"
JWT_SECRET="your_super_secret_jwt_key_here"
SHOPEE_CLONE_API_URL="http://localhost:3000"
PORT=3000
```

### 1.2 Shopee-Clone (.env)

```bash
cd shopee-clone
```

Edit `shopee-clone/.env`:
```bash
VITE_API_URL=http://localhost:3000/api
VITE_BVA_WEBHOOK_URL=http://localhost:3000/api/webhooks
```

### 1.3 BVA Frontend (.env)

```bash
cd bva-frontend
cp .env.example .env
```

Edit `bva-frontend/.env`:
```bash
VITE_API_URL=http://localhost:3000
VITE_SHOPEE_CLONE_URL=http://localhost:5173
```

## Step 2: Database Setup

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
```

## Step 3: Start All Services

Open 3 terminal windows:

### Terminal 1: BVA Server (Backend)
```bash
cd server
npm install
npm run dev
```
Server runs on: http://localhost:3000

### Terminal 2: Shopee-Clone (Seller Platform)
```bash
cd shopee-clone
npm install
npm run dev
```
Shopee-Clone runs on: http://localhost:5173

### Terminal 3: BVA Frontend (Dashboard)
```bash
cd bva-frontend
npm install
npm run dev
```
BVA Frontend runs on: http://localhost:5174

## Step 4: Create Test Data in Shopee-Clone

1. Open Shopee-Clone: http://localhost:5173
2. Click "Login as Seller"
3. Register a new seller account:
   - Email: `seller@test.com`
   - Password: `password123`
   - Role: Seller
4. After registration, you'll be redirected to the seller dashboard
5. Add some test products:
   - Click "My Products"
   - Click "Add Product"
   - Fill in product details (name, price, stock, etc.)
   - Click "Save Product"
6. Create a test order (switch to buyer mode):
   - Logout from seller
   - Login as buyer or browse as guest
   - Add products to cart
   - Complete checkout

## Step 5: Connect Shopee-Clone to BVA

1. Open BVA Frontend: http://localhost:5174
2. Register a new account in BVA (can use same email or different)
3. After login, go to **Settings** page
4. Scroll to **Integrations** section
5. Click **"Connect"** button next to Shopee
6. A modal will open with an iframe showing Shopee-Clone
7. Login with your seller account from Step 4
8. Grant permission when prompted
9. Click **"Connect Integration"**
10. Wait for initial sync to complete

## Step 6: Verify Integration

### Check Dashboard
1. Go to **Dashboard** page
2. You should see:
   - Total revenue from orders
   - Product count
   - Sales data
   - Charts with data

### Check SmartShelf
1. Go to **SmartShelf** page
2. You should see:
   - At-risk products
   - Low stock alerts
   - Inventory recommendations

### Check Restock Planner
1. Go to **Restock Planner** page
2. Select products
3. Click "Generate Strategy"
4. AI will generate restock recommendations

### Check MarketMate
1. Go to **MarketMate** page
2. Your products should be available
3. Click "Generate Ad Campaign"
4. AI will create ad copy and visuals

## Step 7: Test Real-Time Updates

1. Keep BVA Dashboard open in one browser window
2. Open Shopee-Clone in another window
3. As a seller, create a new product in Shopee-Clone
4. Watch the BVA Dashboard update in real-time via WebSocket
5. The new product should appear without refreshing

## Troubleshooting

### Products not syncing from Shopee-Clone

**Check:**
1. Shopee-Clone has products created
2. Integration is active in BVA Settings
3. Check browser console for errors
4. Check server terminal for errors
5. Manually trigger sync from Settings → Integrations → Sync

### Webhooks not working

**Check:**
1. `VITE_BVA_WEBHOOK_URL` is set correctly in `shopee-clone/.env`
2. BVA Server is running on port 3000
3. Check network tab in browser DevTools for webhook requests
4. Check server logs for webhook authentication errors

### Real-time updates not appearing

**Check:**
1. WebSocket connection is established (check browser console)
2. You're logged into the same shop in both BVA and Shopee-Clone
3. Browser allows WebSocket connections
4. No proxy/firewall blocking WebSocket

### Database connection errors

**Check:**
1. PostgreSQL is running
2. Database credentials in `server/.env` are correct
3. Database exists: `createdb bva_db`
4. Run migrations: `cd server && npx prisma migrate deploy`

## Testing the Full Flow

### Scenario: New Product → Order → Dashboard Update

1. **Create Product (Shopee-Clone)**
   - Login as seller
   - Go to My Products
   - Add new product: "Test Widget" - $10 - Stock: 50
   - Save product
   - ✅ Webhook sent to BVA

2. **Verify in BVA**
   - Open BVA Dashboard
   - ✅ Product count increased
   - Go to SmartShelf
   - ✅ "Test Widget" appears in inventory

3. **Create Order (Shopee-Clone)**
   - Switch to buyer mode
   - Add "Test Widget" to cart
   - Complete checkout
   - ✅ Webhook sent to BVA

4. **Verify Real-time Update**
   - Watch BVA Dashboard
   - ✅ Revenue increases
   - ✅ Order count increases
   - ✅ Stock decreases for "Test Widget"

## Next Steps

### Configure ML Service (Optional)

For AI-powered features like Restock Planner:

```bash
cd ml-service
pip install -r requirements.txt
python app/main.py
```

ML Service runs on: http://localhost:8000

### Enable Ad Generation (Optional)

Configure Gemini API for MarketMate:

1. Get API key from Google AI Studio
2. Add to `server/.env`:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

## Architecture Overview

```
Shopee-Clone (Port 5173)
    ↓ Webhooks
BVA Server (Port 3000)
    ↓ WebSocket
BVA Frontend (Port 5174)
```

- **Shopee-Clone** = Seller's e-commerce platform (products, orders)
- **BVA Server** = Backend API (receives webhooks, stores data, serves APIs)
- **BVA Frontend** = Dashboard UI (analytics, AI features, real-time updates)

## Key Features Enabled

✅ **Real-time Dashboard** - Live sales, revenue, orders
✅ **SmartShelf** - Inventory management, low stock alerts
✅ **Restock Planner** - AI-powered restock recommendations
✅ **MarketMate** - AI ad generation with product data
✅ **Reports** - Sales analytics and insights
✅ **WebSocket Updates** - Real-time data synchronization

## Support

For issues or questions:
- Check `INTEGRATION_FLOW_GUIDE.md` for detailed architecture
- Review server logs for errors
- Enable debug mode: `DEBUG=* npm run dev`
