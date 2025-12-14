// src/service/lazadaIntegration.service.ts
import prisma from "../lib/prisma";

// Lazada-Clone API base URL
// Note: Lazada-Clone now uses the main server (BVA Server) on port 3000
// The frontend runs on port 3001, but API calls go to the main server
const LAZADA_CLONE_API_URL = process.env.LAZADA_CLONE_API_URL || process.env.BACKEND_URL || "http://localhost:3000";

// Interfaces for Lazada-Clone API responses
interface LazadaProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  sku?: string;
  category?: string;
  image?: string;
  image_url?: string;
  stock?: number;
  quantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface LazadaOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface LazadaOrder {
  id: string;
  orderId?: string;
  items: LazadaOrderItem[];
  total_price?: number;
  totalPrice?: number;
  total?: number;
  status?: string;
  customerName?: string;
  customerEmail?: string;
  createdAt?: string;
}

interface LazadaApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class LazadaIntegrationService {
  /**
   * Sync all data from Lazada-Clone for a shop (READ-ONLY OPERATION)
   * 
   * IMPORTANT: This is a READ-ONLY operation. BVA ONLY READS from Lazada-Clone.
   * - Fetches products from Lazada-Clone API (GET request only)
   * - Fetches sales/orders from Lazada-Clone API (GET request only)
   * - Saves fetched data to BVA database (local copy)
   * - Does NOT create, update, or modify anything in Lazada-Clone
   * 
   * Purpose: Refresh BVA's local copy of Lazada-Clone data for real-time access.
   * This allows Restock Planner, SmartShelf, and MarketMate to work with current data.
   * 
   * Uses JWT token for authentication (read-only access)
   * @param shopId - The shop ID to sync data for (can be linked or owned)
   * @param token - Lazada-Clone JWT token for authentication
   */
  async syncAllData(shopId: string, token: string): Promise<{ products: number; sales: number }> {
    console.log(`🔄 Starting Lazada-Clone sync (READ-ONLY) for shop ${shopId}`);
    console.log(`📖 BVA is only READING from Lazada-Clone - no data will be written to Lazada-Clone`);
    console.log(`🔑 Using token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);

    // Verify shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new Error(`Shop ${shopId} not found. Cannot sync data.`);
    }

    console.log(`📦 Syncing data for shop: ${shop.name} (${shop.id})`);
    console.log(`🌐 API URL: ${LAZADA_CLONE_API_URL}`);

    // Sync products and sales in parallel (both are read-only GET requests)
    const [productsCount, salesCount] = await Promise.all([
      this.syncProducts(shopId, token),
      this.syncSales(shopId, token),
    ]);

    console.log(`✅ Lazada-Clone sync complete: ${productsCount} products, ${salesCount} sales`);
    console.log(`📝 Data saved to BVA database only - Lazada-Clone was not modified`);

    return { products: productsCount, sales: salesCount };
  }

  /**
   * Fetch and sync products from Lazada-Clone (READ-ONLY)
   * This method ONLY READS from Lazada-Clone API and writes to BVA database.
   * It does NOT write, create, or modify anything in Lazada-Clone.
   * Purpose: Refresh/update BVA's local copy of Lazada-Clone product data.
   * Uses JWT token for authentication (read-only access)
   */
  async syncProducts(shopId: string, token: string): Promise<number> {
    try {
      console.log(`📦 Syncing products for shop ${shopId}...`);

      let products: LazadaProduct[] = [];

      // Use shop-specific endpoint for products (READ-ONLY GET request)
      // This ONLY reads from Lazada-Clone - does NOT modify Lazada-Clone
      const response = await fetch(`${LAZADA_CLONE_API_URL}/api/products/shop/${shopId}`, {
        method: "GET", // READ-ONLY - no POST/PUT/PATCH/DELETE
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const rawResult = await response.json();
        console.log(`📦 Raw API response from Lazada-Clone:`, {
          isArray: Array.isArray(rawResult),
          hasSuccess: typeof rawResult === 'object' && 'success' in rawResult,
          hasData: typeof rawResult === 'object' && 'data' in rawResult,
          keys: typeof rawResult === 'object' ? Object.keys(rawResult) : [],
        });
        
        const result: LazadaApiResponse<LazadaProduct[]> | LazadaProduct[] = rawResult;
        // Handle both response formats: { success, data } or direct array
        if (Array.isArray(result)) {
          products = result;
        } else if (result && typeof result === 'object' && 'data' in result) {
          products = (result as LazadaApiResponse<LazadaProduct[]>).data || [];
        } else if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
          products = (result as LazadaApiResponse<LazadaProduct[]>).data || [];
        } else {
          console.warn(`⚠️ Unexpected response format from Lazada-Clone:`, typeof result);
          products = [];
        }
        console.log(`✅ Fetched ${products.length} products from shop-specific endpoint`);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Failed to fetch products from shop endpoint: ${response.status} - ${errorText}`);
        // Try fallback to general products endpoint
        const fallbackResponse = await fetch(`${LAZADA_CLONE_API_URL}/api/products`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          products = Array.isArray(fallbackResult) 
            ? fallbackResult 
            : (fallbackResult as LazadaApiResponse<LazadaProduct[]>).data || [];
          console.log(`✅ Fetched ${products.length} products from fallback endpoint`);
        } else {
          console.warn(`⚠️ Fallback also failed: ${fallbackResponse.status}`);
          return 0;
        }
      }

