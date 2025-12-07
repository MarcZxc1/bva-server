import { Router } from "express";
import * as sellerController from "../controllers/seller.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Get seller dashboard (protected)
router.get("/:shopId/dashboard", authMiddleware, sellerController.getSellerDashboard);

// Get seller income (protected)
router.get("/:shopId/income", authMiddleware, sellerController.getSellerIncome);

export default router;

