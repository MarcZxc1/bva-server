import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import * as sellerOrderController from "../controllers/sellerOrder.controller";
import * as buyerOrderController from "../controllers/buyerOrder.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// ==========================================
// BUYER ROUTES (for shopee-clone and lazada-clone buyers)
// ==========================================

// Create order (protected - buyer only)
router.post("/buyer", authMiddleware, buyerOrderController.createOrder);

// Get buyer's orders (protected - buyer only)
router.get("/buyer", authMiddleware, buyerOrderController.getBuyerOrders);

// Get buyer order by ID (protected - buyer only)
router.get("/buyer/:orderId", authMiddleware, buyerOrderController.getBuyerOrderById);

// ==========================================
// SELLER ROUTES (for shopee-clone and lazada-clone sellers)
// ==========================================

// Get seller orders for a shop (protected - seller only)
router.get("/seller/:shopId", authMiddleware, sellerOrderController.getSellerOrders);

// Update order status - ship, confirm delivery, etc. (protected - seller only)
router.patch("/seller/:orderId/status", authMiddleware, sellerOrderController.updateOrderStatus);

// Get seller order by ID (protected - seller only)
router.get("/seller/order/:orderId", authMiddleware, sellerOrderController.getSellerOrderById);

// ==========================================
// LEGACY/COMPATIBILITY ROUTES (for backward compatibility)
// ==========================================

// Create order (protected - buyer) - redirects to buyer endpoint
router.post("/", authMiddleware, buyerOrderController.createOrder);

// Get my orders (protected - buyer or seller) - checks role and redirects
router.get("/my", authMiddleware, orderController.getMyOrders);

// Get all orders for current user (returns array directly for Lazada-Clone compatibility)
router.get("/", authMiddleware, orderController.getAllOrders);

// Public integration endpoint for BVA (no auth required)
router.get("/shop/:shopId", orderController.getOrdersByShopPublic);

// Get order by ID (protected) - legacy route
router.get("/:id", authMiddleware, orderController.getOrderById);

export default router;
