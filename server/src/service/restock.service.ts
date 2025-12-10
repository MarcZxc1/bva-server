// File: src/service/restock.service.ts
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

import prisma from "../lib/prisma";
import { mlClient } from "../utils/mlClient";
import { hasActiveIntegration } from "../utils/integrationCheck";
import {
  RestockRequestDTO,
  RestockResponseDTO,
  RestockStrategyRequest,
  RestockStrategyResponse,
  ProductInput,
} from "../types/restock.types";

/**
 * Fetch products with inventory and sales data for restocking analysis
 */
async function fetchProductsForRestock(
  shopId: string
): Promise<ProductInput[]> {
  // Check if shop has active integration
  const isActive = await hasActiveIntegration(shopId);
  if (!isActive) {
    // Return empty array if no active integration
    return [];
  }

  // Fetch products with related inventory and sales data using Prisma ORM
  // Only products synced from integrations
  const productsData = await prisma.product.findMany({
    where: {
      shopId: shopId,
      externalId: { not: null }, // Only products synced from integrations
    },
    include: {
      Inventory: {
        take: 1,
      },
    },
  });

  // Calculate average daily sales for each product from Sale records
  const productsWithSales = await Promise.all(
    productsData.map(async (product) => {
      // Get sales for this product in the last 60 days
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Get active integrations to filter by platform
      const integrations = await prisma.integration.findMany({
        where: { shopId },
        select: { platform: true },
      });
      const integrationPlatforms = integrations.map(i => i.platform);

      const sales = await prisma.sale.findMany({
        where: {
          shopId: shopId,
          ...(integrationPlatforms.length > 0 && { platform: { in: integrationPlatforms } }), // Only sales from integrated platforms
          createdAt: {
            gte: sixtyDaysAgo,
          },
        },
        select: {
          items: true,
          createdAt: true,
        },
      });

      // Calculate total quantity sold for this product
      let totalQuantitySold = 0;
      const salesDates = new Set<string>();

      sales.forEach((sale) => {
        const items =
          typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;

        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            if (item.productId === product.id) {
              totalQuantitySold += item.quantity || 0;
              salesDates.add(sale.createdAt.toISOString().split("T")[0]!);
            }
          });
        }
      });

      // Calculate average daily sales
      const daysWithSales = salesDates.size || 1;
      const avgDailySales = totalQuantitySold / Math.max(daysWithSales, 60);

      // Calculate profit margin
      const profitMargin =
        product.price > 0
          ? (product.price - (product.cost || 0)) / product.price
          : 0;

      return {
        product_id: product.id,
        name: product.name,
        price: product.price,
        cost: product.cost || 0,
        stock: product.Inventory[0]?.quantity || 0,
        category: product.description?.split("-")[1]?.trim() || "General",
        avg_daily_sales: avgDailySales,
        profit_margin: profitMargin,
        min_order_qty: 1,
      };
    })
  );

  return productsWithSales;
}

/**
 * Main service function: Calculate restocking strategy
 */
export async function calculateRestockStrategy(
  dto: RestockRequestDTO
): Promise<RestockResponseDTO> {
  const { shopId, budget, goal, restockDays = 14 } = dto;

  // Validate inputs
  if (budget <= 0) {
    throw new Error("Budget must be greater than 0");
  }

  if (!["profit", "volume", "balanced"].includes(goal)) {
    throw new Error("Invalid goal. Must be: profit, volume, or balanced");
  }

  // Fetch products from database
  let products = await fetchProductsForRestock(shopId);

  // Filter out invalid products (cost or price <= 0) as ML service requires positive values
  products = products.filter((p) => p.price > 0 && p.cost > 0);

  if (products.length === 0) {
    throw new Error(
      `No active products with valid price and cost found for shop ${shopId}`
    );
  }

  // Prepare ML-service request
  const mlRequest: RestockStrategyRequest = {
    shop_id: shopId,
    budget,
    goal,
    products: products,
    restock_days: restockDays,
  };

  // Call ML-service
  const mlResponse = await mlClient.calculateRestockStrategy(mlRequest);

  // Transform response for frontend
  const response: RestockResponseDTO = {
    strategy: mlResponse.strategy,
    shopId: mlResponse.shop_id,
    budget: mlResponse.budget,
    recommendations: mlResponse.items.map((item) => ({
      productId: item.product_id,
      productName: item.name,
      currentStock:
        products.find((p) => String(p.product_id) === String(item.product_id))
          ?.stock || 0,
      recommendedQty: item.qty,
      unitCost: item.unit_cost,
      totalCost: item.total_cost,
      expectedProfit: item.expected_profit,
      expectedRevenue: item.expected_revenue,
      daysOfStock: item.days_of_stock,
      priorityScore: item.priority_score,
      reasoning: item.reasoning || "",
    })),
    summary: {
      totalProducts: mlResponse.totals.total_items,
      totalQuantity: mlResponse.totals.total_qty,
      totalCost: mlResponse.totals.total_cost,
      budgetUtilization: mlResponse.totals.budget_used_pct,
      expectedRevenue: mlResponse.totals.expected_revenue,
      expectedProfit: mlResponse.totals.expected_profit,
      expectedROI: mlResponse.totals.expected_roi,
      avgDaysOfStock: mlResponse.totals.avg_days_of_stock,
    },
    insights: mlResponse.reasoning,
    warnings: mlResponse.warnings || [],
  };

  return response;
}

/**
 * Check if ML-service is available
 */
export async function checkMLServiceHealth(): Promise<boolean> {
  return mlClient.healthCheck();
}

export default {
  calculateRestockStrategy,
  checkMLServiceHealth,
};
