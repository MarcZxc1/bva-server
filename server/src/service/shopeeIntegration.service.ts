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
    console.log(`🔄 Starting Shopee-Clone sync (READ-ONLY) for shop ${shopId}`);
    console.log(`📖 BVA is only READING from Shopee-Clone - no data will be written to Shopee-Clone`);
    console.log(`🔑 Using token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);

    // Verify shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new Error(`Shop ${shopId} not found. Cannot sync data.`);
    }

    console.log(`📦 Syncing data for shop: ${shop.name} (${shop.id})`);
    console.log(`🌐 API URL: ${SHOPEE_CLONE_API_URL}`);

    // Sync products and sales in parallel (both are read-only GET requests)
    const [productsCount, salesCount] = await Promise.all([
      this.syncProducts(shopId, token),
      this.syncSales(shopId, token),
    ]);

    console.log(`✅ Shopee-Clone sync complete: ${productsCount} products, ${salesCount} sales`);
    console.log(`📝 Data saved to BVA database only - Shopee-Clone was not modified`);

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
    try {
      console.log(`📦 Syncing products for shop ${shopId}...`);

      let products: ShopeeProduct[] = [];

      // Use shop-specific endpoint for products (READ-ONLY GET request)
      // This ONLY reads from Shopee-Clone - does NOT modify Shopee-Clone
      const response = await fetch(`${SHOPEE_CLONE_API_URL}/api/products/shop/${shopId}`, {
        method: "GET", // READ-ONLY - no POST/PUT/PATCH/DELETE
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const rawResult = await response.json();
        console.log(`📦 Raw API response from Shopee-Clone:`, {
          isArray: Array.isArray(rawResult),
          hasSuccess: typeof rawResult === 'object' && 'success' in rawResult,
          hasData: typeof rawResult === 'object' && 'data' in rawResult,
          keys: typeof rawResult === 'object' ? Object.keys(rawResult) : [],
        });
        
        const result: ShopeeApiResponse<ShopeeProduct[]> | ShopeeProduct[] = rawResult;
        // Handle both response formats: { success, data } or direct array
        if (Array.isArray(result)) {
          products = result;
        } else if (result && typeof result === 'object' && 'data' in result) {
          products = (result as ShopeeApiResponse<ShopeeProduct[]>).data || [];
        } else if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
          products = (result as ShopeeApiResponse<ShopeeProduct[]>).data || [];
        } else {
          console.warn(`⚠️ Unexpected response format from Shopee-Clone:`, typeof result);
          products = [];
        }
        console.log(`✅ Fetched ${products.length} products from shop-specific endpoint`);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Failed to fetch products from shop endpoint: ${response.status} - ${errorText}`);
        // Try fallback to general products endpoint
        const fallbackResponse = await fetch(`${SHOPEE_CLONE_API_URL}/api/products`, {
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
            : (fallbackResult as ShopeeApiResponse<ShopeeProduct[]>).data || [];
          console.log(`✅ Fetched ${products.length} products from fallback endpoint`);
        } else {
          console.warn(`⚠️ Fallback also failed: ${fallbackResponse.status}`);
          return 0;
        }
      }

      if (!products || products.length === 0) {
        console.log("📦 No products found in Shopee-Clone");
        console.log(`⚠️  Shopee-Clone API returned empty products array for shop ${shopId}`);
        console.log(`   This could mean:`);
        console.log(`   1. Shopee-Clone has no products yet`);
        console.log(`   2. The API endpoint is incorrect`);
        console.log(`   3. The token doesn't have access to this shop's products`);
        return 0;
      }

      console.log(`📦 Found ${products.length} products in Shopee-Clone to sync`);
      console.log(`   Sample product:`, products[0] ? {
        id: products[0].id,
        name: products[0].name,
        price: products[0].price,
        stock: products[0].stock,
      } : 'N/A');

      // Upsert each product
      // DATA MAPPING: Shopee Product -> BVA Product Table
      // - product.name -> Product.name (required for MarketMate, SmartShelf)
      // - product.price -> Product.price (required for Restock Planner, MarketMate)
      // - product.stock -> Product.stock (required for SmartShelf, Restock Planner)
      // - product.image -> Product.imageUrl (required for MarketMate campaigns)
      // - product.description -> Product.description (optional, for product details)
      // - product.category -> Product.category (optional, for filtering)
      // - product.cost -> Product.cost (required for profit calculation in Restock Planner)
      // - product.id -> Product.externalId (links to Shopee-Clone)
      let syncedCount = 0;
      for (const product of products) {
        try {
          // Generate SKU - ensure it's unique for this shop
          const baseSku = product.sku || `SHOPEE-${product.id}`;
          
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
                imageUrl: product.image || null, // MarketMate campaigns
                stock: product.stock || 0, // SmartShelf, Restock Planner
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
                imageUrl: product.image || null,
                stock: product.stock || 0,
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
              externalId: product.id, // Link to Shopee-Clone
              sku: baseSku,
              name: product.name, // Required: MarketMate, SmartShelf
              description: product.description || null,
              price: product.price, // Required: Restock Planner, MarketMate
              cost: product.cost || null, // Required: Restock Planner profit calculation
              category: product.category || null,
              imageUrl: product.image || null, // Required: MarketMate campaigns
              stock: product.stock || 0, // Required: SmartShelf, Restock Planner
            },
          });
          syncedCount++;
          console.log(`✅ Created product: ${product.name} (Price: ${product.price}, Stock: ${product.stock})`);
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
                    { sku: product.sku || `SHOPEE-${product.id}` },
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
                    imageUrl: product.image || null,
                    stock: product.stock || 0,
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
      console.error("❌ Error syncing products from Shopee-Clone:", error);
      return 0;
    }
  }

  /**
   * Fetch and sync sales/orders for a shop
   * Since orders are already stored in the BVA database when created,
   * this method verifies and counts existing sales records.
   * Uses JWT token for authentication
   */
  async syncSales(shopId: string, token: string): Promise<number> {
    try {
      console.log(`💰 Syncing sales for shop ${shopId}...`);

      // Fetch existing sales from database for this shop
      const existingSales = await prisma.sale.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
      });

      if (existingSales.length > 0) {
        console.log(`✅ Found ${existingSales.length} existing sales in database`);
        console.log(`   Total revenue: $${existingSales.reduce((sum, s) => sum + (s.revenue || s.total), 0).toFixed(2)}`);
        console.log(`   Total profit: $${existingSales.reduce((sum, s) => sum + (s.profit || 0), 0).toFixed(2)}`);
        return existingSales.length;
      }

      console.log("💰 No sales/orders found for this shop yet");
      console.log("   Sales will appear automatically when:");
      console.log("   1. Buyers place orders through Shopee-Clone");
      console.log("   2. Orders are created via the order API");
      return 0;

    } catch (error) {
      console.error("❌ Error syncing sales:", error);
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
