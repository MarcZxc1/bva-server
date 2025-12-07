// src/routes/external.routes.ts
// External API routes for Shopee-Clone to expose data to BVA
import { Router, Request, Response } from "express";
import * as orderController from "../controllers/order.controller";
import * as productController from "../controllers/product.controller";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware";

const router = Router();

/**
 * External API routes for BVA integration
 * These routes accept API keys for authentication
 */

// Get products (external access with API key)
router.get("/products", apiKeyMiddleware, productController.getAllProducts);

// Get orders/sales (external access with API key)
router.get("/orders", apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }
    // Get seller orders for the authenticated user
    const shopId = (req as any).user?.shopId;
    if (shopId) {
      // Create a modified request with shopId in params
      const modifiedReq = { ...req, params: { ...req.params, shopId } } as Request;
      return orderController.getSellerOrders(modifiedReq, res);
    }
    // Fallback to my orders
    return orderController.getMyOrders(req, res);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Get analytics/summary (external access with API key)
router.get("/analytics", apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Return basic analytics that BVA can use
    return res.json({
      success: true,
      data: {
        message: "Analytics endpoint - to be implemented",
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

export default router;

