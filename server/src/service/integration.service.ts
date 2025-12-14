// src/service/integration.service.ts
import prisma from "../lib/prisma";
import { Platform } from "../generated/prisma";
import { shopeeIntegrationService } from "./shopeeIntegration.service";
import { lazadaIntegrationService } from "./lazadaIntegration.service";

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
      ...ownedShops.map(s => s.id),
      ...linkedShops.map(sa => sa.Shop.id),
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
    const integration = await this.getIntegrationById(integrationId);
    
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Check if integration is active and terms are accepted
    const settings = integration.settings as any;
    const termsAccepted = settings?.termsAccepted === true;
    const isActive = settings?.isActive !== false;

    if (!termsAccepted || !isActive) {
      throw new Error("Integration is not active or terms have not been accepted. Please accept the terms and conditions first.");
    }

    // Use the integration's shopId (this can be a linked shop)
    const shopId = integration.shopId;

    // Sync based on platform
    switch (integration.platform) {
      case Platform.SHOPEE:
        // Use Shopee-Clone token from settings if available, otherwise fallback to provided token
        const shopeeToken = settings?.shopeeToken || token;
        if (!shopeeToken) {
          throw new Error("Shopee-Clone authentication token is required. Please reconnect the integration.");
        }
        // Pass shopId instead of userId - syncAllData now accepts shopId directly
        const shopeeResult = await shopeeIntegrationService.syncAllData(shopId, shopeeToken);
        return {
          success: true,
          message: "Sync completed",
          data: shopeeResult,
        };
      case Platform.LAZADA:
        // Use Lazada-Clone token from settings if available, otherwise fallback to provided token
        const lazadaToken = settings?.lazadaToken || token;
        if (!lazadaToken) {
          throw new Error("Lazada-Clone authentication token is required. Please reconnect the integration.");
        }
        // Pass shopId instead of userId - syncAllData now accepts shopId directly
        const lazadaResult = await lazadaIntegrationService.syncAllData(shopId, lazadaToken);
        return {
          success: true,
          message: "Sync completed",
          data: lazadaResult,
        };
      default:
        throw new Error(`Platform ${integration.platform} not supported`);
    }
  }
}

export const integrationService = new IntegrationService();

