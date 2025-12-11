// src/service/integration.service.ts
import prisma from "../lib/prisma";
import { Platform } from "../generated/prisma";
import { shopeeIntegrationService } from "./shopeeIntegration.service";

interface CreateIntegrationInput {
  shopId: string;
  platform: Platform;
  settings?: Record<string, any>;
  shopeeToken?: string; // Shopee-Clone JWT token for authentication
}

interface UpdateIntegrationInput {
  apiKey?: string;
  settings?: Record<string, any>;
  isActive?: boolean;
}

class IntegrationService {
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

      // Update Shopee-Clone token if provided
      if (data.shopeeToken && data.platform === Platform.SHOPEE) {
        updatedSettings.shopeeToken = data.shopeeToken;
      }

      // Update the existing integration
      const updated = await prisma.integration.update({
        where: { id: existing.id },
        data: { settings: updatedSettings },
      });

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

    // Store Shopee-Clone token in settings if provided
    if (data.shopeeToken && data.platform === Platform.SHOPEE) {
      settings.shopeeToken = data.shopeeToken;
    }

    const integration = await prisma.integration.create({
      data: {
        shopId: data.shopId,
        platform: data.platform,
        settings,
      },
    });

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
        const result = await shopeeIntegrationService.syncAllData(shopId, shopeeToken);
        return {
          success: true,
          message: "Sync completed",
          data: result,
        };
      default:
        throw new Error(`Platform ${integration.platform} not supported`);
    }
  }
}

export const integrationService = new IntegrationService();

