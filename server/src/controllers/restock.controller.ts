import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { mlClient } from "../utils/mlClient";
import { MLRestockRequest, MLRestockResponse, MLProductInput } from "../types/ml.types";
import { getSocketIO } from "../services/socket.service";
import { getShopIdFromRequest, verifyShopAccess } from "../utils/requestHelpers";
import { CacheService } from "../lib/redis";

/**
 * POST /api/ai/restock-strategy
 * 
 * Smart Restock Planner with Intelligent Forecasting
 * 
 * This endpoint implements the project requirement:
 * "To design a Smart Restock Planner with Intelligent Forecasting that creates a baseline sales
 * calendar from historical data, adjusts predictions using real-world context (e.g., weather,
 * holidays, payday cycles), and recommends restocking strategies aligned with sellers' budgets and
 * goals."
 * 
 * Implementation:
 * 1. Baseline Sales Calendar: Calculates avg_daily_sales from last 90 days of historical sales data
 * 2. Context Adjustments: Applies multipliers for payday cycles (+20%) and holidays (+50%)
 * 3. Strategy Recommendations: Provides three optimization strategies:
 *    - profit: Maximize profit margin × demand
 *    - volume: Maximize inventory turnover
 *    - balanced: 50/50 hybrid approach
 * 4. Budget Alignment: All recommendations respect the provided budget constraint
 * 
 * Products are automatically synced from connected platforms (Shopee, Lazada) and sent to ML service
 * for intelligent forecasting and restocking recommendations.
 */
