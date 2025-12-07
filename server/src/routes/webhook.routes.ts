// src/routes/webhook.routes.ts
// Webhook endpoints for Shopee-Clone to send data to BVA Server

import { Router, Request, Response } from "express";
import { webhookController } from "../controllers/webhook.controller";
import { webhookMiddleware } from "../middlewares/webhook.middleware";

const router = Router();

/**
 * Webhook routes for receiving data from Shopee-Clone
 * These endpoints receive real-time updates when data changes in Shopee-Clone
 */

// Product webhooks
router.post("/products/created", webhookMiddleware, webhookController.handleProductCreated);
router.post("/products/updated", webhookMiddleware, webhookController.handleProductUpdated);
router.post("/products/deleted", webhookMiddleware, webhookController.handleProductDeleted);

// Order/Sale webhooks
router.post("/orders/created", webhookMiddleware, webhookController.handleOrderCreated);
router.post("/orders/updated", webhookMiddleware, webhookController.handleOrderUpdated);
router.post("/orders/status-changed", webhookMiddleware, webhookController.handleOrderStatusChanged);

// Inventory webhooks
router.post("/inventory/updated", webhookMiddleware, webhookController.handleInventoryUpdated);

// Batch sync webhook (for initial sync or bulk updates)
router.post("/sync/batch", webhookMiddleware, webhookController.handleBatchSync);

export default router;

