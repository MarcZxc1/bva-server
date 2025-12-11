// src/routes/shop.routes.ts
import { Router } from "express";
import { shopAccessController } from "../controllers/shopAccess.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/shops/link - Link a shop to the current user
router.post("/link", shopAccessController.linkShop.bind(shopAccessController));

// GET /api/shops/linked - Get all linked shops for the current user
router.get("/linked", shopAccessController.getLinkedShops.bind(shopAccessController));

// DELETE /api/shops/link/:shopId - Unlink a shop from the current user
router.delete("/link/:shopId", shopAccessController.unlinkShop.bind(shopAccessController));

export default router;

