// src/routes/integration.routes.ts
import { Router } from "express";
import { integrationController } from "../controllers/integration.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @route   POST /api/integrations
 * @desc    Create a new platform integration
 * @access  Private
 */
router.post("/", authMiddleware, integrationController.createIntegration);

/**
 * @route   GET /api/integrations
 * @desc    Get all integrations for the authenticated user's shop
 * @access  Private
 */
router.get("/", authMiddleware, integrationController.getIntegrations);

/**
 * @route   GET /api/integrations/:id
 * @desc    Get integration by ID
 * @access  Private
 */
router.get("/:id", authMiddleware, integrationController.getIntegrationById);

/**
 * @route   PUT /api/integrations/:id
 * @desc    Update integration
 * @access  Private
 */
router.put("/:id", authMiddleware, integrationController.updateIntegration);

/**
 * @route   DELETE /api/integrations/:id
 * @desc    Delete integration
 * @access  Private
 */
router.delete("/:id", authMiddleware, integrationController.deleteIntegration);

/**
 * @route   POST /api/integrations/:id/test
 * @desc    Test integration connection
 * @access  Private
 */
router.post("/:id/test", authMiddleware, integrationController.testConnection);

/**
 * @route   POST /api/integrations/:id/sync
 * @desc    Sync data from integration
 * @access  Private
 */
router.post("/:id/sync", authMiddleware, integrationController.syncIntegration);

export default router;
