import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Create order (protected - buyer)
router.post("/", authMiddleware, orderController.createOrder);

// Get my orders (protected - buyer or seller)
router.get("/my", authMiddleware, orderController.getMyOrders);

// Get order by ID (protected)
router.get("/:id", authMiddleware, orderController.getOrderById);

// Get seller orders (protected - seller)
router.get("/seller/:shopId", authMiddleware, orderController.getSellerOrders);

// Update order status (protected - seller)
router.patch("/:id/status", authMiddleware, orderController.updateOrderStatus);

export default router;