      if (!products || products.length === 0) {
        console.log("📦 No products found in Lazada-Clone");
        console.log(`⚠️  Lazada-Clone API returned empty products array for shop ${shopId}`);
        console.log(`   This could mean:`);
        console.log(`   1. Lazada-Clone has no products yet`);
        console.log(`   2. The API endpoint is incorrect`);
        console.log(`   3. The token doesn't have access to this shop's products`);
        return 0;
      }

      console.log(`📦 Found ${products.length} products in Lazada-Clone to sync`);
      console.log(`   Sample product:`, products[0] ? {
        id: products[0].id,
        name: products[0].name,
        price: products[0].price,
        stock: products[0].stock || products[0].quantity,
      } : 'N/A');

      // Upsert each product
      // DATA MAPPING: Lazada Product -> BVA Product Table
      // - product.name -> Product.name (required for MarketMate, SmartShelf)
      // - product.price -> Product.price (required for Restock Planner, MarketMate)
      // - product.stock/quantity -> Product.stock (required for SmartShelf, Restock Planner)
      // - product.image/image_url -> Product.imageUrl (required for MarketMate campaigns)
      // - product.description -> Product.description (optional, for product details)
      // - product.category -> Product.category (optional, for filtering)
      // - product.cost -> Product.cost (required for profit calculation in Restock Planner)
      // - product.id -> Product.externalId (links to Lazada-Clone)
      let syncedCount = 0;
      for (const product of products) {
        try {
          // Generate SKU - ensure it's unique for this shop
          const baseSku = product.sku || `LAZADA-${product.id}`;
          
          // Check if product exists by externalId first
          const existingByExternalId = await prisma.product.findUnique({
            where: {
              shopId_externalId: {
                shopId,
                externalId: product.id,
              },
            },
          });

          // If exists by externalId, update it
          if (existingByExternalId) {
            await prisma.product.update({
              where: {
                id: existingByExternalId.id,
              },
              data: {
                name: product.name, // MarketMate, SmartShelf
                description: product.description || null,
                price: product.price, // Restock Planner, MarketMate
                cost: product.cost || null, // Restock Planner profit calculation
                category: product.category || null,
                imageUrl: product.image || product.image_url || null, // MarketMate campaigns
                stock: product.stock || product.quantity || 0, // SmartShelf, Restock Planner
                updatedAt: new Date(),
              },
            });
            syncedCount++;
            continue;
          }

          // Check if SKU already exists for this shop
          const existingBySku = await prisma.product.findFirst({
            where: {
              shopId,
              sku: baseSku,
            },
          });

          // If SKU exists, update it instead of creating duplicate
          if (existingBySku) {
            await prisma.product.update({
              where: { id: existingBySku.id },
              data: {
                name: product.name,
                description: product.description || null,
                price: product.price,
                cost: product.cost || null,
                category: product.category || null,
                imageUrl: product.image || product.image_url || null,
                stock: product.stock || product.quantity || 0,
                externalId: product.id, // Update externalId
                updatedAt: new Date(),
              },
            });
            syncedCount++;
            continue;
          }

          // Create new product with complete data mapping
          await prisma.product.create({
            data: {
              shopId,
              externalId: product.id, // Link to Lazada-Clone
              sku: baseSku,
              name: product.name, // Required: MarketMate, SmartShelf
              description: product.description || null,
              price: product.price, // Required: Restock Planner, MarketMate
              cost: product.cost || null, // Required: Restock Planner profit calculation
              category: product.category || null,
              imageUrl: product.image || product.image_url || null, // Required: MarketMate campaigns
              stock: product.stock || product.quantity || 0, // Required: SmartShelf, Restock Planner
            },
          });
          syncedCount++;
          console.log(`✅ Created product: ${product.name} (Price: ${product.price}, Stock: ${product.stock || product.quantity})`);
        } catch (error: any) {
          // Handle specific Prisma errors
          if (error.code === 'P2002') {
            console.error(`❌ Unique constraint violation for product ${product.id}:`, error.meta?.target);
            // Try to find and update existing product
            try {
              const existing = await prisma.product.findFirst({
                where: {
                  shopId,
                  OR: [
                    { externalId: product.id },
                    { sku: product.sku || `LAZADA-${product.id}` },
                  ],
                },
              });
              
              if (existing) {
                await prisma.product.update({
                  where: { id: existing.id },
                  data: {
                    name: product.name,
                    description: product.description || null,
                    price: product.price,
                    cost: product.cost || null,
                    category: product.category || null,
                    imageUrl: product.image || product.image_url || null,
                    stock: product.stock || product.quantity || 0,
                    externalId: product.id, // Ensure externalId is set
                    updatedAt: new Date(),
                  },
                });
                syncedCount++;
                console.log(`✅ Updated existing product ${existing.id} for external ID ${product.id}`);
              }
            } catch (updateError) {
              console.error(`❌ Failed to update existing product for ${product.id}:`, updateError);
            }
          } else {
            console.error(`❌ Error syncing product ${product.id}:`, error);
          }
        }
      }

