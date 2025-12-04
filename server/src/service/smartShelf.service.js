"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAtRiskInventory = getAtRiskInventory;
exports.getDashboardAnalytics = getDashboardAnalytics;
const prisma_1 = __importDefault(require("../lib/prisma"));
const mlClient_1 = require("../utils/mlClient");
/**
 * Fetch inventory and sales data, then call ML service to detect at-risk items.
 */
async function getAtRiskInventory(shopId) {
    // 1. Fetch products with inventory
    const products = await prisma_1.default.product.findMany({
        where: { shopId },
        include: {
            inventories: {
                take: 1,
            },
        },
    });
    if (products.length === 0) {
        // Return empty response instead of throwing error
        return {
            at_risk: [],
            meta: {
                shop_id: shopId,
                total_products: 0,
                flagged_count: 0,
                analysis_date: new Date().toISOString(),
                thresholds_used: {},
            },
        };
    }
    // Map to InventoryItem
    const inventoryItems = products.map((p) => ({
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        quantity: p.inventories[0]?.quantity || 0,
        expiry_date: p.expiryDate ? p.expiryDate.toISOString() : undefined,
        price: p.price,
        categories: p.description ? [p.description] : [], // Using description as category for now
    }));
    // 2. Fetch sales history (last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sales = await prisma_1.default.sale.findMany({
        where: {
            shopId,
            createdAt: {
                gte: sixtyDaysAgo,
            },
        },
        select: {
            items: true,
            createdAt: true,
        },
    });
    // Map to SalesRecord
    const salesRecords = [];
    sales.forEach((sale) => {
        const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
        if (Array.isArray(items)) {
            items.forEach((item) => {
                if (item.productId) {
                    salesRecords.push({
                        product_id: item.productId,
                        date: sale.createdAt.toISOString(),
                        qty: item.quantity || 0,
                        revenue: (item.quantity || 0) * (item.price || 0),
                    });
                }
            });
        }
    });
    // 3. Construct Request
    const request = {
        shop_id: shopId,
        inventory: inventoryItems,
        sales: salesRecords,
    };
    // 4. Call ML Service
    const response = await mlClient_1.mlClient.post("/api/v1/smart-shelf/at-risk", request);
    return response;
}
/**
 * Get comprehensive dashboard analytics
 * Combines database metrics with ML forecasts
 */
async function getDashboardAnalytics(shopId) {
    // 1. Calculate basic metrics from database
    const products = await prisma_1.default.product.findMany({
        where: { shopId },
        include: {
            inventories: { take: 1 },
        },
    });
    // 2. Get sales data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sales = await prisma_1.default.sale.findMany({
        where: {
            shopId,
            createdAt: {
                gte: thirtyDaysAgo,
            },
        },
        select: {
            items: true,
            total: true,
            createdAt: true,
        },
    });
    // 3. Calculate totals
    let totalRevenue = 0;
    let totalCost = 0;
    let totalItems = 0;
    const salesRecords = [];
    sales.forEach((sale) => {
        totalRevenue += sale.total;
        const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
        if (Array.isArray(items)) {
            items.forEach((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (product) {
                    totalCost += (product.cost || 0) * (item.quantity || 0);
                    totalItems += item.quantity || 0;
                }
                if (item.productId) {
                    salesRecords.push({
                        product_id: item.productId,
                        date: sale.createdAt.toISOString(),
                        qty: item.quantity || 0,
                    });
                }
            });
        }
    });
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    // 4. Get forecast from ML Service (optional - only if products exist)
    let forecast = null;
    if (products.length > 0) {
        try {
            const productIds = products.slice(0, 10).map((p) => p.id); // Top 10 products
            forecast = await mlClient_1.mlClient.getDashboardForecast({
                shop_id: shopId,
                product_list: productIds,
                sales: salesRecords,
                periods: 7,
            });
        }
        catch (error) {
            console.warn("Failed to get forecast from ML service:", error);
            // Continue without forecast data
        }
    }
    return {
        metrics: {
            totalRevenue,
            totalProfit,
            profitMargin,
            totalItems,
            totalProducts: products.length,
            totalSales: sales.length,
        },
        forecast,
        period: {
            start: thirtyDaysAgo.toISOString(),
            end: new Date().toISOString(),
            days: 30,
        },
    };
}
//# sourceMappingURL=smartShelf.service.js.map