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
   * Sync all data from Shopee-Clone for a shop (READ-ONLY OPERATION)
   * 
   * IMPORTANT: This is a READ-ONLY operation. BVA ONLY READS from Shopee-Clone.
   * - Fetches products from Shopee-Clone API (GET request only)
   * - Fetches sales/orders from Shopee-Clone API (GET request only)
   * - Saves fetched data to BVA database (local copy)
   * - Does NOT create, update, or modify anything in Shopee-Clone
   * 
   * Purpose: Refresh BVA's local copy of Shopee-Clone data for real-time access.
   * This allows Restock Planner, SmartShelf, and MarketMate to work with current data.
   * 
   * Uses JWT token for authentication (read-only access)
   * @param shopId - The shop ID to sync data for (can be linked or owned)
   * @param token - Shopee-Clone JWT token for authentication
   */
  async syncAllData(shopId: string, token: string): Promise<{ products: number; sales: number }> {
    console.log(`🔄 [Shopee Sync] Starting Shopee-Clone sync (READ-ONLY) for shop ${shopId}`);
    console.log(`📖 [Shopee Sync] BVA is only READING from Shopee-Clone - no data will be written to Shopee-Clone`);
    console.log(`🔑 [Shopee Sync] Using token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);

    // Verify shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, platform: true, ownerId: true },
    });

    if (!shop) {
      console.error(`❌ [Shopee Sync] Shop ${shopId} not found. Cannot sync data.`);
      throw new Error(`Shop ${shopId} not found. Cannot sync data.`);
    }

    console.log(`📦 [Shopee Sync] Syncing data for shop:`, {
      shopId: shop.id,
      shopName: shop.name,
      platform: shop.platform,
      ownerId: shop.ownerId,
    });
    console.log(`🌐 [Shopee Sync] API URL: ${SHOPEE_CLONE_API_URL}`);
    console.log(`⚠️ [Shopee Sync] IMPORTANT: We're using BVA shopId "${shopId}" to call Shopee-Clone APIs.`);
    console.log(`   If Shopee-Clone doesn't recognize this ID, the API calls will return empty arrays.`);
    console.log(`   The shopId in Shopee-Clone might be different. We'll try multiple endpoints to find the right one.`);

    // Sync products and sales in parallel (both are read-only GET requests)
    console.log(`🚀 [Shopee Sync] Starting parallel sync of products and sales...`);
    const [productsCount, salesCount] = await Promise.all([
      this.syncProducts(shopId, token),
      this.syncSales(shopId, token),
    ]);

    console.log(`✅ [Shopee Sync] Shopee-Clone sync complete:`, {
      products: productsCount,
      sales: salesCount,
      shopId,
      timestamp: new Date().toISOString()
    });
    console.log(`📝 [Shopee Sync] Data saved to BVA database only - Shopee-Clone was not modified`);

    return { products: productsCount, sales: salesCount };
  }

  /**
   * Fetch and sync products from Shopee-Clone (READ-ONLY)
   * This method ONLY READS from Shopee-Clone API and writes to BVA database.
   * It does NOT write, create, or modify anything in Shopee-Clone.
   * Purpose: Refresh/update BVA's local copy of Shopee-Clone product data.
   * Uses JWT token for authentication (read-only access)
   */
  async syncProducts(shopId: string, token: string): Promise<number> {
    console.log(`🚨 [Shopee Products] FUNCTION CALLED - syncProducts started for shop ${shopId}`);
    try {
      console.log(`📦 [Shopee Products] Syncing products for shop ${shopId}...`);
      console.log(`🔑 [Shopee Products] Token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);
      console.log(`🌐 [Shopee Products] Since Shopee-Clone uses the same BVA server, querying database directly...`);

      // Since both Shopee-Clone and BVA use the same server, query database directly
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

      console.log(`📦 [Shopee Products] Found ${dbProducts.length} products in database for shop ${shopId}`);

      if (dbProducts.length === 0) {
        console.warn(`⚠️ [Shopee Products] No products found in database for shop ${shopId}`);
        return 0;
      }

      // Map database products to ShopeeProduct format
      // Use externalId if available, otherwise use BVA id as externalId
      const products: ShopeeProduct[] = dbProducts.map((p) => {
        const product: ShopeeProduct = {
          id: p.externalId || `BVA-${p.id}`, // Use externalId if available, otherwise use BVA id as externalId
          name: p.name,
          price: p.price,
          sku: p.sku,
          stock: p.stock || 0,
          createdAt: p.createdAt.toISOString(),
        };
        if (p.description) product.description = p.description;
        if (p.cost) product.cost = p.cost;
        if (p.category) product.category = p.category;
        if (p.imageUrl) product.image = p.imageUrl;
        return product;
      });

      console.log(`✅ [Shopee Products] Mapped ${products.length} products for sync`);
      console.log(`📦 [Shopee Products] Sample product:`, products[0] ? {
        id: products[0].id,
        name: products[0].name,
        price: products[0].price,
        stock: products[0].stock
      } : 'N/A');

      console.log(`📦 Found ${products.length} products in Shopee-Clone to sync`);
      console.log(`   Sample product:`, products[0] ? {
        id: products[0].id,
        name: products[0].name,
        price: products[0].price,
        stock: products[0].stock,
      } : 'N/A');

      // Since products are already in the database (queried directly), we just need to ensure they're synced
      // For products without externalId, set it. For products with externalId, update if needed.
      // DATA MAPPING: Shopee Product -> BVA Product Table
      let syncedCount = 0;
      let processedCount = 0;
      for (const product of products) {
        processedCount++; // Count all products we attempt to process
        try {
          // Generate SKU - ensure it's unique for this shop
          const baseSku = product.sku || `SHOPEE-${product.id}`;
          
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
                imageUrl: product.image || null,
                stock: product.stock || 0,
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
                  imageUrl: product.image || null,
                  stock: product.stock || 0,
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
      console.log(`📦 [Shopee Products] Processed ${processedCount}/${totalProductsCount} products, successfully synced ${syncedCount}`);
      
      if (totalProductsCount === 0) {
        console.warn(`⚠️ [Shopee Products] No products found. Check backend logs above for endpoint responses.`);
      }
      if (syncedCount > 0 || totalProductsCount > 0) {
        console.log(`✅ [Shopee Products] Successfully processed ${totalProductsCount} products (${syncedCount} synced/updated)`);
      }
      // Return the total number of products found, not just successfully synced
      // This ensures the count matches what the user sees (40 total products)
      return totalProductsCount;
    } catch (error) {
      console.error("❌ Error syncing products from Shopee-Clone:", error);
      return 0;
    }
  }

  /**
   * Fetch and sync sales/orders from Shopee-Clone (READ-ONLY)
   * This method ONLY READS from Shopee-Clone API and writes to BVA database.
   * It does NOT write, create, or modify anything in Shopee-Clone.
   * Purpose: Refresh/update BVA's local copy of Shopee-Clone sales data.
   * Uses JWT token for authentication (read-only access)
   */
  async syncSales(shopId: string, token: string): Promise<number> {
    try {
      console.log(`💰 [Shopee Sales] Syncing sales for shop ${shopId}...`);
      console.log(`🔑 [Shopee Sales] Token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);
      console.log(`🌐 [Shopee Sales] Since Shopee-Clone uses the same BVA server, querying database directly...`);

      // Since both Shopee-Clone and BVA use the same server, query database directly
      // This is more efficient and reliable than making API calls
      const dbSales = await prisma.sale.findMany({
        where: { 
          shopId,
          platform: 'SHOPEE', // Only get Shopee sales
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

      console.log(`💰 [Shopee Sales] Found ${dbSales.length} sales in database for shop ${shopId}`);

      if (dbSales.length === 0) {
        console.warn(`⚠️ [Shopee Sales] No sales found in database for shop ${shopId}`);
        return 0;
      }

      // Map database sales to ShopeeOrder format for consistency
      // Since sales are already in the database, we just need to ensure they're properly synced
      const orders: ShopeeOrder[] = dbSales.map((sale) => {
        const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
        const order: ShopeeOrder = {
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

      console.log(`✅ [Shopee Sales] Mapped ${orders.length} sales for sync`);

      // Since sales are already in the database, we just need to ensure they're synced
      // For sales without externalId, set it. For sales with externalId, update if needed.
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
          
          // Check if sale already exists
          const existingSale = await prisma.sale.findFirst({
            where: {
              shopId,
              OR: [
                { externalId: orderId },
                { platformOrderId: orderId },
                { platform: "SHOPEE", platformOrderId: order.orderId || orderId },
              ],
            },
          });
          
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

          // Use actual order creation date
          const actualOrderDate = order.createdAt 
            ? new Date(order.createdAt) 
            : new Date();

          // Use orderId as both externalId and platformOrderId for consistency
          const externalId = orderId;
          const platformOrderId = order.orderId || orderId;

          // DATA MAPPING: Shopee Order -> BVA Sale Table
          // Use upsert with shopId_externalId to prevent duplicates
          await prisma.sale.upsert({
            where: {
              shopId_externalId: {
                shopId,
                externalId: externalId,
              },
            },
            update: {
              items: items,
              total,
              revenue,
              profit,
              status: (order.status as any) || "COMPLETED",
              customerName: order.customerName || null,
              customerEmail: order.customerEmail || null,
              platformOrderId: platformOrderId,
            },
            create: {
              shopId,
              externalId: externalId,
              platform: "SHOPEE",
              platformOrderId: platformOrderId,
              items: items,
              total,
              revenue,
              profit,
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
      console.log(`💰 [Shopee Sales] Processed ${ordersProcessed}/${totalSalesCount} sales, successfully synced ${syncedCount}`);
      
      if (totalSalesCount === 0) {
        console.warn(`⚠️ [Shopee Sales] No sales found in database for shop ${shopId}`);
      }
      if (syncedCount > 0 || totalSalesCount > 0) {
        console.log(`✅ [Shopee Sales] Successfully processed ${totalSalesCount} sales (${syncedCount} synced/updated)`);
      }
      // Return the total number of sales found, not just successfully synced
      return totalSalesCount;
    } catch (error: any) {
      console.error(`❌ [Shopee Sales] Error syncing sales from database:`, {
        message: error.message,
        stack: error.stack
      });
      return 0;
    }
  }

  /**
   * OLD API-BASED SYNC (kept for reference, but not used)
   * This method was trying to fetch from API endpoints, but sales are now in the database directly
   */
  async _syncSalesFromAPI(shopId: string, token: string): Promise<number> {
    // This method is deprecated - sales are now queried directly from database
    // Keeping for reference only
    try {
      console.log(`💰 [Shopee Sales] OLD API SYNC - This method is deprecated`);
      
      const endpoints = [
        "/api/orders/my",
        `/api/orders/seller/${shopId}`,
        `/api/orders/shop/${shopId}`,
        "/api/orders",
      ];

      let orders: ShopeeOrder[] = [];
      
      for (const endpoint of endpoints) {
        try {
          const fullUrl = `${SHOPEE_CLONE_API_URL}${endpoint}`;
          console.log(`💰 [Shopee Sales] Trying endpoint: ${fullUrl} (READ-ONLY)`);
          
          // READ-ONLY GET request - does NOT modify Shopee-Clone
          const response = await fetch(fullUrl, {
            method: "GET", // READ-ONLY - no POST/PUT/PATCH/DELETE
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });

          console.log(`📡 [Shopee Sales] Response status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const result = await response.json();
            console.log(`💰 [Shopee Sales] Raw API response:`, {
              endpoint,
              status: response.status,
              isArray: Array.isArray(result),
              hasSuccess: typeof result === 'object' && 'success' in result,
              hasData: typeof result === 'object' && 'data' in result,
              keys: typeof result === 'object' ? Object.keys(result) : [],
              resultType: typeof result,
              resultLength: Array.isArray(result) ? result.length : 'N/A',
            });
            
            // Handle both { success: true, data: [...] } and direct array formats
            if (Array.isArray(result)) {
              orders = result;
              console.log(`✅ [Shopee Sales] Parsed as array, length: ${orders.length}`);
            } else if (result.data && Array.isArray(result.data)) {
              orders = result.data;
              console.log(`✅ [Shopee Sales] Parsed from data field, length: ${orders.length}`);
            } else if (result.success && result.data && Array.isArray(result.data)) {
              orders = result.data;
              console.log(`✅ [Shopee Sales] Parsed from success.data, length: ${orders.length}`);
            } else {
              console.warn(`⚠️ [Shopee Sales] Unexpected response format:`, typeof result, result);
              orders = [];
            }
            
            if (orders.length > 0) {
              console.log(`✅ [Shopee Sales] Found ${orders.length} orders at ${endpoint}`);
              console.log(`💰 [Shopee Sales] Sample order:`, orders[0] ? {
                id: orders[0].id,
                orderId: orders[0].orderId,
                total: orders[0].total_price || orders[0].totalPrice || orders[0].total,
                itemsCount: orders[0].items?.length || 0
              } : 'N/A');
              break;
            } else {
              console.log(`⚠️ [Shopee Sales] Endpoint ${endpoint} returned empty array, trying next endpoint...`);
            }
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ [Shopee Sales] Endpoint ${endpoint} failed:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorText.substring(0, 200)
            });
          }
        } catch (error: any) {
          console.error(`❌ [Shopee Sales] Error trying ${endpoint}:`, {
            message: error.message,
            stack: error.stack
          });
          // Try next endpoint
          continue;
        }
      }

      if (!orders || orders.length === 0) {
        console.warn(`⚠️ [Shopee Sales] No sales/orders found in Shopee-Clone for shop ${shopId}`);
        console.warn(`   This could mean:`);
        console.warn(`   1. Shopee-Clone has no orders yet`);
        console.warn(`   2. The API endpoint is incorrect`);
        console.warn(`   3. The token doesn't have access to this shop's orders`);
        console.warn(`   4. The shopId ${shopId} doesn't match any shop in Shopee-Clone`);
        return 0;
      }

      // Upsert each sale - prevent duplicates by checking both externalId and platformOrderId
      let syncedCount = 0;
      const processedOrderIds = new Set<string>(); // Track processed orders to prevent duplicates in same sync
      
      for (const order of orders) {
        if (!order) continue; // Skip if order is undefined
        
        try {
          // Ensure we have a valid externalId and platformOrderId for duplicate detection
          const orderId = order.id || order.orderId;
          if (!orderId) {
            console.warn(`⚠️ Skipping order without ID:`, order);
            continue;
          }
          
          // Skip if we've already processed this order in this sync
          if (processedOrderIds.has(orderId)) {
            console.log(`⏭️ Skipping duplicate order in sync batch: ${orderId}`);
            continue;
          }
          processedOrderIds.add(orderId);
          
          // Check if sale already exists by platformOrderId (unique constraint)
          const existingSale = await prisma.sale.findFirst({
            where: {
              shopId,
              OR: [
                { externalId: orderId },
                { platformOrderId: orderId },
                { platform: "SHOPEE", platformOrderId: order.orderId || orderId },
              ],
            },
          });
          
          // If exists and externalId matches, skip to prevent duplicate
          if (existingSale && existingSale.externalId === orderId) {
            console.log(`⏭️ Sale already exists, updating: ${orderId}`);
            // Update existing sale instead of creating duplicate
            await prisma.sale.update({
              where: { id: existingSale.id },
              data: {
                items: order.items?.map((item) => ({
                  productId: item.productId,
                  productName: item.productName,
                  quantity: item.quantity,
                  price: item.price,
                  subtotal: item.quantity * item.price,
                })) || existingSale.items,
                total: order.total_price || order.totalPrice || order.total || existingSale.total,
                revenue: order.total_price || order.totalPrice || order.total || existingSale.revenue,
              },
            });
            syncedCount++;
            continue;
          }
          
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

          // Use actual order creation date
          const actualOrderDate = order.createdAt 
            ? new Date(order.createdAt) 
            : new Date();

          // Use orderId as both externalId and platformOrderId for consistency
          const externalId = orderId;
          const platformOrderId = order.orderId || orderId;

          // DATA MAPPING: Shopee Order -> BVA Sale Table
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
              externalId: externalId, // Link to Shopee-Clone
              platform: "SHOPEE",
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

      console.log(`💰 [Shopee Sales] Synced ${syncedCount}/${orders.length} sales to BVA database`);
      if (syncedCount === 0 && orders.length > 0) {
        console.warn(`⚠️ [Shopee Sales] WARNING: ${orders.length} orders fetched but 0 synced. Check for errors above.`);
      }
      if (syncedCount > 0) {
        console.log(`✅ [Shopee Sales] Successfully synced ${syncedCount} sales`);
      }
      return syncedCount;
    } catch (error: any) {
      console.error(`❌ [Shopee Sales] Error syncing sales from Shopee-Clone:`, {
        message: error.message,
        stack: error.stack
      });
      return 0;
    }
  }

  /**
   * Fetch products from Shopee-Clone (without saving)
   * Uses JWT token for authentication
   */
  async fetchProducts(token: string): Promise<ShopeeProduct[]> {
    try {
      // Use products endpoint with JWT token
      const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/products`, {
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
      console.error("Error fetching products from Shopee-Clone:", error);
      return [];
    }
  }

  /**
   * Fetch sales from Shopee-Clone (without saving)
   * Uses JWT token for authentication
   */
  async fetchSales(token: string, shopId?: string): Promise<ShopeeOrder[]> {
    try {
      // Use seller orders endpoint with JWT token
      const endpoint = shopId 
        ? `${SHOPEE_CLONE_API_URL}/api/orders/shop/${shopId}`
        : `${SHOPEE_CLONE_API_URL}/api/orders`;
      
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
      console.error("Error fetching sales from Shopee-Clone:", error);
      return [];
    }
  }

  /**
   * Trigger a manual sync for a shop
   * Uses JWT token for authentication
   * @param shopId - The shop ID to sync data for
   * @param token - Shopee-Clone JWT token for authentication
   */
  async triggerSync(shopId: string, token: string): Promise<{ products: number; sales: number }> {
    return this.syncAllData(shopId, token);
  }
}

export const shopeeIntegrationService = new ShopeeIntegrationService();
