import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Create order (protected - buyer)
router.post("/", authMiddleware, orderController.createOrder);

// Get my orders (protected - buyer or seller)
// IMPORTANT: Specific routes must come before generic :id route
router.get("/my", authMiddleware, orderController.getMyOrders);

// Get seller orders (protected - seller)
// This must come before /:id to avoid route conflicts
router.get("/seller/:shopId", authMiddleware, orderController.getSellerOrders);

// Update order status (protected - seller)
router.patch("/:id/status", authMiddleware, orderController.updateOrderStatus);

// Get order by ID (protected)
// This must be last to avoid matching /seller/:shopId or /my
router.get("/:id", authMiddleware, orderController.getOrderById);

export default router;

