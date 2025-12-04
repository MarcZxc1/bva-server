"use strict";
// File: src/routes/restock.routes.ts
/**
 * Restocking Strategy Routes
 *
 * Defines Express routes for AI-powered restocking recommendations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const restock_controller_1 = require("../controllers/restock.controller");
const router = (0, express_1.Router)();
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
router.post("/restock-strategy", restock_controller_1.getRestockStrategy);
/**
 * GET /api/ai/restock-strategy/health
 * Check ML-service health status
 */
router.get("/restock-strategy/health", restock_controller_1.getMLServiceHealth);
exports.default = router;
//# sourceMappingURL=restock.routes.js.map