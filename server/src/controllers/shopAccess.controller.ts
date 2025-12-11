// src/controllers/shopAccess.controller.ts
import { Request, Response } from "express";
import { shopAccessService } from "../service/shopAccess.service";

export class ShopAccessController {
  /**
   * Link a shop to the current user
   * POST /api/shops/link
   */
  async linkShop(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      const { shopId } = req.body;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      const result = await shopAccessService.linkShop(user.userId, shopId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error linking shop:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get all linked shops for the current user
   * GET /api/shops/linked
   */
  async getLinkedShops(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      const shops = await shopAccessService.getLinkedShops(user.userId);

      return res.json(shops);
    } catch (error: any) {
      console.error("Error fetching linked shops:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Unlink a shop from the current user
   * DELETE /api/shops/link/:shopId
   */
  async unlinkShop(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      const { shopId } = req.params;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      await shopAccessService.unlinkShop(user.userId, shopId);

      return res.json({
        success: true,
        message: "Shop unlinked successfully",
      });
    } catch (error: any) {
      console.error("Error unlinking shop:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
}

export const shopAccessController = new ShopAccessController();

