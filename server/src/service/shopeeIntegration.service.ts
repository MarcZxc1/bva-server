// src/service/shopeeIntegration.service.ts
import prisma from "../lib/prisma";

// Shopee-Clone API base URL
// Note: Shopee-Clone uses the same server (port 3000) but we need to use the external API endpoints
const SHOPEE_CLONE_API_URL = process.env.SHOPEE_CLONE_API_URL || "http://localhost:3000";

// Interfaces for Shopee-Clone API responses
interface ShopeeProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  sku?: string;
  category?: string;
  image?: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ShopeeOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface ShopeeOrder {
  id: string;
  orderId?: string;
  items: ShopeeOrderItem[];
  total_price?: number;
  totalPrice?: number;
  total?: number;
  status?: string;
  customerName?: string;
  customerEmail?: string;
  createdAt?: string;
}

interface ShopeeApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ShopeeIntegrationService {
  /**
   * Sync all data from Shopee-Clone for a user
   */
  async syncAllData(userId: string, apiKey: string): Promise<{ products: number; sales: number }> {
    console.log(`🔄 Starting Shopee-Clone sync for user ${userId}`);

    // Get the user's shop
    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId },
    });

    if (!shop) {
      throw new Error("User does not have a shop. Cannot sync data.");
    }

    // Sync products and sales in parallel
    const [productsCount, salesCount] = await Promise.all([
      this.syncProducts(shop.id, apiKey),
      this.syncSales(shop.id, apiKey),
    ]);

    console.log(`✅ Shopee-Clone sync complete: ${productsCount} products, ${salesCount} sales`);

    return { products: productsCount, sales: salesCount };
  }

  /**
   * Fetch and sync products from Shopee-Clone
   */
  async syncProducts(shopId: string, apiKey: string): Promise<number> {
    try {
      console.log(`📦 Syncing products for shop ${shopId}...`);

      // Use external API endpoint for products
      const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/external/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-API-Key": apiKey,
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch products from Shopee-Clone: ${response.status}`);
        return 0;
      }

      const result: ShopeeApiResponse<ShopeeProduct[]> | ShopeeProduct[] = await response.json();
      
      // Handle both response formats: { success, data } or direct array
      const products: ShopeeProduct[] = Array.isArray(result) 
        ? result 
        : (result as ShopeeApiResponse<ShopeeProduct[]>).data || [];

      if (!products || products.length === 0) {
        console.log("📦 No products found in Shopee-Clone");
        return 0;
      }

      // Upsert each product
      let syncedCount = 0;
      for (const product of products) {
        try {
          await prisma.product.upsert({
            where: {
              shopId_externalId: {
                shopId,
                externalId: product.id,
              },
            },
            update: {
              name: product.name,
              description: product.description || null,
              price: product.price,
              cost: product.cost || null,
              category: product.category || null,
              imageUrl: product.image || null,
              stock: product.stock || 0,
              updatedAt: new Date(),
            },
            create: {
              shopId,
              externalId: product.id,
              sku: product.sku || `SHOPEE-${product.id}`,
              name: product.name,
              description: product.description || null,
              price: product.price,
              cost: product.cost || null,
              category: product.category || null,
              imageUrl: product.image || null,
              stock: product.stock || 0,
            },
          });
          syncedCount++;
        } catch (error) {
          console.error(`❌ Error syncing product ${product.id}:`, error);
        }
      }

      console.log(`📦 Synced ${syncedCount}/${products.length} products`);
      return syncedCount;
    } catch (error) {
      console.error("❌ Error syncing products from Shopee-Clone:", error);
      return 0;
    }
  }

  /**
   * Fetch and sync sales/orders from Shopee-Clone
   */
  async syncSales(shopId: string, apiKey: string): Promise<number> {
    try {
      console.log(`💰 Syncing sales for shop ${shopId}...`);

      // Use external API endpoint for orders
      const endpoints = [
        "/api/external/orders",
        "/api/orders",
        "/api/sales",
        "/api/seller/orders",
      ];

      let orders: ShopeeOrder[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${SHOPEE_CLONE_API_URL}${endpoint}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
              "X-API-Key": apiKey,
            },
          });

          if (response.ok) {
            const result = await response.json();
            orders = Array.isArray(result) ? result : result.data || [];
            if (orders.length > 0) {
              console.log(`💰 Found ${orders.length} orders at ${endpoint}`);
              break;
            }
          }
        } catch (error) {
          // Try next endpoint
          continue;
        }
      }

      if (!orders || orders.length === 0) {
        console.log("💰 No sales/orders found in Shopee-Clone");
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

          await prisma.sale.upsert({
            where: {
              shopId_externalId: {
                shopId,
                externalId: order.id,
              },
            },
            update: {
              items: items,
              total,
              revenue,
              profit,
              status: order.status || "completed",
              customerName: order.customerName || null,
              customerEmail: order.customerEmail || null,
              // Only update createdAt if it's a new record (not in update)
            },
            create: {
              shopId,
              externalId: order.id,
              platform: "SHOPEE",
              platformOrderId: order.orderId || order.id,
              items: items,
              total,
              revenue,
              profit,
              status: order.status || "completed",
              customerName: order.customerName || null,
              customerEmail: order.customerEmail || null,
              // Use time-traveled date for ML service historical data
              createdAt: timeTraveledDate,
            },
          });
          syncedCount++;
        } catch (error) {
          console.error(`❌ Error syncing order ${order.id}:`, error);
        }
      }

      console.log(`💰 Synced ${syncedCount}/${orders.length} sales`);
      return syncedCount;
    } catch (error) {
      console.error("❌ Error syncing sales from Shopee-Clone:", error);
      return 0;
    }
  }

  /**
   * Fetch products from Shopee-Clone (without saving)
   */
  async fetchProducts(apiKey: string): Promise<ShopeeProduct[]> {
    try {
      // Use external API endpoint for products
      const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/external/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-API-Key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : result.data || [];
    } catch (error) {
      console.error("Error fetching products from Shopee-Clone:", error);
      return [];
    }
  }

  /**
   * Fetch sales from Shopee-Clone (without saving)
   */
  async fetchSales(apiKey: string): Promise<ShopeeOrder[]> {
    try {
      // Use external API endpoint for orders
      const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/external/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-API-Key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sales: ${response.status}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : result.data || [];
    } catch (error) {
      console.error("Error fetching sales from Shopee-Clone:", error);
      return [];
    }
  }

  /**
   * Trigger a manual sync for a user
   */
  async triggerSync(userId: string, apiKey: string): Promise<{ products: number; sales: number }> {
    return this.syncAllData(userId, apiKey);
  }
}

export const shopeeIntegrationService = new ShopeeIntegrationService();
