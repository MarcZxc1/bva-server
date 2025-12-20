// src/controllers/integration.controller.ts
import { Request, Response } from "express";
import { integrationService } from "../service/integration.service";
import { getShopIdFromRequest } from "../utils/requestHelpers";

export class IntegrationController {
  /**
   * Create a new integration
   * POST /api/integrations
   */
  async createIntegration(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const { platform, settings, shopeeToken, lazadaToken } = req.body;

      if (!platform) {
        return res.status(400).json({
          success: false,
          error: "Platform is required",
        });
      }

      // Get the correct shop based on platform
      // This ensures we use the right shop for each platform integration
      console.log(`🔍 [createIntegration] User: ${user.userId}, Platform: ${platform}`);
      const shopId = await integrationService.getShopIdByPlatform(user.userId, platform);
      console.log(`📍 [createIntegration] Found shop ID: ${shopId}`);
      
      if (!shopId) {
        console.error(`❌ [createIntegration] No ${platform} shop found for user ${user.userId}`);
        return res.status(400).json({
          success: false,
          error: `No ${platform} shop found for this user. Please link a shop first.`,
        });
      }

      // Check if integration already exists before creating
      const existing = await integrationService.getShopIntegrations(shopId);
      const existingIntegration = existing.find(i => i.platform === platform);

      if (existingIntegration) {
        // Update existing integration instead of creating new one
        const updatedSettings = existingIntegration.settings as any;
        const newSettings: Record<string, any> = {
          ...updatedSettings,
          lastConnectedAt: new Date().toISOString(),
          isActive: true,
          termsAccepted: true,
          ...settings,
        };

        // Update platform-specific token if provided
        if (shopeeToken && platform === "SHOPEE") {
          newSettings.shopeeToken = shopeeToken;
        }
        if (lazadaToken && platform === "LAZADA") {
          newSettings.lazadaToken = lazadaToken;
        }

        const updated = await integrationService.updateIntegration(existingIntegration.id, {
          settings: newSettings,
        });

        // Return 200 OK with existing integration (treat as success)
        return res.status(200).json({
          success: true,
          data: updated,
          message: "Integration already exists. Updated successfully.",
        });
      }

      // Create new integration
      const integration = await integrationService.createIntegration({
        shopId,
        platform,
        settings,
        shopeeToken, // Include Shopee-Clone token if provided
        lazadaToken, // Include Lazada-Clone token if provided
      });

      return res.status(201).json({
        success: true,
        data: integration,
      });
    } catch (error: any) {
      console.error("Error creating integration:", error);
      // Integration service now handles duplicates gracefully, so this shouldn't happen
      // But keep as fallback
      if (error.message?.includes("already exists")) {
        // Try to get existing integration and return it
        try {
          const shopId = await getShopIdFromRequest(req);
          const { platform } = req.body;
          if (shopId && platform) {
            const integrations = await integrationService.getShopIntegrations(shopId);
            const existing = integrations.find(i => i.platform === platform);
            if (existing) {
              return res.status(200).json({
                success: true,
                data: existing,
                message: "Integration already exists. Using existing integration.",
              });
            }
          }
        } catch (fallbackError) {
          // Fall through to 409 error
        }
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get all integrations for all shops the user has access to (owned + linked)
   * GET /api/integrations
   */
  async getIntegrations(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      // Get all integrations from all accessible shops
      const integrations = await integrationService.getUserIntegrations(user.userId);

      return res.json({
        success: true,
        data: integrations,
      });
    } catch (error: any) {
      console.error("Error fetching integrations:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get integration by ID
   * GET /api/integrations/:id
   */
  async getIntegrationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Integration ID is required",
        });
      }
      const integration = await integrationService.getIntegrationById(id);

      if (!integration) {
        return res.status(404).json({
          success: false,
          error: "Integration not found",
        });
      }

      return res.json({
        success: true,
        data: integration,
      });
    } catch (error: any) {
      console.error("Error fetching integration:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Update integration
   * PUT /api/integrations/:id
   */
  async updateIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Integration ID is required",
        });
      }
      const { apiKey, settings } = req.body;

      const integration = await integrationService.updateIntegration(id, {
        apiKey,
        settings,
      });

      return res.json({
        success: true,
        data: integration,
      });
    } catch (error: any) {
      console.error("Error updating integration:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Delete integration
   * DELETE /api/integrations/:id
   */
  async deleteIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Integration ID is required",
        });
      }
      
      const result = await integrationService.deleteIntegration(id);

      // Return success even if integration was already deleted (idempotent)
      return res.json({
        success: true,
        message: result ? "Integration deleted successfully" : "Integration already deleted",
      });
    } catch (error: any) {
      console.error("Error deleting integration:", error);
      
      // Handle Prisma P2025 error (record not found)
      if (error.code === 'P2025') {
        return res.json({
          success: true,
          message: "Integration already deleted",
        });
      }
      
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Test integration connection
   * POST /api/integrations/:id/test
   */
  async testConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Integration ID is required",
        });
      }
      
      // Get JWT token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: "Authentication token required",
        });
      }
      
      const result = await integrationService.testConnection(id, token);

      return res.json(result);
    } catch (error: any) {
      console.error("Error testing connection:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Sync integration data
   * POST /api/integrations/:id/sync
   */
  async syncIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`🔄 [Integration Controller] Sync request received for integration: ${id}`);
      
      if (!id) {
        console.error(`❌ [Integration Controller] Integration ID missing`);
        return res.status(400).json({
          success: false,
          error: "Integration ID is required",
        });
      }
      
      // Token is optional now - integration may have stored token in settings
      // Get JWT token from Authorization header (fallback)
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "") || undefined;
      
      console.log(`🔑 [Integration Controller] Token from header: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);
      
      const result = await integrationService.syncIntegration(id, token);
      
      console.log(`✅ [Integration Controller] Sync completed successfully:`, {
        integrationId: id,
        products: result?.data?.products ?? 0,
        sales: result?.data?.sales ?? 0
      });

      return res.json(result);
    } catch (error: any) {
      console.error(`❌ [Integration Controller] Error syncing integration:`, {
        integrationId: req.params.id,
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
}

export const integrationController = new IntegrationController();
