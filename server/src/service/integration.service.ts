// src/service/integration.service.ts
import prisma from "../lib/prisma";
import { Platform } from "../generated/prisma";
import { shopeeIntegrationService } from "./shopeeIntegration.service";
import { lazadaIntegrationService } from "./lazadaIntegration.service";
import { CacheService } from "../lib/redis";

interface CreateIntegrationInput {
  shopId: string;
  platform: Platform;
  settings?: Record<string, any>;
  shopeeToken?: string; // Shopee-Clone JWT token for authentication
  lazadaToken?: string; // Lazada-Clone JWT token for authentication
}

interface UpdateIntegrationInput {
  apiKey?: string;
  settings?: Record<string, any>;
  isActive?: boolean;
}

class IntegrationService {
  /**
   * Get the correct shop ID for a user based on the platform
   * This ensures each platform integration uses the right shop
   */
  async getShopIdByPlatform(userId: string, platform: Platform): Promise<string | null> {
    // First, try to find a shop owned by the user with matching platform
    const ownedShop = await prisma.shop.findFirst({
      where: {
        ownerId: userId,
        platform: platform,
      },
      select: { id: true },
    });

    if (ownedShop) {
      return ownedShop.id;
    }

    // If not owned, try to find a linked shop with matching platform
    const linkedShop = await prisma.shopAccess.findFirst({
      where: {
        userId: userId,
        Shop: {
          platform: platform,
        },
      },
      include: {
        Shop: {
          select: { id: true },
        },
      },
    });

    if (linkedShop) {
      return linkedShop.Shop.id;
    }

    return null;
  }

  /**
   * Create a new platform integration or update existing one
   * Returns existing integration if it already exists (idempotent)
   */
  async createIntegration(data: CreateIntegrationInput) {
    // Check if integration already exists
    const existing = await prisma.integration.findUnique({
      where: {
        shopId_platform: {
          shopId: data.shopId,
          platform: data.platform,
        },
      },
    });

    if (existing) {
      // Update existing integration with new token if provided
      const settings = existing.settings as any;
      const updatedSettings: Record<string, any> = {
        ...settings,
        // Update connection timestamp
        lastConnectedAt: new Date().toISOString(),
        // Ensure it's active
        isActive: true,
        termsAccepted: true,
        ...data.settings,
      };

      // Update platform-specific token if provided
      if (data.shopeeToken && data.platform === Platform.SHOPEE) {
        updatedSettings.shopeeToken = data.shopeeToken;
      }
      if (data.lazadaToken && data.platform === Platform.LAZADA) {
        updatedSettings.lazadaToken = data.lazadaToken;
      }

      // Update the existing integration
      const updated = await prisma.integration.update({
        where: { id: existing.id },
        data: { settings: updatedSettings },
      });

      // Automatically sync data after updating integration
      console.log(`🔄 Auto-syncing data for updated ${data.platform} integration...`);
      try {
        if (data.platform === Platform.SHOPEE && data.shopeeToken) {
          await shopeeIntegrationService.syncAllData(data.shopId, data.shopeeToken);
          console.log(`✅ Auto-sync completed for Shopee integration`);
        } else if (data.platform === Platform.LAZADA && data.lazadaToken) {
          await lazadaIntegrationService.syncAllData(data.shopId, data.lazadaToken);
          console.log(`✅ Auto-sync completed for Lazada integration`);
        }
      } catch (syncError) {
        console.error(`⚠️ Auto-sync failed (integration still updated):`, syncError);
        // Don't fail the integration update if sync fails
      }

      return updated;
    }

    // Create new integration (no API key needed - uses JWT token)
    // Set isActive to true in settings when integration is created (user has accepted terms)
    const settings: Record<string, any> = {
      connectedAt: new Date().toISOString(),
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
      isActive: true, // Active by default when created (user accepted terms)
      ...data.settings,
    };

    // Store platform-specific token in settings if provided
    if (data.shopeeToken && data.platform === Platform.SHOPEE) {
      settings.shopeeToken = data.shopeeToken;
    }
    if (data.lazadaToken && data.platform === Platform.LAZADA) {
      settings.lazadaToken = data.lazadaToken;
    }

    const integration = await prisma.integration.create({
      data: {
        shopId: data.shopId,
        platform: data.platform,
        settings,
      },
    });

    // Automatically sync data after creating integration
    console.log(`🔄 Auto-syncing data for new ${data.platform} integration...`);
    try {
      if (data.platform === Platform.SHOPEE && data.shopeeToken) {
        await shopeeIntegrationService.syncAllData(data.shopId, data.shopeeToken);
        console.log(`✅ Auto-sync completed for Shopee integration`);
      } else if (data.platform === Platform.LAZADA && data.lazadaToken) {
        await lazadaIntegrationService.syncAllData(data.shopId, data.lazadaToken);
        console.log(`✅ Auto-sync completed for Lazada integration`);
      }
    } catch (syncError) {
      console.error(`⚠️ Auto-sync failed (integration still created):`, syncError);
      // Don't fail the integration creation if sync fails
      // User can manually sync later
    }

    return integration;
  }

