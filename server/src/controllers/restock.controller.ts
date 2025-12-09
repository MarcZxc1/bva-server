import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { mlClient } from "../utils/mlClient";
import { MLRestockRequest, MLRestockResponse, MLProductInput } from "../types/ml.types";
import { getSocketIO } from "../services/socket.service";

/**
 * POST /api/ai/restock-strategy
 * Calculate optimal restocking strategy based on budget and goal
 */
export async function getRestockStrategy(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { shopId, budget, goal, restockDays, weatherCondition, isPayday, upcomingHoliday } = req.body;

    // Check if user has an active Shopee integration
    // Check settings JSON for isActive or termsAccepted
    const integration = await prisma.integration.findFirst({
      where: {
        shopId,
        platform: 'SHOPEE',
      },
    });

    // If no integration or not active (check settings JSON)
    if (!integration) {
      res.status(403).json({
        error: "Integration Required",
        message: "Please integrate with Shopee-Clone and accept the terms to use the Restock Planner.",
        details: "You need to complete the Shopee-Clone integration in Settings before using this feature."
      });
      return;
    }

    // Check if integration is active via settings
    const settings = integration.settings as any;
    const isActive = settings?.isActive !== false && (settings?.termsAccepted === true || settings?.connectedAt);
    
    if (!isActive) {
      res.status(403).json({
        error: "Integration Required",
        message: "Please integrate with Shopee-Clone and accept the terms to use the Restock Planner.",
        details: "You need to complete the Shopee-Clone integration in Settings before using this feature."
      });
      return;
    }

    // 1. Validation
    if (!shopId || !budget || !goal) {
      res.status(400).json({
        error: "Validation Error",
        message: "shopId, budget, and goal are required",
      });
      return;
    }

    // 2. Fetch Products & Inventory from Prisma
    const products = await prisma.product.findMany({
      where: { shopId },
      include: {
        inventories: { take: 1 },
      },
    });

    if (products.length === 0) {
      res.status(404).json({
        error: "Not Found",
        message: "No products found for this shop",
      });
      return;
    }

    // 3. Fetch Sales History from Prisma (Last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let sales = await prisma.sale.findMany({
      where: {
        shopId,
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        items: true,
        createdAt: true,
        total: true,
      },
    });

    console.log(`Found ${sales.length} sales records for shop ${shopId}`);

    // Handle cold start: If no sales data, return helpful error instead of mock data
    if (sales.length === 0) {
      console.log("⚠️ No sales history found - cold start scenario");
      res.status(400).json({
        error: "Insufficient Data",
        message: "No sales history found. Please sync your sales data from Shopee-Clone or add sales records before using the Restock Planner. The ML service requires at least 7-30 days of sales history for accurate predictions.",
        suggestion: "Sync your data via SSO login or manually add sales records through the API.",
      });
      return;
    }

    console.log(`✅ Using ${sales.length} real sales records from database`);

    // 4. Format Data for ML Service
    // Map products to MLProductInput format with strict type validation
    const mlProducts: MLProductInput[] = products
      .map((p) => {
        // Calculate simple avg daily sales from local data
        let totalQty = 0;
        sales.forEach(sale => {
          const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              if (item.productId === p.id) {
                totalQty += (item.quantity || 0);
              }
            });
          }
        });
        
        // Use actual number of sales days, defaulting to 7 if we have sales
        const daysWithSales = sales.length > 0 ? 7 : 30; // Assume 7 days for recent sales
        const avgDailySales = totalQty > 0 ? totalQty / daysWithSales : 1.0; // Default to 1.0 if no sales

        // Ensure all numeric values are proper numbers (not strings, not NaN, not Infinity)
        const cost = Math.max(0, Number(p.cost) || 0);
        const price = Math.max(0, Number(p.price) || 0);
        
        // Calculate profit margin with proper bounds (0.0 to 1.0)
        // Use toFixed(4) to prevent floating point precision issues, then convert back to number
        let profitMargin = 0;
        if (price > 0 && cost >= 0) {
          const calculated = (price - cost) / price;
          // Clamp between 0.0 and 1.0, round to 4 decimal places to match Pydantic precision
          profitMargin = Math.max(0.0, Math.min(1.0, Number(calculated.toFixed(4))));
        }

        // Ensure stock is an integer >= 0
        let stock = 0;
        if (p.inventories && p.inventories.length > 0 && p.inventories[0]) {
          stock = Math.max(0, Math.floor(Number(p.inventories[0].quantity) || 0));
        }

        // Ensure avg_daily_sales is a float >= 0
        const avgDailySalesFloat = Math.max(0, Number(avgDailySales.toFixed(4)));

        // Build product object - max_order_qty is optional, so we omit it
        return {
          product_id: p.id,
          name: String(p.name || "Unknown Product"),
          price: price, // float > 0
          cost: cost, // float > 0
          stock: stock, // int >= 0 (already floored)
          category: p.description ? String(p.description) : "General",
          avg_daily_sales: avgDailySalesFloat, // float >= 0
          profit_margin: profitMargin, // float between 0.0 and 1.0
          min_order_qty: 1, // int >= 1, default: 1
          // max_order_qty is optional - omit it (undefined fields are automatically omitted in JSON)
        } as MLProductInput;
      })
      // Filter out invalid products (cost or price must be > 0)
      .filter((p) => {
        const isValid = p.price > 0 && p.cost > 0 && 
                       !isNaN(p.price) && !isNaN(p.cost) &&
                       !isNaN(p.profit_margin) && 
                       p.profit_margin >= 0 && p.profit_margin <= 1 &&
                       !isNaN(p.avg_daily_sales) && p.avg_daily_sales >= 0 &&
                       Number.isInteger(p.stock) && p.stock >= 0 &&
                       Number.isInteger(p.min_order_qty) && p.min_order_qty >= 1;
        
        if (!isValid) {
          console.warn(`⚠️  Filtered out invalid product: ${p.name}`, {
            price: p.price,
            cost: p.cost,
            profit_margin: p.profit_margin,
            avg_daily_sales: p.avg_daily_sales,
            stock: p.stock,
            min_order_qty: p.min_order_qty
          });
        }
        return isValid;
      });

    const validProducts = mlProducts; // Rename for clarity

    console.log(`Prepared ${validProducts.length} valid products out of ${products.length} total`);
    if (validProducts.length > 0) {
      console.log(`Sample product:`, JSON.stringify(validProducts[0], null, 2));
    }

    if (validProducts.length === 0) {
        res.status(400).json({
            error: "Validation Error",
            message: "No valid products found (must have price > 0 and cost > 0)"
        });
        return;
    }

    // Validate and sanitize goal (must be exactly "profit", "volume", or "balanced")
    const validGoals: ('profit' | 'volume' | 'balanced')[] = ['profit', 'volume', 'balanced'];
    const sanitizedGoal = validGoals.includes(goal as any) ? goal : 'profit';
    
    if (goal !== sanitizedGoal) {
      console.warn(`⚠️  Invalid goal "${goal}", defaulting to "profit"`);
    }

    // Ensure budget is a positive float
    const budgetFloat = parseFloat(String(budget));
    if (isNaN(budgetFloat) || budgetFloat <= 0) {
      res.status(400).json({
        error: "Validation Error",
        message: "Budget must be a positive number",
      });
      return;
    }

    // Ensure restock_days is an integer between 1 and 90
    const restockDaysInt = Math.max(1, Math.min(90, Math.floor(Number(restockDays) || 14)));

    // Validate and sanitize context fields
    const validWeatherConditions = ['sunny', 'rainy', 'storm', null, undefined];
    const sanitizedWeather = validWeatherConditions.includes(weatherCondition) 
      ? weatherCondition || null 
      : null;
    
    const sanitizedIsPayday = Boolean(isPayday);
    const sanitizedHoliday = upcomingHoliday ? String(upcomingHoliday).trim() : null;

    const mlPayload: MLRestockRequest = {
      shop_id: String(shopId),
      budget: budgetFloat, // float > 0
      goal: sanitizedGoal, // 'profit' | 'volume' | 'balanced'
      products: validProducts, // Array with min_length=1
      restock_days: restockDaysInt, // int between 1 and 90
      weather_condition: sanitizedWeather as 'sunny' | 'rainy' | 'storm' | null,
      is_payday: sanitizedIsPayday,
      upcoming_holiday: sanitizedHoliday
    };

    // 5. Call ML Service
    console.log("Sending payload to ML Service:", JSON.stringify(mlPayload, null, 2));
    
    let mlResponse: MLRestockResponse;
    try {
      mlResponse = await mlClient.post<MLRestockResponse>(
        "/api/v1/restock/strategy",
        mlPayload
      );
      console.log("Received response from ML Service:", JSON.stringify(mlResponse, null, 2));
    } catch (mlError: any) {
      // CRITICAL: Log the full error response from Pydantic validation
      console.error("❌ ML Service Call Failed");
      console.error("Error Message:", mlError.message);
      console.error("Error Code:", mlError.code);
      console.error("Error Status:", mlError.response?.status);
      
      // Log the full Pydantic validation error details (this is crucial for debugging 422 errors)
      if (mlError.response?.data) {
        console.error("🔍 Pydantic Validation Error Details:");
        console.error(JSON.stringify(mlError.response.data, null, 2));
        
        // Pydantic 422 errors usually have a 'detail' array with field-specific errors
        if (mlError.response.data.detail) {
          console.error("📋 Field Validation Errors:");
          if (Array.isArray(mlError.response.data.detail)) {
            mlError.response.data.detail.forEach((err: any, index: number) => {
              console.error(`  Error ${index + 1}:`, {
                field: err.loc?.join('.') || 'unknown',
                message: err.msg || err.message,
                type: err.type,
                input: err.input
              });
            });
          } else {
            console.error("  Detail:", mlError.response.data.detail);
          }
        }
      }
      
      console.error("Request Payload Sent:", JSON.stringify(mlPayload, null, 2));
      console.error("Error Stack:", mlError.stack);
      
      // Check if ML service is unavailable
      if (mlError.code === 'ECONNREFUSED' || mlError.message?.includes('ECONNREFUSED')) {
        res.status(503).json({
          error: "Service Unavailable",
          message: "ML Service is not available. Please ensure the ML service is running on port 8001.",
          details: "The restock planner requires the ML service to be running. Start it with: cd ml-service && ./start.sh"
        });
        return;
      }
      
      // Check if it's a timeout
      if (mlError.code === 'ECONNABORTED' || mlError.message?.includes('timeout')) {
        res.status(504).json({
          error: "Gateway Timeout",
          message: "ML Service request timed out. The service may be overloaded.",
          details: mlError.message
        });
        return;
      }
      
      // Handle 422 Unprocessable Entity (Pydantic validation errors)
      if (mlError.response?.status === 422) {
        const validationErrors = mlError.response.data?.detail || mlError.response.data;
        res.status(422).json({
          error: "Validation Error",
          message: "The request data does not match the expected schema. See details for field-specific errors.",
          details: validationErrors,
          payload_sent: mlPayload // Include payload for debugging
        });
        return;
      }
      
      // Check for other validation errors from ML service
      if (mlError.response?.status === 400) {
        res.status(400).json({
          error: "Validation Error",
          message: mlError.response?.data?.detail || mlError.message,
          details: mlError.response?.data
        });
        return;
      }
      
      throw new Error(`ML Service Error: ${mlError.message || 'Unknown error'}`);
    }

    if (!mlResponse || !mlResponse.items || !mlResponse.totals) {
      console.error("Invalid ML Response Structure:", mlResponse);
      throw new Error("Received invalid response from ML Service");
    }

    // 6. Return Response
    const responseData = {
      success: true,
      data: {
        strategy: mlResponse.strategy || goal,
        shopId: shopId,
        budget: Number(budget),
        recommendations: mlResponse.items.map(item => {
            // item.product_id might be string or int, ensure comparison works
            const product = products.find(p => String(p.id) === String(item.product_id));
            return {
                product_id: String(item.product_id),
                product_name: item.name || "Unknown Product",
                current_stock: product?.inventories?.[0]?.quantity || 0,
                recommended_qty: item.qty || 0,
                cost: item.total_cost || 0, 
                expected_revenue: item.expected_revenue || 0,
                priority: item.priority_score || 0,
                reason: item.reasoning || "No reasoning provided"
            };
        }).filter(rec => rec.recommended_qty > 0), // Filter out zero quantity recommendations
        summary: {
            total_cost: mlResponse.totals?.total_cost || 0,
            total_items: mlResponse.totals?.total_items || mlResponse.items.length || 0,
            projected_revenue: mlResponse.totals?.expected_revenue || 0,
            roi: mlResponse.totals?.expected_roi || 0,
        },
        insights: Array.isArray(mlResponse.reasoning) ? mlResponse.reasoning : [],
        warnings: Array.isArray(mlResponse.warnings) ? mlResponse.warnings : []
      },
    };

    // Emit real-time update for restock plan generation
    try {
      const io = getSocketIO();
      if (io) {
        io.to(`shop_${shopId}`).emit("dashboard_update", {
          type: "restock_plan_generated",
          data: {
            shopId,
            budget: Number(budget),
            goal,
            itemsCount: mlResponse.items.length,
            totalCost: mlResponse.totals.total_cost,
            timestamp: new Date().toISOString()
          }
        });
        console.log(`📊 Emitted restock plan update for shop ${shopId}`);
      }
    } catch (socketError) {
      console.warn("⚠️  Could not emit restock update:", socketError);
      // Don't fail the request if socket emission fails
    }

    res.status(200).json(responseData);

  } catch (error: any) {
    // Log the full error for debugging
    console.error("❌ Restock Strategy Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    console.error("Restock Error:", error.response?.data || error.message);
    console.error("Full Error Stack:", error.stack);
    
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "Failed to calculate restocking strategy",
      details: error.response?.data || error.message,
    });
  }
}

export async function getMLServiceHealth(req: Request, res: Response) {
  try {
    const isHealthy = await mlClient.healthCheck();
    const info = await mlClient.getServiceInfo();
    
    res.json({
      success: true,
      healthy: isHealthy,
      info
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      healthy: false,
      error: error.message
    });
  }
}

export default {
  getRestockStrategy,
  getMLServiceHealth
};
