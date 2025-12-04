/**
 * Restocking Strategy Service
 *
 * Handles business logic for AI-powered restocking recommendations.
 * Communicates with Python ML-service via HTTP API.
 *
 * Responsibilities:
 * - Fetch products, inventory, and sales data from database
 * - Transform data for ML-service format
 * - Send requests to Python ML-service
 * - Transform ML-service responses for frontend
 * - Handle errors and retries
 */
import { RestockRequestDTO, RestockResponseDTO } from "../types/restock.types";
/**
 * Main service function: Calculate restocking strategy
 */
export declare function calculateRestockStrategy(dto: RestockRequestDTO): Promise<RestockResponseDTO>;
/**
 * Check if ML-service is available
 */
export declare function checkMLServiceHealth(): Promise<boolean>;
declare const _default: {
    calculateRestockStrategy: typeof calculateRestockStrategy;
    checkMLServiceHealth: typeof checkMLServiceHealth;
};
export default _default;
//# sourceMappingURL=restock.service.d.ts.map