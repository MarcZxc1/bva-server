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
      const shopId = await getShopIdFromRequest(req);
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      const { platform, settings, shopeeToken, lazadaToken } = req.body;

      if (!platform) {
        return res.status(400).json({
          success: false,
          error: "Platform is required",
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
   * Get all integrations for a shop
   * GET /api/integrations
   */
  async getIntegrations(req: Request, res: Response) {
    try {
      const shopId = await getShopIdFromRequest(req);
      if (!shopId) {
        // Return empty array instead of error - user may not have a shop yet
        return res.json({
          success: true,
          data: [],
        });
      }

      const integrations = await integrationService.getShopIntegrations(shopId);

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
      await integrationService.deleteIntegration(id);

      return res.json({
        success: true,
        message: "Integration deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting integration:", error);
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
      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Integration ID is required",
        });
      }
      
      // Token is optional now - integration may have stored token in settings
      // Get JWT token from Authorization header (fallback)
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "") || undefined;
      
      const result = await integrationService.syncIntegration(id, token);

      return res.json(result);
    } catch (error: any) {
      console.error("Error syncing integration:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
}

export const integrationController = new IntegrationController();
