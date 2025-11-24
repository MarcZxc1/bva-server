// File: src/routes/restock.routes.ts
/**
 * Restocking Strategy Routes
 *
 * Defines Express routes for AI-powered restocking recommendations.
 */

import { Router } from "express";
import {
  getRestockStrategy,
  getMLServiceHealth,
} from "../controllers/restock.controller";

const router = Router();

/**
 * POST /api/ai/restock-strategy
 * Calculate optimal restocking strategy
 *
 * Request Body:
 * {
 *   "shopId": "string",
 *   "budget": number,
 *   "goal": "profit" | "volume" | "balanced",
 *   "restockDays"?: number (default: 14)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "strategy": "profit",
 *     "shopId": "SHOP-001",
 *     "budget": 5000,
 *     "recommendations": [...],
 *     "summary": {...},
 *     "insights": [...],
 *     "warnings": [...]
 *   }
 * }
 */
router.post("/restock-strategy", getRestockStrategy);

/**
 * GET /api/ai/restock-strategy/health
 * Check ML-service health status
 */
router.get("/restock-strategy/health", getMLServiceHealth);

export default router;
