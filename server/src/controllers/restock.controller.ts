// File: src/controllers/restock.controller.ts
/**
 * Restocking Strategy Controller
 *
 * Handles HTTP requests for AI-powered restocking recommendations.
 * Validates input, calls service layer, and returns formatted responses.
 */

import { Request, Response } from "express";
import {
  calculateRestockStrategy,
  checkMLServiceHealth,
} from "../service/restock.service";
import { RestockRequestDTO, RestockGoal } from "../types/restock.types";

/**
 * POST /api/ai/restock-strategy
 * Calculate optimal restocking strategy based on budget and goal
 */
export async function getRestockStrategy(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { shopId, budget, goal, restockDays } = req.body;

    // Validate required fields
    if (!shopId) {
      res.status(400).json({
        error: "Validation Error",
        message: "shopId is required",
      });
      return;
    }

    if (!budget || typeof budget !== "number") {
      res.status(400).json({
        error: "Validation Error",
        message: "budget must be a positive number",
      });
      return;
    }

    if (budget <= 0) {
      res.status(400).json({
        error: "Validation Error",
        message: "budget must be greater than 0",
      });
      return;
    }

    if (!goal || !["profit", "volume", "balanced"].includes(goal)) {
      res.status(400).json({
        error: "Validation Error",
        message: "goal must be one of: profit, volume, balanced",
      });
      return;
    }

    if (restockDays !== undefined) {
      if (
        typeof restockDays !== "number" ||
        restockDays < 1 ||
        restockDays > 90
      ) {
        res.status(400).json({
          error: "Validation Error",
          message: "restockDays must be a number between 1 and 90",
        });
        return;
      }
    }

    // Prepare DTO
    const dto: RestockRequestDTO = {
      shopId,
      budget,
      goal: goal as RestockGoal,
      restockDays: restockDays || 14,
    };

    // Call service
    const result = await calculateRestockStrategy(dto);

    // Return success response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Restock strategy error:", error);

    // Handle specific errors
    if (error.message?.includes("ML Service unavailable")) {
      res.status(503).json({
        error: "Service Unavailable",
        message: "AI service is currently unavailable. Please try again later.",
        details: error.message,
      });
      return;
    }

    if (error.message?.includes("No active products found")) {
      res.status(404).json({
        error: "Not Found",
        message: error.message,
      });
      return;
    }

    // Generic error
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to calculate restocking strategy",
      details: error.message,
    });
  }
}

/**
 * GET /api/ai/restock-strategy/health
 * Check ML-service health status
 */
export async function getMLServiceHealth(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const isHealthy = await checkMLServiceHealth();

    res.status(200).json({
      mlService: {
        status: isHealthy ? "up" : "down",
        url: process.env.ML_SERVICE_URL || "http://localhost:8001",
      },
    });
  } catch (error: any) {
    res.status(200).json({
      mlService: {
        status: "down",
        url: process.env.ML_SERVICE_URL || "http://localhost:8001",
        error: error.message,
      },
    });
  }
}

export default {
  getRestockStrategy,
  getMLServiceHealth,
};
