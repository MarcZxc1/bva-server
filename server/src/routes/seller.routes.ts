import { Router } from "express";
import * as sellerController from "../controllers/seller.controller";
import * as productController from "../controllers/product.controller";
import * as orderController from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Get seller dashboard (protected)
router.get("/:shopId/dashboard", authMiddleware, sellerController.getSellerDashboard);

// Get seller income (protected)
router.get("/:shopId/income", authMiddleware, sellerController.getSellerIncome);

// Seller product endpoints (Lazada-Clone specific)
// GET /api/seller/products - Get all products for authenticated seller's shop
router.get("/products", authMiddleware, sellerController.getSellerProducts);

// POST /api/seller/products - Create product for authenticated seller's shop
router.post("/products", authMiddleware, sellerController.createSellerProduct);

// Seller order endpoints (Lazada-Clone specific)
// GET /api/seller/orders - Get all orders for authenticated seller's shop
router.get("/orders", authMiddleware, sellerController.getSellerOrders);

export default router;

