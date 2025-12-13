import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Create order (protected - buyer)
router.post("/", authMiddleware, orderController.createOrder);

// Get my orders (protected - buyer or seller)
// IMPORTANT: Specific routes must come before generic :id route
router.get("/my", authMiddleware, orderController.getMyOrders);

// Get all orders for current user (returns array directly for Lazada-Clone compatibility)
router.get("/", authMiddleware, orderController.getAllOrders);

// Public integration endpoint for BVA (no auth required)
// GET /api/orders/shop/:shopId -> Returns list of past orders for a shop
router.get("/shop/:shopId", orderController.getOrdersByShopPublic);

// Get seller orders (protected - seller)
// This must come before /:id to avoid route conflicts
router.get("/seller/:shopId", authMiddleware, orderController.getSellerOrders);

// Update order status (protected - seller)
router.patch("/:id/status", authMiddleware, orderController.updateOrderStatus);

// Get order by ID (protected)
// This must be last to avoid matching /seller/:shopId or /my
router.get("/:id", authMiddleware, orderController.getOrderById);

export default router;