export async function getRestockStrategy(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get shopId from request (body or token/user's shops)
    let { shopId, budget, goal, restockDays, isPayday, upcomingHoliday } = req.body;
    const user = (req as any).user;
    // JWT token might have userId at top level or nested in user object
    const userId = user?.userId || user?.id || (req as any).userId;

    console.log(`📊 Restock Planner request:`, {
      shopIdFromBody: shopId,
      userId: userId,
      userObject: user ? Object.keys(user) : 'no user',
      hasShopIdInToken: !!user?.shopId,
    });

    // If shopId not in body, try to get it from request helper (token/user's shops)
    if (!shopId) {
      shopId = await getShopIdFromRequest(req);
      console.log(`📊 Restock Planner: Got shopId from request helper: ${shopId}`);
    }

    // 1. Validation
    console.log(`📊 Restock Planner validation:`, { 
      shopId: shopId || 'MISSING', 
      budget: budget !== undefined ? budget : 'MISSING', 
      goal: goal || 'MISSING',
      budgetType: typeof budget,
      goalType: typeof goal,
    });
    
    if (!shopId || budget === undefined || budget === null || !goal) {
      console.log(`❌ Restock Planner validation failed:`, { 
        shopId: !!shopId, 
        budget: budget !== undefined && budget !== null, 
        goal: !!goal,
        budgetValue: budget,
        goalValue: goal,
      });
      res.status(400).json({
        error: "Validation Error",
        message: !shopId 
          ? "Shop ID is required. Please ensure you have a shop associated with your account." 
          : (budget === undefined || budget === null)
          ? "Budget is required and must be a positive number."
          : !goal
          ? "Goal is required. Must be one of: profit, volume, or balanced."
          : "shopId, budget, and goal are required",
        details: !shopId ? "You need to have a shop linked to your account. Please check your shop settings." : undefined,
      });
      return;
    }

    // Validate budget is a positive number
    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      console.log(`❌ Restock Planner: Invalid budget value:`, budget);
      res.status(400).json({
        error: "Validation Error",
        message: "Budget must be a positive number greater than 0",
        details: `Received budget value: ${budget} (type: ${typeof budget})`,
      });
      return;
    }

    // Validate goal is one of the allowed values
    if (!["profit", "volume", "balanced"].includes(goal)) {
      console.log(`❌ Restock Planner: Invalid goal value:`, goal);
      res.status(400).json({
        error: "Validation Error",
        message: "Goal must be one of: profit, volume, or balanced",
        details: `Received goal value: ${goal}`,
      });
      return;
    }

    // Check if user has access to this shop
    // First, ensure userId is available in request for verifyShopAccess
    if (userId && !(req as any).user?.userId) {
      (req as any).user = { ...user, userId: userId };
    }
    
    const hasAccess = await verifyShopAccess(req, shopId);
    console.log(`📊 Restock Planner: Shop access check for shop ${shopId}: ${hasAccess}, userId: ${userId}`);
    if (!hasAccess) {
      console.log(`❌ Restock Planner: Access denied for shop ${shopId}, userId: ${userId}`);
      res.status(403).json({
        error: "Access Denied",
        message: "You do not have access to this shop.",
        details: `User ${userId || 'unknown'} does not have access to shop ${shopId}. Please ensure the shop is linked to your account.`,
      });
      return;
    }

    // Check if user has a Shopee integration (optional - allow restock planner to work with any shop)
    // We removed the strict integration requirement to allow restock planner to work with all shops
    // This matches the pattern used in other controllers (smartShelf, reports, etc.)
    const integration = await prisma.integration.findFirst({
      where: {
        shopId,
        platform: 'SHOPEE',
      },
    });

    // Log integration status for debugging
    if (integration) {
      const settings = integration.settings as any;
      console.log(`📊 Restock Planner: Found integration for shop ${shopId}`, {
        hasIntegration: true,
        isActive: settings?.isActive !== false,
        termsAccepted: settings?.termsAccepted === true,
        connectedAt: settings?.connectedAt,
      });
    } else {
      console.log(`📊 Restock Planner: No integration found for shop ${shopId}, proceeding anyway (integration is optional)`);
    }

    // Note: We no longer require integration to be active
    // This allows restock planner to work with any shop that has products

    // 2. Fetch Products & Inventory from Prisma (with caching)
    console.log(`📦 [Restock Planner] Fetching products for shop ${shopId}...`);
    
    // Cache key for products
    const productsCacheKey = `restock:products:${shopId}`;
    let products = await CacheService.get<any[]>(productsCacheKey);
    
    if (products === null) {
      console.log(`💾 [Cache MISS] Restock Planner: Fetching products from database...`);
      const dbProducts = await prisma.product.findMany({
        where: { shopId },
        include: {
          Inventory: { take: 1 },
        },
      });
      
      // Map products for caching
      products = dbProducts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        sku: p.sku,
        category: p.category,
        imageUrl: p.imageUrl,
        expiryDate: p.expiryDate,
        externalId: p.externalId,
        Inventory: p.Inventory,
      }));
      
      // Cache products for 5 minutes
      await CacheService.set(productsCacheKey, products, 300);
      console.log(`💾 [Cache SET] Restock Planner: Cached ${products.length} products`);
    } else {
      console.log(`💾 [Cache HIT] Restock Planner: Using ${products.length} cached products`);
    }

    console.log(`📦 [Restock Planner] Found ${products.length} products in database for shop ${shopId}`);
    if (products.length === 0) {
      res.status(404).json({
        error: "Not Found",
        message: "No products found for this shop",
      });
      return;
    }

    // 3. Fetch Sales History from Prisma (Last 90 days) - Creates baseline sales calendar (with caching)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    console.log(`📊 [Restock Planner] Fetching sales history (last 90 days) to create baseline sales calendar...`);
    
    // Cache key for sales
    const salesCacheKey = `restock:sales:${shopId}:${ninetyDaysAgo.toISOString()}`;
    let sales = await CacheService.get<any[]>(salesCacheKey);
    
    if (sales === null) {
      console.log(`💾 [Cache MISS] Restock Planner: Fetching sales from database...`);
      sales = await prisma.sale.findMany({
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
      
      // Cache sales for 5 minutes
      await CacheService.set(salesCacheKey, sales, 300);
      console.log(`💾 [Cache SET] Restock Planner: Cached ${sales.length} sales records`);
    } else {
      console.log(`💾 [Cache HIT] Restock Planner: Using ${sales.length} cached sales records`);
    }

    console.log(`📊 [Restock Planner] Found ${sales.length} sales records for baseline calculation (last 90 days)`);

    // Handle cold start: If no sales data, we'll still proceed but with limited data
    // The ML service can handle this, but we'll log a warning
    if (sales.length === 0) {
      console.log("⚠️ No sales history found - proceeding with cold start scenario");
      console.log(`   Shop ${shopId} has ${products.length} products but 0 sales records`);
      console.log(`   ML service will use product data and inventory levels for recommendations`);
      // Don't return error - allow ML service to handle cold start
      // The ML service can work with just product data and inventory levels
    } else {
      console.log(`✅ Using ${sales.length} real sales records from database`);
    }

    // 4. Format Data for ML Service
    // Map products to MLProductInput format with strict type validation
    // This creates the baseline sales calendar from historical data
    console.log(`🔄 [Restock Planner] Formatting ${products.length} products for ML service...`);
    const mlProducts: MLProductInput[] = products
      .map((p) => {
        // Calculate baseline avg daily sales from historical data (last 90 days)
        // This creates the baseline sales calendar as required by the project
        let totalQty = 0;
        let salesDays = new Set<string>(); // Track unique days with sales for accurate baseline
        
        sales.forEach(sale => {
          const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              if (item.productId === p.id) {
                totalQty += (item.quantity || 0);
                // Track unique sales days for this product
                const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
                salesDays.add(saleDate);
              }
            });
          }
        });
        
        // Calculate baseline: use actual number of days with sales, or use 90-day window
        // This creates a more accurate baseline sales calendar
        const actualDaysWithSales = salesDays.size > 0 ? salesDays.size : 90;
        const avgDailySales = totalQty > 0 ? totalQty / actualDaysWithSales : 0.1; // Default to 0.1 if no sales (avoid division by zero)
        
        console.log(`   📊 Product ${p.name}: ${totalQty} units sold over ${actualDaysWithSales} days = ${avgDailySales.toFixed(2)} units/day baseline`);

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
        if (p.Inventory && p.Inventory.length > 0 && p.Inventory[0]) {
          stock = Math.max(0, Math.floor(Number(p.Inventory[0].quantity) || 0));
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
          console.warn(`⚠️  Filtered out invalid Product: ${p.name}`, {
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
    const sanitizedIsPayday = Boolean(isPayday);
    const sanitizedHoliday = upcomingHoliday ? String(upcomingHoliday).trim() : null;

    console.log(`✅ [Restock Planner] Prepared ${validProducts.length} valid products out of ${products.length} total for ML service`);
    console.log(`📤 [Restock Planner] Sending products to ML service with context:`);
    console.log(`   - Budget: ₱${budgetFloat.toFixed(2)}`);
    console.log(`   - Goal: ${sanitizedGoal}`);
    console.log(`   - Restock Days: ${restockDaysInt}`);
    console.log(`   - Is Payday: ${sanitizedIsPayday} (demand multiplier: ${sanitizedIsPayday ? '+20%' : 'none'})`);
    console.log(`   - Upcoming Holiday: ${sanitizedHoliday || 'none'} (demand multiplier: ${sanitizedHoliday ? '+50%' : 'none'})`);
    if (validProducts.length > 0) {
      console.log(`📦 [Restock Planner] Sample Product being sent to ML:`, JSON.stringify(validProducts[0], null, 2));
    }

    const mlPayload: MLRestockRequest = {
      shop_id: String(shopId),
      budget: budgetFloat, // float > 0
      goal: sanitizedGoal, // 'profit' | 'volume' | 'balanced'
      products: validProducts, // Array with min_length=1 (ML service expects lowercase 'products')
      restock_days: restockDaysInt, // int between 1 and 90
      is_payday: sanitizedIsPayday,
      upcoming_holiday: sanitizedHoliday
    };

    // 5. Call ML Service
    // This sends products with baseline sales calendar and context adjustments to ML service
    console.log(`🚀 [Restock Planner] Sending ${validProducts.length} products to ML service for intelligent forecasting...`);
    console.log(`📋 [Restock Planner] Payload summary:`, {
      shop_id: mlPayload.shop_id,
      budget: mlPayload.budget,
      goal: mlPayload.goal,
      products_count: mlPayload.products.length,
      restock_days: mlPayload.restock_days,
      is_payday: mlPayload.is_payday,
      upcoming_holiday: mlPayload.upcoming_holiday,
    });
    
    let mlResponse: MLRestockResponse;
    try {
      mlResponse = await mlClient.post<MLRestockResponse>(
        "/api/v1/restock/strategy",
        mlPayload
      );
      console.log(`✅ [Restock Planner] Received response from ML service:`);
      console.log(`   - Strategy: ${mlResponse.strategy}`);
      console.log(`   - Items Recommended: ${mlResponse.items.length}`);
      console.log(`   - Total Cost: ₱${mlResponse.totals.total_cost.toFixed(2)}`);
      console.log(`   - Expected Profit: ₱${mlResponse.totals.expected_profit.toFixed(2)}`);
      console.log(`   - Expected ROI: ${mlResponse.totals.expected_roi.toFixed(2)}%`);
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
    // Group recommendations by product_id to accumulate quantities for duplicate products
    const productRecommendationMap = new Map<string, {
      product_id: string;
      product_name: string;
      current_stock: number;
      recommended_qty: number;
      cost: number;
      expected_revenue: number;
      priority: number;
      reasons: string[];
    }>();

    mlResponse.items.forEach(item => {
      const productId = String(item.product_id);
      const product = products.find(p => String(p.id) === productId);
      
      if (productRecommendationMap.has(productId)) {
        // Product already exists, accumulate quantities and costs
        const existing = productRecommendationMap.get(productId)!;
        existing.recommended_qty += (item.qty || 0);
        existing.cost += (item.total_cost || 0);
        existing.expected_revenue += (item.expected_revenue || 0);
        // Keep the highest priority score
        existing.priority = Math.max(existing.priority, item.priority_score || 0);
        // Accumulate unique reasons
        if (item.reasoning && !existing.reasons.includes(item.reasoning)) {
          existing.reasons.push(item.reasoning);
        }
      } else {
        // New product, add to map
        productRecommendationMap.set(productId, {
          product_id: productId,
          product_name: item.name || product?.name || "Unknown Product",
          current_stock: product?.Inventory?.[0]?.quantity || 0,
          recommended_qty: item.qty || 0,
          cost: item.total_cost || 0,
          expected_revenue: item.expected_revenue || 0,
          priority: item.priority_score || 0,
          reasons: item.reasoning ? [item.reasoning] : []
        });
      }
    });

    // Convert map to array and format reasons
    const recommendations = Array.from(productRecommendationMap.values())
      .map(rec => ({
        ...rec,
        reason: rec.reasons.length > 0 ? rec.reasons.join('; ') : "No reasoning provided"
      }))
      .filter(rec => rec.recommended_qty > 0) // Filter out zero quantity recommendations
      .sort((a, b) => b.priority - a.priority); // Sort by priority descending

    const responseData = {
      success: true,
      data: {
        strategy: mlResponse.strategy || goal,
        shopId: shopId,
        budget: Number(budget),
        recommendations: recommendations,
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
