// src/controllers/apiKey.controller.ts
import { Request, Response } from "express";
import crypto from "crypto";

export class ApiKeyController {
  /**
   * Generate API key for Shopee-Clone integration
   * POST /api/auth/generate-api-key
   */
  async generateApiKey(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // Generate a secure API key
      const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;

      return res.json({
        success: true,
        data: {
          apiKey,
          message: "API key generated successfully. Store it securely - it won't be shown again.",
        },
      });
    } catch (error: any) {
      console.error("Error generating API key:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
}

export const apiKeyController = new ApiKeyController();