      console.log(`📦 Synced ${syncedCount}/${products.length} products to BVA database`);
      if (syncedCount === 0 && products.length > 0) {
        console.warn(`⚠️  WARNING: ${products.length} products fetched but 0 synced. Check for errors above.`);
      }
      return syncedCount;
    } catch (error) {
      console.error("❌ Error syncing products from Lazada-Clone:", error);
      return 0;
    }
  }

  /**
   * Fetch and sync sales/orders from Lazada-Clone (READ-ONLY)
   * This method ONLY READS from Lazada-Clone API and writes to BVA database.
   * It does NOT write, create, or modify anything in Lazada-Clone.
   * Purpose: Refresh/update BVA's local copy of Lazada-Clone sales data.
   * Uses JWT token for authentication (read-only access)
   */
  async syncSales(shopId: string, token: string): Promise<number> {
    try {
      console.log(`💰 Syncing sales for shop ${shopId}...`);

      // Use seller orders endpoint with JWT token - try shop-specific first
      const endpoints = [
        `/api/orders/seller/${shopId}`,  // Shop-specific seller orders
        `/api/orders/shop/${shopId}`,    // Alternative shop endpoint
        "/api/orders/my",                 // My orders (if token has user context)
        "/api/orders",                    // General orders endpoint
      ];

      let orders: LazadaOrder[] = [];

      for (const endpoint of endpoints) {
        try {
          console.log(`💰 Trying endpoint: ${endpoint} (READ-ONLY)`);
          // READ-ONLY GET request - does NOT modify Lazada-Clone
          const response = await fetch(`${LAZADA_CLONE_API_URL}${endpoint}`, {
            method: "GET", // READ-ONLY - no POST/PUT/PATCH/DELETE
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            // Handle both { success: true, data: [...] } and direct array formats
            if (Array.isArray(result)) {
              orders = result;
            } else if (result.data && Array.isArray(result.data)) {
              orders = result.data;
            } else if (result.success && result.data && Array.isArray(result.data)) {
              orders = result.data;
            }
            
            if (orders.length > 0) {
              console.log(`✅ Found ${orders.length} orders at ${endpoint}`);
              break;
            } else {
              console.log(`⚠️ Endpoint ${endpoint} returned empty array`);
            }
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Endpoint ${endpoint} failed: ${response.status} - ${errorText}`);
          }
        } catch (error: any) {
          console.warn(`⚠️ Error trying ${endpoint}:`, error.message);
          // Try next endpoint
          continue;
        }
      }

      if (!orders || orders.length === 0) {
        console.log("💰 No sales/orders found in Lazada-Clone");
        return 0;
      }

      // TIME TRAVEL LOGIC: Distribute orders across the last 30 days
      // This ensures ML service has historical data for forecasting
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const timeRangeMs = now.getTime() - thirtyDaysAgo.getTime();

      // Upsert each sale with time-traveled dates
      let syncedCount = 0;
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        if (!order) continue; // Skip if order is undefined
        
        try {
          // Calculate total from different possible fields
          const total = order.total_price || order.totalPrice || order.total || 0;
          
          // Map items to our format
          const items = order.items?.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price,
          })) || [];

          // Calculate revenue (same as total for now)
          const revenue = total;
          
          // Calculate profit from actual product costs if available
          let profit = 0;
          if (items.length > 0) {
            // Fetch product costs from database
            const productIds = items.map(item => item.productId).filter(Boolean);
            if (productIds.length > 0) {
              const products = await prisma.product.findMany({
                where: {
                  shopId,
                  OR: [
                    { id: { in: productIds } },
                    { externalId: { in: productIds } },
                  ],
                },
                select: { id: true, externalId: true, cost: true },
              });

              const productCostMap = new Map<string, number>();
              products.forEach(p => {
                if (p.id) productCostMap.set(p.id, p.cost || 0);
                if (p.externalId) productCostMap.set(p.externalId, p.cost || 0);
              });

              // Calculate actual profit: (price - cost) * quantity
              profit = items.reduce((sum, item) => {
                const cost = productCostMap.get(item.productId) || 0;
                return sum + ((item.price - cost) * item.quantity);
              }, 0);
            }
          }
          
          // Fallback to 20% margin if we can't calculate profit
          if (profit === 0 && revenue > 0) {
            profit = revenue * 0.2;
          }

          // TIME TRAVEL: Assign random past date within last 30 days
          // Distribute evenly across the time range for better ML training
          const randomOffset = Math.random() * timeRangeMs;
          const timeTraveledDate = new Date(thirtyDaysAgo.getTime() + randomOffset);

          // DATA MAPPING: Lazada Order -> BVA Sale Table
          // - order.items -> Sale.items (required for Restock Planner analysis)
          // - order.total -> Sale.total, Sale.revenue (required for Reports, Dashboard)
          // - calculated profit -> Sale.profit (required for Reports, Restock Planner)
          // - order.status -> Sale.status (required for order tracking)
          // - order.id -> Sale.externalId (links to Lazada-Clone)
          // - timeTraveledDate -> Sale.createdAt (distributed for ML service historical data)
          await prisma.sale.upsert({
            where: {
              shopId_externalId: {
                shopId,
                externalId: order.id,
              },
            },
            update: {
              items: items, // Required: Restock Planner analyzes item sales
              total, // Required: Reports, Dashboard
              revenue, // Required: Reports, Dashboard
              profit, // Required: Reports, Restock Planner profit optimization
              status: order.status || "completed",
              customerName: order.customerName || null,
              customerEmail: order.customerEmail || null,
              // Only update createdAt if it's a new record (not in update)
            },
            create: {
              shopId,
              externalId: order.id, // Link to Lazada-Clone
              platform: "LAZADA",
              platformOrderId: order.orderId || order.id,
              items: items, // Required: Restock Planner analyzes item sales
              total, // Required: Reports, Dashboard
              revenue, // Required: Reports, Dashboard
              profit, // Required: Reports, Restock Planner profit optimization
              status: order.status || "completed",
              customerName: order.customerName || null,
              customerEmail: order.customerEmail || null,
              // Use time-traveled date for ML service historical data
              createdAt: timeTraveledDate,
            },
          });
          syncedCount++;
          console.log(`✅ Synced sale: ${order.id} (Total: ${total}, Profit: ${profit.toFixed(2)})`);
        } catch (error) {
          console.error(`❌ Error syncing order ${order.id}:`, error);
        }
      }

      console.log(`💰 Synced ${syncedCount}/${orders.length} sales to BVA database`);
      if (syncedCount === 0 && orders.length > 0) {
        console.warn(`⚠️  WARNING: ${orders.length} orders fetched but 0 synced. Check for errors above.`);
      }
      return syncedCount;
    } catch (error) {
      console.error("❌ Error syncing sales from Lazada-Clone:", error);
      return 0;
    }
  }

  /**
   * Fetch products from Lazada-Clone (without saving)
   * Uses JWT token for authentication
   */
  async fetchProducts(token: string): Promise<LazadaProduct[]> {
    try {
      // Use products endpoint with JWT token
      const response = await fetch(`${LAZADA_CLONE_API_URL}/api/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : result.data || [];
    } catch (error) {
      console.error("Error fetching products from Lazada-Clone:", error);
      return [];
    }
  }

  /**
   * Fetch sales from Lazada-Clone (without saving)
   * Uses JWT token for authentication
   */
  async fetchSales(token: string, shopId?: string): Promise<LazadaOrder[]> {
    try {
      // Use seller orders endpoint with JWT token
      const endpoint = shopId 
        ? `${LAZADA_CLONE_API_URL}/api/orders/shop/${shopId}`
        : `${LAZADA_CLONE_API_URL}/api/orders`;
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sales: ${response.status}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : result.data || [];
    } catch (error) {
      console.error("Error fetching sales from Lazada-Clone:", error);
      return [];
    }
  }

  /**
   * Trigger a manual sync for a shop
   * Uses JWT token for authentication
   * @param shopId - The shop ID to sync data for
   * @param token - Lazada-Clone JWT token for authentication
   */
  async triggerSync(shopId: string, token: string): Promise<{ products: number; sales: number }> {
    return this.syncAllData(shopId, token);
  }
}

export const lazadaIntegrationService = new LazadaIntegrationService();

