/**
 * Restocking Strategy Controller
 *
 * Handles HTTP requests for AI-powered restocking recommendations.
 * Validates input, calls service layer, and returns formatted responses.
 */
import { Request, Response } from "express";
/**
 * POST /api/ai/restock-strategy
 * Calculate optimal restocking strategy based on budget and goal
 */
export declare function getRestockStrategy(req: Request, res: Response): Promise<void>;
/**
 * GET /api/ai/restock-strategy/health
 * Check ML-service health status
 */
export declare function getMLServiceHealth(req: Request, res: Response): Promise<void>;
declare const _default: {
    getRestockStrategy: typeof getRestockStrategy;
    getMLServiceHealth: typeof getMLServiceHealth;
};
export default _default;
//# sourceMappingURL=restock.controller.d.ts.map