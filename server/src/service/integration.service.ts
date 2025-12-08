// src/service/integration.service.ts
import prisma from "../lib/prisma";
import { Platform } from "../generated/prisma";
import { shopeeIntegrationService } from "./shopeeIntegration.service";

interface CreateIntegrationInput {
  shopId: string;
  platform: Platform;
  settings?: Record<string, any>;
}

interface UpdateIntegrationInput {
  apiKey?: string;
  settings?: Record<string, any>;
  isActive?: boolean;
}

class IntegrationService {
  /**
   * Create a new platform integration
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
      throw new Error("Integration already exists for this platform");
    }

    // Create integration (no API key needed - uses JWT token)
    // Set isActive to true in settings when integration is created (user has accepted terms)
    const integration = await prisma.integration.create({
      data: {
        shopId: data.shopId,
        platform: data.platform,
        settings: {
          connectedAt: new Date().toISOString(),
          termsAccepted: true,
          termsAcceptedAt: new Date().toISOString(),
          isActive: true, // Active by default when created (user accepted terms)
          ...data.settings,
        },
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
        shop: {
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
        shop: {
          select: {
            id: true,
            name: true,
            owner: {
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
  async syncIntegration(integrationId: string, token: string) {
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

    const userId = integration.shop.owner.id;

    // Sync based on platform
    switch (integration.platform) {
      case Platform.SHOPEE:
        const result = await shopeeIntegrationService.syncAllData(userId, token);
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