  /**
   * Get all integrations for a shop
   */
  async getShopIntegrations(shopId: string) {
    return prisma.integration.findMany({
      where: { shopId },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get all integrations from all shops the user has access to (owned + linked)
   */
  async getUserIntegrations(userId: string) {
    // Get all shops the user owns
    const ownedShops = await prisma.shop.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    // Get all shops the user has access to via ShopAccess
    const linkedShops = await prisma.shopAccess.findMany({
      where: { userId: userId },
      include: {
        Shop: {
          select: { id: true },
        },
      },
    });

    // Combine all shop IDs
    const allShopIds = [
      ...ownedShops.map((s: any) => s.id),
      ...linkedShops.map((sa: any) => sa.Shop.id),
    ];

    if (allShopIds.length === 0) {
      return [];
    }

    // Get all integrations from these shops
    return prisma.integration.findMany({
      where: {
        shopId: { in: allShopIds },
      },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get integration by ID
   */
  async getIntegrationById(id: string) {
    return prisma.integration.findUnique({
      where: { id },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            User: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update integration
   */
  async updateIntegration(id: string, data: UpdateIntegrationInput) {
    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const currentSettings = (integration.settings as Record<string, any>) || {};
    const updatedSettings = {
      ...currentSettings,
      ...(data.apiKey && { apiKey: data.apiKey }),
      ...(data.settings && data.settings),
    };

    return prisma.integration.update({
      where: { id },
      data: {
        settings: updatedSettings,
      },
    });
  }

  /**
   * Delete integration
   */
  async deleteIntegration(id: string) {
    // Check if integration exists first
    const existing = await prisma.integration.findUnique({
      where: { id },
    });

    if (!existing) {
      // Integration doesn't exist - treat as success (idempotent delete)
      console.log(`⚠️ Integration ${id} not found, treating delete as success`);
      return null;
    }

    return prisma.integration.delete({
      where: { id },
    });
  }

  /**
   * Test integration connection
   * Uses JWT token for authentication
   */
  async testConnection(integrationId: string, token: string) {
    const integration = await this.getIntegrationById(integrationId);
    
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Test connection based on platform
    switch (integration.platform) {
      case Platform.SHOPEE:
        try {
          // Try to fetch products to test connection
          const products = await shopeeIntegrationService.fetchProducts(token);
          return {
            success: true,
            message: "Connection successful",
            data: { productCount: products.length },
          };
        } catch (error: any) {
          return {
            success: false,
            message: error.message || "Connection failed",
          };
        }
      case Platform.LAZADA:
        try {
          // Try to fetch products to test connection
          const products = await lazadaIntegrationService.fetchProducts(token);
          return {
            success: true,
            message: "Connection successful",
            data: { productCount: products.length },
          };
        } catch (error: any) {
          return {
            success: false,
            message: error.message || "Connection failed",
          };
        }
      default:
        throw new Error(`Platform ${integration.platform} not supported`);
    }
  }

  /**
   * Sync data from integration
   * Uses JWT token for authentication
   * Only syncs if integration is active and terms are accepted
   */
  async syncIntegration(integrationId: string, token?: string) {
    console.log(`🔄 [Integration Service] Starting sync for integration: ${integrationId}`);
    
    const integration = await this.getIntegrationById(integrationId);
    
    if (!integration) {
      console.error(`❌ [Integration Service] Integration not found: ${integrationId}`);
      throw new Error("Integration not found");
    }

    console.log(`📊 [Integration Service] Integration details:`, {
      id: integration.id,
      platform: integration.platform,
      shopId: integration.shopId,
      hasSettings: !!integration.settings
    });

    // Check if integration is active and terms are accepted
    const settings = integration.settings as any;
    const termsAccepted = settings?.termsAccepted === true;
    const isActive = settings?.isActive !== false;

    console.log(`🔍 [Integration Service] Integration status:`, {
      termsAccepted,
      isActive,
      hasShopeeToken: !!settings?.shopeeToken,
      hasLazadaToken: !!settings?.lazadaToken,
      hasProvidedToken: !!token
    });

    if (!termsAccepted || !isActive) {
      console.warn(`⚠️ [Integration Service] Integration not active or terms not accepted`);
      throw new Error("Integration is not active or terms have not been accepted. Please accept the terms and conditions first.");
    }

    // Use the integration's shopId (this can be a linked shop)
    const shopId = integration.shopId;
    console.log(`🏪 [Integration Service] Using shopId: ${shopId}`);
    console.log(`🔍 [Integration Service] NOTE: This is BVA's internal shopId. The clone platform may use a different shopId.`);

    // Get shop owner for notification
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, ownerId: true, name: true, platform: true },
    });

    console.log(`👤 [Integration Service] Shop details:`, {
      shopId: shop?.id,
      shopName: shop?.name,
      shopPlatform: shop?.platform,
      ownerId: shop?.ownerId
    });
    
    // Warn about potential shopId mismatch
    console.warn(`⚠️ [Integration Service] Shop ${shopId} is BVA's internal shopId. The clone platform may use a different shopId.`);
    console.warn(`   We'll try using BVA's shopId, but if the clone platform uses different IDs, this might fail.`);

    const userId = shop?.ownerId;
    if (!userId) {
      console.error(`❌ [Integration Service] Shop owner not found for shop: ${shopId}`);
      throw new Error("Shop owner not found");
    }

    // Sync based on platform
    switch (integration.platform) {
      case Platform.SHOPEE:
        console.log(`🛒 [Integration Service] Syncing Shopee integration`);
        // Use Shopee-Clone token from settings if available, otherwise fallback to provided token
        const shopeeToken = settings?.shopeeToken || token;
        if (!shopeeToken) {
          console.error(`❌ [Integration Service] Shopee token not found`);
          throw new Error("Shopee-Clone authentication token is required. Please reconnect the integration.");
        }
        console.log(`🔑 [Integration Service] Shopee token available: ${shopeeToken ? shopeeToken.substring(0, 20) + '...' : 'NO TOKEN'}`);
        
        // Pass shopId instead of userId - syncAllData now accepts shopId directly
        console.log(`🚀 [Integration Service] Calling shopeeIntegrationService.syncAllData(${shopId}, token)`);
        const shopeeResult = await shopeeIntegrationService.syncAllData(shopId, shopeeToken);
        
        console.log(`✅ [Integration Service] Shopee sync completed:`, {
          products: shopeeResult.products,
          sales: shopeeResult.sales
        });
        
        // Invalidate product cache after sync
        await CacheService.invalidateShop(shopId);
        await CacheService.invalidateUserProducts(userId);
        console.log(`🔄 [Integration Service] Invalidated product cache after Shopee sync`);
        
        // Create notification for successful sync (with deduplication)
        const { createNotificationWithDeduplication } = require("../utils/notificationHelper");
        await createNotificationWithDeduplication({
          userId,
          title: "Shopee Sync Completed",
          message: `Successfully synced ${shopeeResult.products} products and ${shopeeResult.sales} sales from Shopee.`,
          type: "success",
          deduplicationKey: `sync_shopee_${shopId}`,
          deduplicationWindowHours: 1, // Prevent duplicates within 1 hour
        });
        
        return {
          success: true,
          message: "Sync completed",
          data: shopeeResult,
        };
      case Platform.LAZADA:
        console.log(`🛒 [Integration Service] Syncing Lazada integration`);
        // Use Lazada-Clone token from settings if available, otherwise fallback to provided token
        const lazadaToken = settings?.lazadaToken || token;
        if (!lazadaToken) {
          console.error(`❌ [Integration Service] Lazada token not found`);
          throw new Error("Lazada-Clone authentication token is required. Please reconnect the integration.");
        }
        console.log(`🔑 [Integration Service] Lazada token available: ${lazadaToken ? lazadaToken.substring(0, 20) + '...' : 'NO TOKEN'}`);
        
        // Pass shopId instead of userId - syncAllData now accepts shopId directly
        console.log(`🚀 [Integration Service] Calling lazadaIntegrationService.syncAllData(${shopId}, token)`);
        const lazadaResult = await lazadaIntegrationService.syncAllData(shopId, lazadaToken);
        
        console.log(`✅ [Integration Service] Lazada sync completed:`, {
          products: lazadaResult.products,
          sales: lazadaResult.sales
        });
        
        // Invalidate product cache after sync
        await CacheService.invalidateShop(shopId);
        await CacheService.invalidateUserProducts(userId);
        console.log(`🔄 [Integration Service] Invalidated product cache after Lazada sync`);
        
        // Create notification for successful sync (with deduplication)
        const { createNotificationWithDeduplication: createLazadaNotification } = require("../utils/notificationHelper");
        await createLazadaNotification({
          userId,
          title: "Lazada Sync Completed",
          message: `Successfully synced ${lazadaResult.products} products and ${lazadaResult.sales} sales from Lazada.`,
          type: "success",
          deduplicationKey: `sync_lazada_${shopId}`,
          deduplicationWindowHours: 1, // Prevent duplicates within 1 hour
        });
        
        return {
          success: true,
          message: "Sync completed",
          data: lazadaResult,
        };
      default:
        console.error(`❌ [Integration Service] Unsupported platform: ${integration.platform}`);
        throw new Error(`Platform ${integration.platform} not supported`);
    }
  }
}

export const integrationService = new IntegrationService();

