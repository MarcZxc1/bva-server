import { Router } from "express";
import * as smartShelfController from "../controllers/smartShelf.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/smart-shelf/dashboard/user - Aggregated dashboard for all accessible shops
router.get(
  "/dashboard/user",
  authMiddleware,
  smartShelfController.getUserDashboardAnalytics
);

// GET /api/smart-shelf/at-risk/user - Aggregated at-risk inventory for all accessible shops
router.get(
  "/at-risk/user",
  authMiddleware,
  smartShelfController.getUserAtRiskInventory
);

// GET /api/smart-shelf/expired/user - Get expired items for the current user
router.get(
  "/expired/user",
  authMiddleware,
  smartShelfController.getUserExpiredItems
);

// GET /api/smart-shelf/:shopId/at-risk
router.get(
  "/:shopId/at-risk",
  authMiddleware,
  smartShelfController.getAtRiskInventory
);

// GET /api/smart-shelf/:shopId/dashboard
router.get(
  "/:shopId/dashboard",
  authMiddleware,
  smartShelfController.getDashboardAnalytics
);

// POST /api/smart-shelf/:shopId/generate-promotions
router.post(
  "/:shopId/generate-promotions",
  authMiddleware,
  smartShelfController.generatePromotionsForItem
);

export default router;
