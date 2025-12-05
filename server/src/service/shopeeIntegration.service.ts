// src/service/shopeeIntegration.service.ts
import prisma from "../lib/prisma";

// Shopee-Clone API base URL
const SHOPEE_CLONE_API_URL = process.env.SHOPEE_CLONE_API_URL || "http://localhost:3001";

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

      const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/products`, {
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

      // Try different endpoints that Shopee-Clone might use
      const endpoints = [
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

      // Upsert each sale
      let syncedCount = 0;
      for (const order of orders) {
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
          
          // Calculate profit if we have cost data (estimate 20% margin if unknown)
          const profit = revenue * 0.2;

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
              createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
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
      const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/products`, {
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
      const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/orders`, {
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
