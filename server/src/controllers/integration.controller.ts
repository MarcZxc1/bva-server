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

      const { platform, settings } = req.body;

      if (!platform) {
        return res.status(400).json({
          success: false,
          error: "Platform is required",
        });
      }

      const integration = await integrationService.createIntegration({
        shopId,
        platform,
        settings,
      });

      return res.status(201).json({
        success: true,
        data: integration,
      });
    } catch (error: any) {
      console.error("Error creating integration:", error);
      if (error.message?.includes("already exists")) {
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
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
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
      const result = await integrationService.testConnection(id);

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
      const result = await integrationService.syncIntegration(id);

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
