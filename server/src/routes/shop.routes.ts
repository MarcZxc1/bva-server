// src/routes/shop.routes.ts
import { Router, Request, Response } from "express";
import { shopAccessController } from "../controllers/shopAccess.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import prisma from "../lib/prisma";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/shops/my - Get current user's shop (for Lazada-Clone compatibility)
router.get("/my", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Get user's shops (owned shops)
    const shops = await prisma.shop.findMany({
      where: { ownerId: user.userId },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (shops.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User does not have a shop",
      });
    }

    // Return the first shop (Lazada-Clone expects a single shop)
    const shop = shops[0];
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: "User does not have a shop",
      });
    }

    return res.json({
      id: shop.id,
      name: shop.name,
      description: null, // Shop model doesn't have description field
      logo: null, // Shop model doesn't have logo field
      ownerId: shop.ownerId,
    });
  } catch (error: any) {
    console.error("Error fetching user shop:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// POST /api/shops/link - Link a shop to the current user
router.post("/link", shopAccessController.linkShop.bind(shopAccessController));

// GET /api/shops/linked - Get all linked shops for the current user
router.get("/linked", shopAccessController.getLinkedShops.bind(shopAccessController));

// DELETE /api/shops/link/:shopId - Unlink a shop from the current user
router.delete("/link/:shopId", shopAccessController.unlinkShop.bind(shopAccessController));

export default router;

