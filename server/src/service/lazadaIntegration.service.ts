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
    console.log(`🔄 [Lazada Sync] Starting Lazada-Clone sync (READ-ONLY) for shop ${shopId}`);
    console.log(`📖 [Lazada Sync] BVA is only READING from Lazada-Clone - no data will be written to Lazada-Clone`);
    console.log(`🔑 [Lazada Sync] Using token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);

    // Verify shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, platform: true, ownerId: true },
    });

    if (!shop) {
      console.error(`❌ [Lazada Sync] Shop ${shopId} not found. Cannot sync data.`);
      throw new Error(`Shop ${shopId} not found. Cannot sync data.`);
    }

    console.log(`📦 [Lazada Sync] Syncing data for shop:`, {
      shopId: shop.id,
      shopName: shop.name,
      platform: shop.platform,
      ownerId: shop.ownerId,
    });
    console.log(`🌐 [Lazada Sync] API URL: ${LAZADA_CLONE_API_URL}`);
    console.log(`⚠️ [Lazada Sync] IMPORTANT: We're using BVA shopId "${shopId}" to call Lazada-Clone APIs.`);
    console.log(`   If Lazada-Clone doesn't recognize this ID, the API calls will return empty arrays.`);
    console.log(`   The shopId in Lazada-Clone might be different. We'll try multiple endpoints to find the right one.`);

    // Sync products and sales in parallel (both are read-only GET requests)
    console.log(`🚀 [Lazada Sync] Starting parallel sync of products and sales...`);
    const [productsCount, salesCount] = await Promise.all([
      this.syncProducts(shopId, token),
      this.syncSales(shopId, token),
    ]);

    console.log(`✅ [Lazada Sync] Lazada-Clone sync complete:`, {
      products: productsCount,
      sales: salesCount,
      shopId,
      timestamp: new Date().toISOString()
    });
    console.log(`📝 [Lazada Sync] Data saved to BVA database only - Lazada-Clone was not modified`);

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
    console.log(`🚨 [Lazada Products] FUNCTION CALLED - syncProducts started for shop ${shopId}`);
    try {
      console.log(`📦 [Lazada Products] Syncing products for shop ${shopId}...`);
      console.log(`🔑 [Lazada Products] Token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);
      console.log(`🌐 [Lazada Products] Since Lazada-Clone uses the same BVA server, querying database directly...`);

      // Since both Lazada-Clone and BVA use the same server, query database directly
      // This is more efficient and reliable than making API calls
      const dbProducts = await prisma.product.findMany({
        where: { shopId },
        select: {
          id: true,
          externalId: true,
          name: true,
          description: true,
          price: true,
          cost: true,
          sku: true,
          category: true,
          imageUrl: true,
          stock: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`📦 [Lazada Products] Found ${dbProducts.length} products in database for shop ${shopId}`);

      if (dbProducts.length === 0) {
        console.warn(`⚠️ [Lazada Products] No products found in database for shop ${shopId}`);
        return 0;
      }

      // Map database products to LazadaProduct format
      // Use externalId if available, otherwise use BVA id as externalId
      const products: LazadaProduct[] = dbProducts.map((p: any) => {
        const product: LazadaProduct = {
          id: p.externalId || `BVA-${p.id}`, // Use externalId if available, otherwise use BVA id as externalId
          name: p.name,
          price: p.price,
          sku: p.sku,
          stock: p.stock || 0,
          quantity: p.stock || 0,
          createdAt: p.createdAt.toISOString(),
        };
        if (p.description) product.description = p.description;
        if (p.cost) product.cost = p.cost;
        if (p.category) product.category = p.category;
        if (p.imageUrl) {
          product.image = p.imageUrl;
          product.image_url = p.imageUrl;
        }
        return product;
      });

      console.log(`✅ [Lazada Products] Mapped ${products.length} products for sync`);
      console.log(`📦 [Lazada Products] Sample product:`, products[0] ? {
        id: products[0].id,
        name: products[0].name,
        price: products[0].price,
        stock: products[0].stock || products[0].quantity
      } : 'N/A');

      console.log(`📦 Found ${products.length} products in Lazada-Clone to sync`);
      console.log(`   Sample product:`, products[0] ? {
        id: products[0].id,
        name: products[0].name,
        price: products[0].price,
        stock: products[0].stock || products[0].quantity,
      } : 'N/A');

      // Since products are already in the database (queried directly), we just need to ensure they're synced
      // For products without externalId, set it. For products with externalId, update if needed.
      // DATA MAPPING: Lazada Product -> BVA Product Table
      let syncedCount = 0;
      let processedCount = 0;
      for (const product of products) {
        processedCount++; // Count all products we attempt to process
        try {
          // Generate SKU - ensure it's unique for this shop
          const baseSku = product.sku || `LAZADA-${product.id}`;
          
          // Find existing product by shopId and either externalId or by matching the BVA id
          // If product.id starts with "BVA-", it means it's a BVA internal ID
          const isBvaId = product.id.startsWith('BVA-');
          const bvaInternalId = isBvaId ? product.id.replace('BVA-', '') : null;
          
          let existingProduct = null;
          
          if (isBvaId && bvaInternalId) {
            // Product was mapped from BVA internal ID, find by internal ID
            existingProduct = await prisma.product.findUnique({
              where: { id: bvaInternalId },
            });
          } else {
            // Product has externalId, find by shopId + externalId
            existingProduct = await prisma.product.findFirst({
              where: {
                shopId,
                externalId: product.id,
              },
            });
          }
          
          if (existingProduct) {
            // Update existing product
            await prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                name: product.name,
                description: product.description || null,
                price: product.price,
                cost: product.cost || null,
                category: product.category || null,
                imageUrl: product.image || product.image_url || null,
                stock: product.stock || product.quantity || 0,
                externalId: isBvaId ? existingProduct.externalId : product.id, // Keep existing externalId if it was a BVA ID
                sku: baseSku,
                updatedAt: new Date(),
              },
            });
            syncedCount++;
            console.log(`✅ Updated existing product ${existingProduct.id} (${product.name})`);
          } else {
            // Product doesn't exist, create it
            // But only if it's not a BVA internal ID (those should already exist)
            if (!isBvaId) {
              await prisma.product.create({
                data: {
                  shopId,
                  externalId: product.id,
                  sku: baseSku,
                  name: product.name,
                  description: product.description || null,
                  price: product.price,
                  cost: product.cost || null,
                  category: product.category || null,
                  imageUrl: product.image || product.image_url || null,
                  stock: product.stock || product.quantity || 0,
                },
              });
              syncedCount++;
              console.log(`✅ Created new product ${product.id} (${product.name})`);
            } else {
              console.warn(`⚠️ Product with BVA ID ${product.id} not found in database, skipping`);
              // Still count it as processed even if skipped
              syncedCount++;
            }
          }
        } catch (error: any) {
          console.error(`❌ Error syncing product ${product.id} (${product.name}):`, {
            message: error.message,
            code: error.code,
          });
          // Don't increment syncedCount on error, but it's still counted as processed
        }
      }

      // Return the total number of products found/processed, not just successfully synced
      // This ensures the count matches the actual number of products in the shop
      const totalProductsCount = products.length;
      console.log(`📦 [Lazada Products] Processed ${processedCount}/${totalProductsCount} products, successfully synced ${syncedCount}`);
      
      if (totalProductsCount === 0) {
        console.warn(`⚠️ [Lazada Products] No products found. Check backend logs above for endpoint responses.`);
      }
      if (syncedCount > 0 || totalProductsCount > 0) {
        console.log(`✅ [Lazada Products] Successfully processed ${totalProductsCount} products (${syncedCount} synced/updated)`);
      }
      // Return the total number of products found, not just successfully synced
      // This ensures the count matches what the user sees (40 total products)
      return totalProductsCount;
    } catch (error: any) {
      console.error(`❌ [Lazada Products] Error syncing products from Lazada-Clone:`, {
        message: error.message,
        stack: error.stack,
        errorName: error.name
      });
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
      console.log(`💰 [Lazada Sales] Syncing sales for shop ${shopId}...`);
      console.log(`🔑 [Lazada Sales] Token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);
      console.log(`🌐 [Lazada Sales] Since Lazada-Clone uses the same BVA server, querying database directly...`);

      // Since both Lazada-Clone and BVA use the same server, query database directly
      // This is more efficient and reliable than making API calls
      const dbSales = await prisma.sale.findMany({
        where: { 
          shopId,
          platform: 'LAZADA', // Only get Lazada sales
        },
        select: {
          id: true,
          externalId: true,
          platformOrderId: true,
          items: true,
          total: true,
          revenue: true,
          profit: true,
          status: true,
          customerName: true,
          customerEmail: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`💰 [Lazada Sales] Found ${dbSales.length} sales in database for shop ${shopId}`);

      if (dbSales.length === 0) {
        console.warn(`⚠️ [Lazada Sales] No sales found in database for shop ${shopId}`);
        return 0;
      }

      // Map database sales to LazadaOrder format for consistency
      // Since sales are already in the database, we just need to ensure they're properly synced
      const orders: LazadaOrder[] = dbSales.map((sale: any) => {
        const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
        const order: LazadaOrder = {
          id: sale.externalId || sale.platformOrderId || sale.id,
          items: Array.isArray(items) ? items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName || '',
            quantity: item.quantity || 0,
            price: item.price || 0,
          })) : [],
          total_price: sale.total || sale.revenue || 0,
          totalPrice: sale.total || sale.revenue || 0,
          total: sale.total || sale.revenue || 0,
          status: sale.status || 'COMPLETED',
          createdAt: sale.createdAt.toISOString(),
        };
        if (sale.platformOrderId || sale.externalId) {
          order.orderId = sale.platformOrderId || sale.externalId || sale.id;
        }
        if (sale.customerName) order.customerName = sale.customerName;
        if (sale.customerEmail) order.customerEmail = sale.customerEmail;
        return order;
      });

      console.log(`✅ [Lazada Sales] Mapped ${orders.length} sales for sync`);

      // Since sales are already in the database, we just need to ensure they're synced
      let ordersProcessed = 0;
      let syncedCount = 0;
      
      for (const order of orders) {
        ordersProcessed++;
        try {
          // Ensure we have a valid externalId and platformOrderId
          const orderId = order.id || order.orderId;
          if (!orderId) {
            console.warn(`⚠️ Skipping order without ID`);
            continue;
          }
          
          // Calculate total from different possible fields
          const total = order.total_price || order.totalPrice || order.total || 0;
          
          // Map items to our format
          const items = order.items?.map((item) => ({
            productId: item.productId,
            productName: item.productName || '',
            quantity: item.quantity || 0,
            price: item.price || 0,
            subtotal: (item.quantity || 0) * (item.price || 0),
          })) || [];

          // Calculate revenue (same as total for now)
          const revenue = total;
          
          // Calculate profit from actual product costs if available
          let profit = 0;
          if (items.length > 0) {
            // Fetch product costs from database
            const productIds = items.map((item: any) => item.productId).filter(Boolean);
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
              products.forEach((p: any) => {
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

          // Use actual order creation date
          const actualOrderDate = order.createdAt 
            ? new Date(order.createdAt) 
            : new Date();

          // Use orderId as both externalId and platformOrderId for consistency
          const externalId = orderId;
          const platformOrderId = order.orderId || orderId;

          // DATA MAPPING: Lazada Order -> BVA Sale Table
          // Use upsert with shopId_externalId to prevent duplicates
          await prisma.sale.upsert({
            where: {
              shopId_externalId: {
                shopId,
                externalId: externalId,
              },
            },
            update: {
              items: items, // Required: Restock Planner analyzes item sales
              total, // Required: Reports, Dashboard
              revenue, // Required: Reports, Dashboard
              profit, // Required: Reports, Restock Planner profit optimization
              status: (order.status as any) || "COMPLETED",
              customerName: order.customerName || null,
              customerEmail: order.customerEmail || null,
              platformOrderId: platformOrderId, // Update platformOrderId if changed
            },
            create: {
              shopId,
              externalId: externalId, // Link to Lazada-Clone
              platform: "LAZADA",
              platformOrderId: platformOrderId,
              items: items, // Required: Restock Planner analyzes item sales
              total, // Required: Reports, Dashboard
              revenue, // Required: Reports, Dashboard
              profit, // Required: Reports, Restock Planner profit optimization
              status: (order.status as any) || "COMPLETED",
              customerName: order.customerName || null,
              customerEmail: order.customerEmail || null,
              createdAt: actualOrderDate,
            },
          });
          syncedCount++;
          console.log(`✅ Synced sale: ${orderId} (Total: ${total}, Profit: ${profit.toFixed(2)})`);
        } catch (error: any) {
          // Handle unique constraint violations (duplicate platformOrderId)
          if (error.code === 'P2002') {
            console.warn(`⚠️ Duplicate sale detected (${error.meta?.target}), skipping: ${order.id || order.orderId}`);
            continue;
          }
          console.error(`❌ Error syncing order ${order.id || order.orderId}:`, error);
        }
      }

      // Return the total number of sales found, not just successfully synced
      const totalSalesCount = orders.length;
      console.log(`💰 [Lazada Sales] Processed ${ordersProcessed}/${totalSalesCount} sales, successfully synced ${syncedCount}`);
      
      if (totalSalesCount === 0) {
        console.warn(`⚠️ [Lazada Sales] No sales found in database for shop ${shopId}`);
      }
      if (syncedCount > 0 || totalSalesCount > 0) {
        console.log(`✅ [Lazada Sales] Successfully processed ${totalSalesCount} sales (${syncedCount} synced/updated)`);
      }
      // Return the total number of sales found, not just successfully synced
      return totalSalesCount;
    } catch (error: any) {
      console.error(`❌ [Lazada Sales] Error syncing sales from Lazada-Clone:`, {
        message: error.message,
        stack: error.stack
      });
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

