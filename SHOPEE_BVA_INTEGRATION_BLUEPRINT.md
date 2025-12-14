# Shopee-Clone to BVA Integration Blueprint
## Complete Workflow & Roadmap for E-Commerce Platform Integration

**Purpose:** This document provides a comprehensive blueprint of how Shopee-Clone integrates with BVA (Business Virtual Assistant), designed to be used as a template for implementing Lazada-Clone (and any future e-commerce platform) integration with BVA.

**Last Updated:** December 14, 2025

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [Authentication & Authorization Flow](#authentication--authorization-flow)
4. [Integration Setup Workflow](#integration-setup-workflow)
5. [Data Synchronization](#data-synchronization)
6. [Real-Time Updates (Webhooks)](#real-time-updates-webhooks)
7. [Frontend Components](#frontend-components)
8. [Backend Services](#backend-services)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)
11. [WebSocket Real-Time Communication](#websocket-real-time-communication)
12. [Security & Data Privacy](#security--data-privacy)
13. [Roadmap for Lazada-Clone Integration](#roadmap-for-lazada-clone-integration)
14. [Testing Strategy](#testing-strategy)
15. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────┐         ┌──────────────┐         ┌──────────────┐
│                  │         │              │         │              │
│  Shopee-Clone    │◀───────▶│  BVA Server  │◀───────▶│ BVA Frontend │
│  (E-commerce)    │         │  (Backend)   │         │  (Analytics) │
│                  │         │              │         │              │
└──────────────────┘         └──────────────┘         └──────────────┘
   │           │                    │                        │
   │  Seller   │                    │                        │  User
   │  Actions  │                    ▼                        │
   │           │              ┌──────────┐                  │
   │           │              │PostgreSQL│                  │
   └───────────┼─────────────▶│ Database │◀─────────────────┘
               │              └──────────┘
               │                    │
               │                    │
               └────────────────────┴─────────────────────────┘
                        WebSocket (Real-time Updates)
```

### Component Breakdown

| Component | Purpose | Technology | Port |
|-----------|---------|-----------|------|
| **Shopee-Clone** | E-commerce platform (seller & buyer) | React + Vite | 5173 |
| **BVA Frontend** | Business analytics dashboard | React + Vite | 8080 |
| **BVA Server** | API & integration hub | Node.js + Express | 3000 |
| **ML Service** | AI/ML predictions & recommendations | Python + FastAPI | 8001 |
| **Database** | Data storage | PostgreSQL | 5432 |
| **Cache** | Session & data caching | Redis | 6379 |

---

## Core Concepts

### 1. **Multi-Platform Integration Architecture**

BVA is designed to aggregate data from multiple e-commerce platforms (Shopee, Lazada, TikTok, etc.) into a unified analytics dashboard.

**Key Principles:**
- ✅ **Read-Only Access:** BVA only reads data from platforms, never writes/modifies
- ✅ **Platform Agnostic:** Services are designed to support multiple platforms
- ✅ **Unified Data Model:** Different platforms map to the same database schema
- ✅ **Real-Time Sync:** Webhooks provide instant data updates
- ✅ **Shop-Centric:** All data is organized by shop (multi-shop support)

### 2. **Data Flow Patterns**

#### Pattern 1: Initial Sync (Pull)
```
User Connects → BVA Requests Data → Platform API → BVA Saves → Dashboard Updates
```

#### Pattern 2: Real-Time Updates (Push)
```
Seller Action → Platform Webhook → BVA Receives → BVA Saves → WebSocket Broadcast → Dashboard Updates
```

#### Pattern 3: Analytics Request (Query)
```
User Opens Dashboard → BVA Queries DB → ML Processing → Analytics Display
```

### 3. **Authentication Strategy**

**JWT Token Flow:**
1. User logs into Shopee-Clone (gets Shopee JWT token)
2. User connects Shopee to BVA (BVA stores Shopee token)
3. BVA uses Shopee token to access Shopee API
4. User logs into BVA (gets BVA JWT token)
5. BVA Frontend uses BVA token for all BVA API calls

**Key Points:**
- Each platform has its own authentication
- BVA stores platform tokens securely
- Tokens are used for read-only API access
- Users must be authenticated in both systems

---

## Authentication & Authorization Flow

### Step-by-Step Authentication Process

#### Phase 1: Platform Authentication (Shopee-Clone)

**Location:** `shopee-clone/src/contexts/AuthContext.tsx`

```typescript
// User logs into Shopee-Clone
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  const { user, token, shops } = response.data.data;
  
  // Store in localStorage
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('shops', JSON.stringify(shops));
  
  // Update state
  setUser(user);
  setShops(shops);
  setIsAuthenticated(true);
};
```

**What's Stored:**
- `authToken`: Shopee JWT token (used for Shopee API calls)
- `user`: User profile (id, email, name, role)
- `shops`: Array of shops owned by user

#### Phase 2: BVA Integration Check

**Location:** `shopee-clone/src/pages/BVAIntegrationCheck.tsx`

```typescript
// Check if user is authenticated and has a shop
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const shops = JSON.parse(localStorage.getItem('shops') || '[]');
  const token = localStorage.getItem('authToken');

  if (user.id && shops.length > 0 && token) {
    // User is authenticated and has a shop
    setShop(shops[0]); // Use first shop
    setShowPermission(true); // Show permission dialog
  } else {
    // Redirect to login
    window.location.href = '/seller-login';
  }
}, []);
```

**Permission Grant:**
```typescript
const handleGrantPermission = () => {
  // Send shop data to BVA parent window
  window.parent.postMessage({
    type: 'SHOPEE_CLONE_AUTH_SUCCESS',
    shop: { id: shop.id, name: shop.name },
    user: { id: user.id, email: user.email, name: user.name },
    token: localStorage.getItem('authToken')
  }, '*'); // Send to any origin (BVA)
};
```

#### Phase 3: BVA Receives Authentication

**Location:** `bva-frontend/src/components/ShopeeCloneIntegrationModal.tsx`

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'SHOPEE_CLONE_AUTH_SUCCESS') {
      const { shop, user, token } = event.data;
      
      // Call parent component's handler
      onConnect({
        shopId: shop.id,
        shopName: shop.name,
        shopeeToken: token // Store Shopee token for API access
      });
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

#### Phase 4: BVA Creates Integration

**Location:** `bva-frontend/src/pages/Settings.tsx`

```typescript
const handleShopeeConnect = async (data: {
  shopId: string;
  shopName: string;
  shopeeToken: string;
}) => {
  try {
    // Step 1: Link the shop to current BVA user
    await shopAccessService.linkShop(data.shopId);
    
    // Step 2: Create integration with Shopee token
    const integration = await integrationService.createIntegration({
      platform: 'SHOPEE',
      shopeeToken: data.shopeeToken // Store token for API calls
    });
    
    // Step 3: Initial data sync
    await integrationService.syncIntegration(integration.id);
    
    toast.success('Shopee integration connected!');
  } catch (error) {
    toast.error('Integration failed: ' + error.message);
  }
};
```

---

## Integration Setup Workflow

### Complete User Journey

```
1. User Opens BVA Settings
   ↓
2. Clicks "Connect Shopee"
   ↓
3. Modal Opens (Iframe to Shopee-Clone)
   ↓
4. User Logs into Shopee-Clone (if not already)
   ↓
5. Permission Dialog Appears
   ↓
6. User Grants Permission
   ↓
7. Shopee Sends Shop Data + Token to BVA
   ↓
8. BVA Links Shop to User Account
   ↓
9. BVA Creates Integration Record
   ↓
10. BVA Performs Initial Sync
    ↓
11. BVA Displays Success Message
    ↓
12. Dashboard Shows Synced Data
```

### Backend Integration Creation

**Location:** `server/src/service/integration.service.ts`

```typescript
async createIntegration(data: CreateIntegrationInput) {
  // Check if integration already exists
  const existing = await prisma.integration.findUnique({
    where: {
      shopId_platform: {
        shopId: data.shopId,
        platform: data.platform
      }
    }
  });

  if (existing) {
    // Update existing integration with new token
    return await prisma.integration.update({
      where: { id: existing.id },
      data: {
        settings: {
          ...existing.settings,
          shopeeToken: data.shopeeToken // Update token
        },
        isActive: true,
        lastSyncedAt: new Date()
      }
    });
  }

  // Create new integration
  return await prisma.integration.create({
    data: {
      shopId: data.shopId,
      platform: data.platform,
      settings: {
        shopeeToken: data.shopeeToken // Store token securely
      },
      isActive: true,
      lastSyncedAt: new Date()
    }
  });
}
```

**Database Record:**
```json
{
  "id": "uuid",
  "shopId": "shop-123",
  "platform": "SHOPEE",
  "settings": {
    "shopeeToken": "eyJhbGc...", // JWT token for API access
    "syncInterval": 300 // Auto-sync every 5 minutes
  },
  "isActive": true,
  "lastSyncedAt": "2025-12-14T10:00:00Z"
}
```

---

## Data Synchronization

### Initial Sync Process

When a user first connects Shopee to BVA, an initial sync fetches all historical data.

#### Sync Flow

```
1. User Clicks "Connect" or "Sync"
   ↓
2. BVA Server Calls syncIntegration()
   ↓
3. For each data type:
   - Fetch from Shopee API (READ-ONLY)
   - Transform data to BVA schema
   - Save to BVA database
   ↓
4. Return sync summary
   ↓
5. Update integration lastSyncedAt
   ↓
6. Broadcast refresh to frontend
```

#### Products Sync

**Location:** `server/src/service/shopeeIntegration.service.ts`

```typescript
async syncProducts(shopId: string, token: string): Promise<number> {
  // Fetch products from Shopee-Clone API
  const response = await axios.get(
    `${SHOPEE_API_URL}/products/shop/${shopId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const products = response.data.data || response.data;
  let syncedCount = 0;

  // Process each product
  for (const shopeeProduct of products) {
    await prisma.product.upsert({
      where: { 
        shopId_externalId: { 
          shopId, 
          externalId: shopeeProduct.id 
        } 
      },
      update: {
        // Update existing product
        name: shopeeProduct.name,
        price: parseFloat(shopeeProduct.price),
        cost: parseFloat(shopeeProduct.cost || shopeeProduct.price * 0.6),
        stock: parseInt(shopeeProduct.stock || shopeeProduct.quantity),
        imageUrl: shopeeProduct.image || shopeeProduct.imageUrl,
        description: shopeeProduct.description,
        category: shopeeProduct.category,
        isActive: shopeeProduct.isActive ?? true,
        updatedAt: new Date()
      },
      create: {
        // Create new product
        shopId,
        externalId: shopeeProduct.id,
        name: shopeeProduct.name,
        price: parseFloat(shopeeProduct.price),
        cost: parseFloat(shopeeProduct.cost || shopeeProduct.price * 0.6),
        stock: parseInt(shopeeProduct.stock || shopeeProduct.quantity),
        imageUrl: shopeeProduct.image || shopeeProduct.imageUrl,
        description: shopeeProduct.description,
        category: shopeeProduct.category,
        isActive: true,
        platform: Platform.SHOPEE
      }
    });
    syncedCount++;
  }

  return syncedCount;
}
```

**Field Mapping:**

| Shopee Field | BVA Field | Notes |
|-------------|-----------|-------|
| `id` | `externalId` | Links to platform |
| `name` | `name` | Product name |
| `price` | `price` | Selling price |
| `cost` | `cost` | Cost of goods (default: 60% of price) |
| `stock`/`quantity` | `stock` | Available inventory |
| `image`/`imageUrl` | `imageUrl` | Product image |
| `description` | `description` | Product description |
| `category` | `category` | Product category |
| `isActive` | `isActive` | Product status |

#### Sales/Orders Sync

**Location:** `server/src/service/shopeeIntegration.service.ts`

```typescript
async syncSales(shopId: string, token: string): Promise<number> {
  // Fetch orders from Shopee-Clone API
  const response = await axios.get(
    `${SHOPEE_API_URL}/orders/seller/${shopId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const orders = response.data.data || response.data;
  let syncedCount = 0;

  // Process each order
  for (const order of orders) {
    // Calculate revenue and profit
    let totalRevenue = 0;
    let totalProfit = 0;

    for (const item of order.items) {
      const product = await prisma.product.findFirst({
        where: { 
          shopId, 
          externalId: item.productId 
        }
      });

      const itemRevenue = item.price * item.quantity;
      const itemProfit = product 
        ? (item.price - product.cost) * item.quantity 
        : itemRevenue * 0.4; // Default 40% profit margin

      totalRevenue += itemRevenue;
      totalProfit += itemProfit;
    }

    // Time-travel dates for ML service (distribute across last 30 days)
    const daysAgo = Math.floor(Math.random() * 30);
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - daysAgo);

    await prisma.sale.upsert({
      where: {
        shopId_externalId: {
          shopId,
          externalId: order.id
        }
      },
      update: {
        revenue: totalRevenue,
        profit: totalProfit,
        items: order.items,
        status: order.status,
        date: saleDate,
        updatedAt: new Date()
      },
      create: {
        shopId,
        externalId: order.id,
        revenue: totalRevenue,
        profit: totalProfit,
        total: order.total,
        items: order.items,
        status: order.status,
        date: saleDate,
        platform: Platform.SHOPEE
      }
    });
    syncedCount++;
  }

  return syncedCount;
}
```

**Why Time-Travel Dates?**
- ML service needs historical data for predictions
- Initial sync creates orders "in the past" for realistic analysis
- Distributed across 30 days for better ML training
- Real orders (from webhooks) use actual timestamps

---

## Real-Time Updates (Webhooks)

### Webhook Architecture

When a seller makes changes in Shopee-Clone, the platform immediately notifies BVA via webhooks.

#### Webhook Flow

```
1. Seller Creates Product in Shopee-Clone
   ↓
2. Shopee-Clone Saves to Database
   ↓
3. Shopee-Clone Calls webhookService.sendProductCreated()
   ↓
4. HTTP POST to BVA Server /api/webhooks/products/created
   ↓
5. BVA Validates JWT Token
   ↓
6. BVA Extracts ShopId
   ↓
7. BVA Saves Product to Database
   ↓
8. BVA Invalidates Cache
   ↓
9. BVA Broadcasts via WebSocket
   ↓
10. BVA Frontend Updates UI (Real-time)
```

### Webhook Service (Shopee-Clone)

**Location:** `shopee-clone/src/services/webhook.service.ts`

```typescript
class WebhookService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = import.meta.env.VITE_BVA_WEBHOOK_URL;
  }

  // Get user data from localStorage
  private getUserData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const shops = JSON.parse(localStorage.getItem('shops') || '[]');
    const token = localStorage.getItem('authToken');

    return {
      userId: user.id,
      shopId: shops[0]?.id, // Use first shop
      token
    };
  }

  // Send webhook to BVA
  private async sendWebhook(endpoint: string, data: any) {
    const { shopId, token } = this.getUserData();

    if (!shopId || !token) {
      console.warn('No shop or token found, skipping webhook');
      return;
    }

    try {
      await axios.post(
        `${this.webhookUrl}${endpoint}`,
        { ...data, shopId }, // Include shopId in payload
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Webhook failed:', error);
    }
  }

  // Product webhooks
  async sendProductCreated(product: any) {
    await this.sendWebhook('/products/created', product);
  }

  async sendProductUpdated(product: any) {
    await this.sendWebhook('/products/updated', product);
  }

  async sendProductDeleted(productId: string) {
    await this.sendWebhook('/products/deleted', { id: productId });
  }

  // Order webhooks
  async sendOrderCreated(order: any) {
    await this.sendWebhook('/orders/created', order);
  }

  async sendOrderUpdated(order: any) {
    await this.sendWebhook('/orders/updated', order);
  }

  async sendOrderStatusChanged(orderId: string, status: string) {
    await this.sendWebhook('/orders/status-changed', { 
      id: orderId, 
      status 
    });
  }

  // Inventory webhooks
  async sendInventoryUpdated(productId: string, quantity: number) {
    await this.sendWebhook('/inventory/updated', { 
      productId, 
      quantity 
    });
  }
}

export const webhookService = new WebhookService();
```

### Webhook Integration in Components

**Example: Product Creation**

**Location:** `shopee-clone/src/features/seller/components/MyProducts.tsx`

```typescript
const handleAddProduct = async (productData: any) => {
  try {
    // Save to Shopee-Clone database
    const response = await api.post('/products', productData);
    const newProduct = response.data.data;

    // Send webhook to BVA
    await webhookService.sendProductCreated(newProduct);

    toast.success('Product created!');
  } catch (error) {
    toast.error('Failed to create product');
  }
};
```

**Example: Order Creation**

**Location:** `shopee-clone/src/features/buyer/BuyerCheckout.tsx`

```typescript
const handleCheckout = async () => {
  try {
    // Create order in Shopee-Clone
    const response = await api.post('/orders', {
      items: cartItems,
      shippingAddress,
      paymentMethod
    });
    const order = response.data.data;

    // Send webhook to BVA (if seller)
    await webhookService.sendOrderCreated(order);

    router.push('/orders');
  } catch (error) {
    toast.error('Checkout failed');
  }
};
```

### Webhook Handler (BVA Server)

**Location:** `server/src/controllers/webhook.controller.ts`

```typescript
class WebhookController {
  // Handle product created webhook
  async handleProductCreated(req: Request, res: Response) {
    try {
      const shopId = (req as any).shopId; // From webhook middleware
      const productData = req.body;

      // Save to BVA database
      await prisma.product.upsert({
        where: {
          shopId_externalId: {
            shopId,
            externalId: productData.id
          }
        },
        update: {
          name: productData.name,
          price: parseFloat(productData.price),
          stock: parseInt(productData.stock),
          imageUrl: productData.image,
          updatedAt: new Date()
        },
        create: {
          shopId,
          externalId: productData.id,
          name: productData.name,
          price: parseFloat(productData.price),
          cost: parseFloat(productData.cost),
          stock: parseInt(productData.stock),
          imageUrl: productData.image,
          platform: Platform.SHOPEE
        }
      });

      // Invalidate cache
      await CacheService.invalidateShop(shopId);

      // Broadcast via WebSocket
      io.to(`shop_${shopId}`).emit('product_update', {
        type: 'product_created',
        data: productData
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Handle order created webhook
  async handleOrderCreated(req: Request, res: Response) {
    try {
      const shopId = (req as any).shopId;
      const orderData = req.body;

      // Calculate revenue and profit
      let totalRevenue = orderData.total;
      let totalProfit = 0;

      for (const item of orderData.items) {
        const product = await prisma.product.findFirst({
          where: { shopId, externalId: item.productId }
        });

        if (product) {
          const itemProfit = (item.price - product.cost) * item.quantity;
          totalProfit += itemProfit;
        }
      }

      // Save to BVA database
      await prisma.sale.create({
        data: {
          shopId,
          externalId: orderData.id,
          revenue: totalRevenue,
          profit: totalProfit,
          total: orderData.total,
          items: orderData.items,
          status: orderData.status,
          date: new Date(),
          platform: Platform.SHOPEE
        }
      });

      // Invalidate cache
      await CacheService.invalidateShop(shopId);

      // Broadcast via WebSocket
      io.to(`shop_${shopId}`).emit('dashboard_update', {
        type: 'new_order',
        data: { revenue: totalRevenue, profit: totalProfit }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

### Webhook Middleware

**Location:** `server/src/middlewares/webhook.middleware.ts`

```typescript
export const webhookMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header or body
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.body?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token) as any;
    (req as any).user = decoded;
    (req as any).userId = decoded.userId;

    // Get shopId from multiple sources (priority order):
    // 1. Request body (sent by shopee-clone webhook)
    // 2. Decoded token
    // 3. Look up from database using userId
    let shopId = req.body?.shopId || decoded.shopId || null;

    if (!shopId && decoded.userId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { Shop: { take: 1, select: { id: true } } }
      });

      if (user?.Shop?.[0]?.id) {
        shopId = user.Shop[0].id;
      }
    }

    (req as any).shopId = shopId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};
```

---

## Frontend Components

### BVA Frontend Integration Components

#### 1. Integration Modal

**Location:** `bva-frontend/src/components/ShopeeCloneIntegrationModal.tsx`

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: ShopeeAuthData) => void;
}

export default function ShopeeCloneIntegrationModal({
  isOpen,
  onClose,
  onConnect
}: Props) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SHOPEE_CLONE_AUTH_SUCCESS') {
        const { shop, user, token } = event.data;
        onConnect({
          shopId: shop.id,
          shopName: shop.name,
          shopeeToken: token
        });
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConnect, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Connect Shopee Clone</DialogTitle>
        </DialogHeader>
        <iframe
          src={`${SHOPEE_CLONE_URL}/bva-integration-check`}
          className="w-full h-96 border rounded"
          title="Shopee Integration"
        />
      </DialogContent>
    </Dialog>
  );
}
```

#### 2. Settings Page Integration Management

**Location:** `bva-frontend/src/pages/Settings.tsx`

```typescript
export default function Settings() {
  const [integrations, setIntegrations] = useState([]);
  const [showShopeeModal, setShowShopeeModal] = useState(false);

  // Fetch integrations
  useEffect(() => {
    integrationService.getIntegrations()
      .then(setIntegrations)
      .catch(console.error);
  }, []);

  // Handle Shopee connection
  const handleShopeeConnect = async (data: ShopeeAuthData) => {
    try {
      // Step 1: Link shop
      await shopAccessService.linkShop(data.shopId);

      // Step 2: Create integration
      const integration = await integrationService.createIntegration({
        platform: 'SHOPEE',
        shopeeToken: data.shopeeToken
      });

      // Step 3: Initial sync
      await integrationService.syncIntegration(integration.id);

      // Refresh integrations list
      const updatedIntegrations = await integrationService.getIntegrations();
      setIntegrations(updatedIntegrations);

      toast.success('Shopee connected successfully!');
    } catch (error) {
      toast.error('Connection failed: ' + error.message);
    }
  };

  // Handle sync
  const handleSync = async (integrationId: string) => {
    try {
      await integrationService.syncIntegration(integrationId);
      toast.success('Sync complete!');
    } catch (error) {
      toast.error('Sync failed: ' + error.message);
    }
  };

  // Handle disconnect
  const handleDisconnect = async (integrationId: string) => {
    try {
      await integrationService.deleteIntegration(integrationId);
      setIntegrations(prev => 
        prev.filter(i => i.id !== integrationId)
      );
      toast.success('Disconnected successfully!');
    } catch (error) {
      toast.error('Disconnect failed: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Integrations</h1>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shopee Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Shopee Clone</CardTitle>
          </CardHeader>
          <CardContent>
            {integrations.find(i => i.platform === 'SHOPEE') ? (
              <>
                <Badge className="mb-2">Connected</Badge>
                <p className="text-sm text-gray-600 mb-4">
                  Last synced: {formatDate(integration.lastSyncedAt)}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => handleSync(integration.id)}>
                    Sync Now
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your Shopee shop to sync products and orders
                </p>
                <Button onClick={() => setShowShopeeModal(true)}>
                  Connect Shopee
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shopee Integration Modal */}
      <ShopeeCloneIntegrationModal
        isOpen={showShopeeModal}
        onClose={() => setShowShopeeModal(false)}
        onConnect={handleShopeeConnect}
      />
    </div>
  );
}
```

#### 3. Real-Time Dashboard Hook

**Location:** `bva-frontend/src/hooks/useRealtimeDashboard.ts`

```typescript
export function useRealtimeDashboard(shopId: string) {
  const [dashboardData, setDashboardData] = useState(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Fetch initial data
    dashboardService.getDashboard()
      .then(setDashboardData)
      .catch(console.error);

    // Connect to WebSocket
    socketRef.current = io(API_URL);

    // Join shop room
    socketRef.current.emit('join_shop', shopId);

    // Listen for updates
    socketRef.current.on('dashboard_update', (data) => {
      console.log('Dashboard update received:', data);
      
      // Update dashboard data
      setDashboardData(prev => ({
        ...prev,
        ...data
      }));
    });

    // Cleanup
    return () => {
      socketRef.current?.disconnect();
    };
  }, [shopId]);

  return dashboardData;
}
```

### Shopee-Clone Integration Components

#### 1. BVA Integration Check Page

**Location:** `shopee-clone/src/pages/BVAIntegrationCheck.tsx`

```typescript
export default function BVAIntegrationCheck() {
  const { user, shop } = useAuth();
  const [showPermission, setShowPermission] = useState(false);

  useEffect(() => {
    if (user && shop) {
      setShowPermission(true);
    } else {
      // Redirect to login
      window.location.href = '/seller-login';
    }
  }, [user, shop]);

  const handleGrantPermission = () => {
    const token = localStorage.getItem('authToken');

    // Send data to parent window (BVA)
    window.parent.postMessage({
      type: 'SHOPEE_CLONE_AUTH_SUCCESS',
      shop: { id: shop.id, name: shop.name },
      user: { id: user.id, email: user.email, name: user.name },
      token
    }, '*');
  };

  const handleDeny = () => {
    window.parent.postMessage({
      type: 'SHOPEE_CLONE_AUTH_DENIED'
    }, '*');
  };

  if (!showPermission) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>BVA Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            BVA wants to access your shop data:
          </p>
          <ul className="list-disc list-inside mb-4 text-sm">
            <li>View products and inventory</li>
            <li>View sales and orders</li>
            <li>Receive real-time updates</li>
          </ul>
          <p className="text-sm text-gray-600 mb-4">
            BVA will not modify your data. This is read-only access.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleGrantPermission}>
              Grant Permission
            </Button>
            <Button variant="outline" onClick={handleDeny}>
              Deny
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Backend Services

### Integration Service

**Location:** `server/src/service/integration.service.ts`

**Key Methods:**
- `createIntegration()` - Create/update integration
- `syncIntegration()` - Trigger data sync
- `getIntegrations()` - Get user's integrations
- `deleteIntegration()` - Remove integration

### Shopee Integration Service

**Location:** `server/src/service/shopeeIntegration.service.ts`

**Key Methods:**
- `syncAllData()` - Sync products and sales
- `syncProducts()` - Sync products only
- `syncSales()` - Sync sales/orders only

### Product Service

**Location:** `server/src/service/product.service.ts`

**Key Methods:**
- `getProducts()` - Get all products (from all platforms)
- `getProductById()` - Get specific product
- `createProduct()` - Create product (BVA-native)
- `updateProduct()` - Update product
- `deleteProduct()` - Delete product

### Shop Access Service

**Location:** `server/src/service/shopAccess.service.ts`

**Key Methods:**
- `linkShop()` - Link external shop to user
- `getLinkedShops()` - Get user's linked shops
- `removeShopAccess()` - Remove shop link

---

## Database Schema

### Core Tables

#### Integration Table
```prisma
model Integration {
  id            String    @id @default(uuid())
  shopId        String
  platform      Platform  // SHOPEE, LAZADA, TIKTOK, etc.
  apiKey        String?
  settings      Json?     // { shopeeToken: "jwt...", syncInterval: 300 }
  isActive      Boolean   @default(true)
  lastSyncedAt  DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  Shop          Shop      @relation(fields: [shopId], references: [id])

  @@unique([shopId, platform])
}
```

#### Product Table
```prisma
model Product {
  id          String    @id @default(uuid())
  shopId      String
  externalId  String?   // ID from external platform
  name        String
  description String?
  price       Float
  cost        Float?
  stock       Int       @default(0)
  imageUrl    String?
  category    String?
  isActive    Boolean   @default(true)
  platform    Platform? // SHOPEE, LAZADA, BVA, etc.
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  Shop        Shop      @relation(fields: [shopId], references: [id])

  @@unique([shopId, externalId])
}
```

#### Sale Table
```prisma
model Sale {
  id          String    @id @default(uuid())
  shopId      String
  externalId  String?   // Order ID from external platform
  revenue     Float
  profit      Float?
  total       Float
  items       Json      // Array of order items
  status      String?   // pending, completed, cancelled
  date        DateTime  @default(now())
  platform    Platform? // SHOPEE, LAZADA, etc.
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  Shop        Shop      @relation(fields: [shopId], references: [id])

  @@unique([shopId, externalId])
}
```

#### ShopAccess Table
```prisma
model ShopAccess {
  id        String   @id @default(uuid())
  userId    String
  shopId    String
  role      String   @default("VIEWER") // VIEWER, EDITOR, ADMIN
  createdAt DateTime @default(now())
  User      User     @relation(fields: [userId], references: [id])
  Shop      Shop     @relation(fields: [shopId], references: [id])

  @@unique([userId, shopId])
}
```

---

## API Endpoints

### BVA Server API Reference

#### Authentication
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login user
GET  /api/auth/me           - Get current user
POST /api/auth/logout       - Logout user
```

#### Integrations
```
POST   /api/integrations             - Create integration
GET    /api/integrations             - Get user's integrations
GET    /api/integrations/:id         - Get integration by ID
PUT    /api/integrations/:id         - Update integration
DELETE /api/integrations/:id         - Delete integration
POST   /api/integrations/:id/sync    - Trigger sync
POST   /api/integrations/:id/test    - Test connection
```

#### Webhooks
```
POST /api/webhooks/products/created       - Product created
POST /api/webhooks/products/updated       - Product updated
POST /api/webhooks/products/deleted       - Product deleted
POST /api/webhooks/orders/created         - Order created
POST /api/webhooks/orders/updated         - Order updated
POST /api/webhooks/orders/status-changed  - Order status changed
POST /api/webhooks/inventory/updated      - Inventory updated
POST /api/webhooks/sync/batch             - Batch sync
```

#### Products
```
GET    /api/products              - Get all products
GET    /api/products/:id          - Get product by ID
POST   /api/products              - Create product
PUT    /api/products/:id          - Update product
DELETE /api/products/:id          - Delete product
GET    /api/products/shop/:shopId - Get products by shop
```

#### Shop Access
```
POST   /api/shop-access/link         - Link shop to user
GET    /api/shop-access/linked-shops - Get linked shops
DELETE /api/shop-access/:shopId      - Remove shop access
```

---

## WebSocket Real-Time Communication

### Socket.IO Events

#### Server-Side Events

**Location:** `server/src/services/socket.service.ts`

```typescript
class SocketService {
  private io: Server;

  init(server: any) {
    this.io = new Server(server, {
      cors: { origin: '*' }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join shop room
      socket.on('join_shop', (shopId: string) => {
        socket.join(`shop_${shopId}`);
        console.log(`Socket ${socket.id} joined shop ${shopId}`);
      });

      // Leave shop room
      socket.on('leave_shop', (shopId: string) => {
        socket.leave(`shop_${shopId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Broadcast to shop room
  broadcastToShop(shopId: string, event: string, data: any) {
    this.io.to(`shop_${shopId}`).emit(event, data);
  }

  // Broadcast dashboard update
  broadcastDashboardUpdate(shopId: string, data: any) {
    this.broadcastToShop(shopId, 'dashboard_update', data);
  }

  // Broadcast product update
  broadcastProductUpdate(shopId: string, data: any) {
    this.broadcastToShop(shopId, 'product_update', data);
  }

  // Broadcast inventory alert
  broadcastInventoryAlert(shopId: string, data: any) {
    this.broadcastToShop(shopId, 'inventory_alert', data);
  }
}

export const socketService = new SocketService();
```

#### Client-Side Events

**Location:** `bva-frontend/src/lib/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (shopId: string) => {
  if (!socket) {
    socket = io(API_URL);
  }

  // Join shop room
  socket.emit('join_shop', shopId);

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onDashboardUpdate = (callback: (data: any) => void) => {
  socket?.on('dashboard_update', callback);
};

export const onProductUpdate = (callback: (data: any) => void) => {
  socket?.on('product_update', callback);
};

export const onInventoryAlert = (callback: (data: any) => void) => {
  socket?.on('inventory_alert', callback);
};
```

---

## Security & Data Privacy

### Security Measures

#### 1. JWT Token Security
- Tokens expire after 7 days
- Tokens are validated on every request
- Tokens are stored in httpOnly cookies (recommended) or localStorage
- Refresh tokens for long-term sessions

#### 2. Webhook Authentication
- All webhooks require valid JWT token
- ShopId is validated against user's shops
- Rate limiting prevents abuse
- HMAC signatures for production

#### 3. Data Access Control
- Users can only access their own shops
- Shop access requires explicit linking
- Role-based access control (RBAC)
- Integration can be disconnected anytime

#### 4. Read-Only Integration
- BVA only reads from platforms
- No write operations to platform data
- Seller maintains full control
- Audit logs for all operations

#### 5. CORS Configuration
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173', // Shopee Clone
    'http://localhost:8080', // BVA Frontend
    'http://localhost:3001', // Lazada Clone
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Roadmap for Lazada-Clone Integration

### Phase 1: Setup Foundation (Week 1)

#### 1.1 Environment Configuration
- [ ] Clone Lazada-Clone repository
- [ ] Set up development environment
- [ ] Configure environment variables
- [ ] Ensure PostgreSQL and Redis are running

**Files to Create/Modify:**
```bash
lazada-clone/.env
  VITE_API_URL=http://localhost:3000/api
  VITE_BVA_WEBHOOK_URL=http://localhost:3000/api/webhooks
```

#### 1.2 Authentication System
- [ ] Review Lazada-Clone's authentication
- [ ] Implement JWT token storage
- [ ] Create AuthContext (if not exists)
- [ ] Test login/register flow

**Files to Create/Modify:**
```
lazada-clone/src/contexts/AuthContext.tsx
lazada-clone/src/services/api.ts
```

#### 1.3 Database Schema Updates
- [ ] Review existing Prisma schema
- [ ] Add LAZADA to Platform enum
- [ ] Run migrations
- [ ] Test database connections

**Files to Modify:**
```prisma
// server/prisma/schema.prisma
enum Platform {
  SHOPEE
  LAZADA  // Add this
  TIKTOK
  OTHER
}
```

### Phase 2: Integration Service (Week 2)

#### 2.1 Lazada Integration Service
- [ ] Create lazadaIntegration.service.ts
- [ ] Implement syncProducts()
- [ ] Implement syncSales()
- [ ] Implement syncAllData()

**File Structure:**
```
server/src/service/
  ├── integration.service.ts (update)
  ├── shopeeIntegration.service.ts
  └── lazadaIntegration.service.ts (new)
```

**Template:**
```typescript
// server/src/service/lazadaIntegration.service.ts
class LazadaIntegrationService {
  private lazadaApiUrl = process.env.LAZADA_CLONE_API_URL;

  async syncAllData(shopId: string, token: string) {
    const [productsCount, salesCount] = await Promise.all([
      this.syncProducts(shopId, token),
      this.syncSales(shopId, token)
    ]);
    return { products: productsCount, sales: salesCount };
  }

  async syncProducts(shopId: string, token: string): Promise<number> {
    // Fetch products from Lazada-Clone API
    const response = await axios.get(
      `${this.lazadaApiUrl}/products/shop/${shopId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Map and save products
    // Similar to shopeeIntegration.service.ts
  }

  async syncSales(shopId: string, token: string): Promise<number> {
    // Fetch orders from Lazada-Clone API
    // Similar to shopeeIntegration.service.ts
  }
}

export const lazadaIntegrationService = new LazadaIntegrationService();
```

#### 2.2 Integration Controller Updates
- [ ] Update integration.controller.ts
- [ ] Add Lazada to platform switch
- [ ] Test integration creation

**File to Modify:**
```typescript
// server/src/controllers/integration.controller.ts
async syncIntegration(req: Request, res: Response) {
  const { id } = req.params;
  const integration = await prisma.integration.findUnique({ where: { id } });
  const settings = integration.settings as any;
  const token = settings.lazadaToken || settings.shopeeToken;

  let result;
  switch (integration.platform) {
    case 'SHOPEE':
      result = await shopeeIntegrationService.syncAllData(integration.shopId, token);
      break;
    case 'LAZADA':  // Add this
      result = await lazadaIntegrationService.syncAllData(integration.shopId, token);
      break;
    default:
      throw new Error(`Unsupported platform: ${integration.platform}`);
  }

  res.json({ success: true, data: result });
}
```

### Phase 3: Webhook Implementation (Week 3)

#### 3.1 Lazada-Clone Webhook Service
- [ ] Create webhook.service.ts in Lazada-Clone
- [ ] Implement webhook methods
- [ ] Test webhook sending

**File to Create:**
```typescript
// lazada-clone/src/services/webhook.service.ts
class WebhookService {
  private webhookUrl = import.meta.env.VITE_BVA_WEBHOOK_URL;

  private getUserData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const shops = JSON.parse(localStorage.getItem('shops') || '[]');
    const token = localStorage.getItem('authToken');
    return { userId: user.id, shopId: shops[0]?.id, token };
  }

  async sendProductCreated(product: any) {
    const { shopId, token } = this.getUserData();
    await axios.post(
      `${this.webhookUrl}/products/created`,
      { ...product, shopId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  // ... other webhook methods
}

export const webhookService = new WebhookService();
```

#### 3.2 Integrate Webhooks in Components
- [ ] Update product creation components
- [ ] Update order creation components
- [ ] Update inventory management components
- [ ] Test webhook triggers

**Example Files:**
```
lazada-clone/src/app/(seller)/seller-dashboard/add-product/page.tsx
lazada-clone/src/app/(buyer)/checkout/page.tsx
```

### Phase 4: Frontend Integration (Week 4)

#### 4.1 BVA Integration Check Page
- [ ] Create BVA integration check page
- [ ] Implement permission dialog
- [ ] Implement postMessage communication
- [ ] Test iframe integration

**File to Create:**
```typescript
// lazada-clone/src/app/bva-integration-check/page.tsx
'use client';

export default function BVAIntegrationCheck() {
  const { user, shop } = useAuth();
  const [showPermission, setShowPermission] = useState(false);

  useEffect(() => {
    if (user && shop) {
      setShowPermission(true);
    } else {
      router.push('/seller-login');
    }
  }, [user, shop]);

  const handleGrantPermission = () => {
    const token = localStorage.getItem('authToken');
    window.parent.postMessage({
      type: 'LAZADA_CLONE_AUTH_SUCCESS',
      shop: { id: shop.id, name: shop.name },
      user: { id: user.id, email: user.email },
      token
    }, '*');
  };

  return (
    <div className="p-8">
      <h1>BVA Integration</h1>
      {showPermission && (
        <button onClick={handleGrantPermission}>
          Grant Permission
        </button>
      )}
    </div>
  );
}
```

#### 4.2 BVA Frontend Integration Modal
- [ ] Create LazadaIntegrationModal component
- [ ] Update Settings page
- [ ] Test integration flow

**File to Create:**
```typescript
// bva-frontend/src/components/LazadaIntegrationModal.tsx
export default function LazadaIntegrationModal({
  isOpen,
  onClose,
  onConnect
}: Props) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'LAZADA_CLONE_AUTH_SUCCESS') {
        const { shop, user, token } = event.data;
        onConnect({
          shopId: shop.id,
          shopName: shop.name,
          lazadaToken: token
        });
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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

### Phase 5: Testing & Refinement (Week 5)

#### 5.1 Unit Testing
- [ ] Test integration service
- [ ] Test webhook service
- [ ] Test API endpoints
- [ ] Test authentication flow

#### 5.2 Integration Testing
- [ ] End-to-end integration flow
- [ ] Webhook delivery
- [ ] Real-time updates
- [ ] Data synchronization accuracy

#### 5.3 Performance Testing
- [ ] Load testing
- [ ] Sync performance
- [ ] WebSocket performance
- [ ] Database query optimization

### Phase 6: Documentation & Deployment (Week 6)

#### 6.1 Documentation
- [ ] Update API documentation
- [ ] Create Lazada integration guide
- [ ] Update troubleshooting guide
- [ ] Create video tutorials

#### 6.2 Deployment
- [ ] Deploy to staging environment
- [ ] Test in production-like environment
- [ ] Deploy to production
- [ ] Monitor for issues

---

## Testing Strategy

### Manual Testing Checklist

#### Integration Flow
- [ ] User can open Settings page
- [ ] User can click "Connect Lazada"
- [ ] Modal opens with iframe
- [ ] User can login to Lazada-Clone
- [ ] Permission dialog appears
- [ ] User can grant permission
- [ ] BVA receives shop data
- [ ] Integration is created
- [ ] Initial sync completes
- [ ] Products appear in Dashboard
- [ ] Sales appear in Reports

#### Webhook Testing
- [ ] Create product in Lazada → Appears in BVA
- [ ] Update product in Lazada → Updates in BVA
- [ ] Delete product in Lazada → Removes from BVA
- [ ] Create order in Lazada → Appears in BVA
- [ ] Update order status → Updates in BVA
- [ ] Update inventory → Updates in BVA

#### Real-Time Testing
- [ ] WebSocket connects successfully
- [ ] User joins shop room
- [ ] Real-time updates appear instantly
- [ ] Multiple tabs sync correctly
- [ ] Reconnection works after disconnect

### Automated Testing

#### API Tests
```typescript
// test/integration/lazada.test.ts
describe('Lazada Integration', () => {
  it('should sync products', async () => {
    const result = await lazadaIntegrationService.syncProducts(shopId, token);
    expect(result).toBeGreaterThan(0);
  });

  it('should handle webhooks', async () => {
    const response = await request(app)
      .post('/api/webhooks/products/created')
      .set('Authorization', `Bearer ${token}`)
      .send(productData);
    expect(response.status).toBe(200);
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue: Integration not connecting
**Symptoms:** Modal shows but doesn't connect
**Solutions:**
1. Check if Lazada-Clone is running on correct port
2. Verify VITE_API_URL in Lazada .env
3. Check browser console for CORS errors
4. Verify user is logged into Lazada-Clone

#### Issue: Webhooks not received
**Symptoms:** Changes in Lazada don't appear in BVA
**Solutions:**
1. Check VITE_BVA_WEBHOOK_URL in Lazada .env
2. Verify BVA Server is running
3. Check network tab for 401/500 errors
4. Verify JWT token is valid
5. Check server logs for errors

#### Issue: Products not syncing
**Symptoms:** Initial sync completes but no products
**Solutions:**
1. Verify products exist in Lazada-Clone
2. Check API endpoint returns data
3. Verify field mapping is correct
4. Check database for errors
5. Review sync service logs

#### Issue: Real-time updates not working
**Symptoms:** Manual refresh required to see changes
**Solutions:**
1. Check WebSocket connection in browser console
2. Verify user joined shop room
3. Check server WebSocket logs
4. Test with multiple browser tabs
5. Check firewall/proxy settings

---

## Summary

### What We've Built

1. **Multi-Platform Architecture** - Supports multiple e-commerce platforms
2. **Read-Only Integration** - BVA only reads, never writes to platforms
3. **Real-Time Sync** - Webhooks provide instant updates
4. **Unified Dashboard** - All data aggregated in one place
5. **Shop-Centric** - Multi-shop support for sellers
6. **Scalable** - Easy to add new platforms

### Key Takeaways for Lazada Implementation

1. **Follow the Pattern** - Use Shopee integration as blueprint
2. **Field Mapping** - Carefully map Lazada fields to BVA schema
3. **Authentication** - Implement JWT token flow correctly
4. **Webhooks** - Critical for real-time updates
5. **Testing** - Thorough testing at each phase

### Next Steps

1. Review this document thoroughly
2. Set up development environment
3. Start with Phase 1 (Foundation)
4. Test each phase before moving forward
5. Document any deviations or issues

---

## Appendix

### Environment Variables Reference

#### Lazada-Clone
```bash
VITE_API_URL=http://localhost:3000/api
VITE_BVA_WEBHOOK_URL=http://localhost:3000/api/webhooks
```

#### BVA Frontend
```bash
VITE_API_URL=http://localhost:3000
VITE_LAZADA_CLONE_URL=http://localhost:3001
```

#### BVA Server
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
LAZADA_CLONE_API_URL=http://localhost:3001/api
```

### File Structure Reference

```
bva-server/
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── integration.controller.ts
│   │   │   └── webhook.controller.ts
│   │   ├── service/
│   │   │   ├── integration.service.ts
│   │   │   ├── shopeeIntegration.service.ts
│   │   │   └── lazadaIntegration.service.ts
│   │   ├── middlewares/
│   │   │   └── webhook.middleware.ts
│   │   └── routes/
│   │       ├── integration.routes.ts
│   │       └── webhook.routes.ts
│   └── prisma/
│       └── schema.prisma
├── bva-frontend/
│   └── src/
│       ├── components/
│       │   ├── ShopeeCloneIntegrationModal.tsx
│       │   └── LazadaIntegrationModal.tsx
│       ├── pages/
│       │   └── Settings.tsx
│       └── hooks/
│           └── useRealtimeDashboard.ts
└── lazada-clone/
    ├── src/
    │   ├── app/
    │   │   └── bva-integration-check/
    │   │       └── page.tsx
    │   ├── contexts/
    │   │   └── AuthContext.tsx
    │   └── services/
    │       ├── api.ts
    │       └── webhook.service.ts
    └── .env
```

---

**End of Document**

This blueprint provides everything needed to implement Lazada-Clone (or any e-commerce platform) integration with BVA. Follow the roadmap, refer to Shopee implementations as examples, and maintain consistency across all integrations.
