"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRestockStrategy = getRestockStrategy;
exports.getMLServiceHealth = getMLServiceHealth;
var prisma_1 = require("../lib/prisma");
var mlClient_1 = require("../utils/mlClient");
/**
 * POST /api/ai/restock-strategy
 * Calculate optimal restocking strategy based on budget and goal
 */
function getRestockStrategy(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, shopId, budget, goal, restockDays, products_1, ninetyDaysAgo, sales_1, mlProducts, validProducts, mlPayload, mlResponse, mlError_1, error_1;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 7, , 8]);
                    _a = req.body, shopId = _a.shopId, budget = _a.budget, goal = _a.goal, restockDays = _a.restockDays;
                    // 1. Validation
                    if (!shopId || !budget || !goal) {
                        res.status(400).json({
                            error: "Validation Error",
                            message: "shopId, budget, and goal are required",
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, prisma_1.default.product.findMany({
                            where: { shopId: shopId },
                            include: {
                                inventories: { take: 1 },
                            },
                        })];
                case 1:
                    products_1 = _d.sent();
                    if (products_1.length === 0) {
                        res.status(404).json({
                            error: "Not Found",
                            message: "No products found for this shop",
                        });
                        return [2 /*return*/];
                    }
                    ninetyDaysAgo = new Date();
                    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                    return [4 /*yield*/, prisma_1.default.sale.findMany({
                            where: {
                                shopId: shopId,
                                createdAt: { gte: ninetyDaysAgo },
                            },
                            select: {
                                items: true,
                                createdAt: true,
                                total: true,
                            },
                        })];
                case 2:
                    sales_1 = _d.sent();
                    // Mock sales data if DB is empty (for demo purposes)
                    if (sales_1.length === 0) {
                        console.log("No sales found, using mock data for demo");
                        sales_1 = Array.from({ length: 10 }).map(function (_, i) { return ({
                            createdAt: new Date(Date.now() - i * 86400000), // Last 10 days
                            total: 100,
                            items: JSON.stringify(products_1.map(function (p) { return ({
                                productId: p.id,
                                quantity: Math.floor(Math.random() * 5) + 1, // Random qty 1-5
                                price: p.price
                            }); }))
                        }); });
                    }
                    mlProducts = products_1.map(function (p) {
                        // Calculate simple avg daily sales from local data
                        var totalQty = 0;
                        sales_1.forEach(function (sale) {
                            var items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
                            if (Array.isArray(items)) {
                                items.forEach(function (item) {
                                    if (item.productId === p.id) {
                                        totalQty += (item.quantity || 0);
                                    }
                                });
                            }
                        });
                        // Calculate actual days in sales data
                        var daysWithSales = sales_1.length > 0 ?
                            Math.max(1, Math.ceil((Date.now() - new Date(sales_1[sales_1.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 7;
                        var avgDailySales = totalQty > 0 ? totalQty / daysWithSales : 0.5; // Use 0.5 as minimum instead of 0
                        var cost = p.cost || 0;
                        var price = p.price || 0;
                        var profitMargin = price > 0 ? (price - cost) / price : 0;
                        var stock = 0;
                        if (p.inventories && p.inventories.length > 0 && p.inventories[0]) {
                            stock = p.inventories[0].quantity;
                        }
                        return {
                            product_id: p.id,
                            name: p.name,
                            price: price,
                            cost: cost,
                            stock: stock,
                            category: p.description || "General",
                            avg_daily_sales: avgDailySales,
                            profit_margin: profitMargin,
                            min_order_qty: 1
                        };
                    });
                    validProducts = mlProducts.filter(function (p) { return p.price > 0 && p.cost > 0; });
                    console.log("Prepared ".concat(validProducts.length, " valid products for ML service"));
                    console.log("Sample product:", JSON.stringify(validProducts[0], null, 2));
                    if (validProducts.length === 0) {
                        res.status(400).json({
                            error: "Validation Error",
                            message: "No valid products found (must have price > 0 and cost > 0)"
                        });
                        return [2 /*return*/];
                    }
                    mlPayload = {
                        shop_id: shopId,
                        budget: Number(budget),
                        goal: goal,
                        products: validProducts,
                        restock_days: restockDays || 14
                    };
                    // 5. Call ML Service
                    console.log("Sending payload to ML Service:", JSON.stringify(mlPayload, null, 2));
                    mlResponse = void 0;
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, mlClient_1.mlClient.post("/api/v1/restock/strategy", mlPayload)];
                case 4:
                    mlResponse = _d.sent();
                    console.log("Received response from ML Service:", JSON.stringify(mlResponse, null, 2));
                    return [3 /*break*/, 6];
                case 5:
                    mlError_1 = _d.sent();
                    console.error("ML Service Call Failed:", mlError_1.message);
                    if (mlError_1.response) {
                        console.error("ML Service Response Data:", mlError_1.response.data);
                        console.error("ML Service Status:", mlError_1.response.status);
                    }
                    throw new Error("ML Service Error: ".concat(mlError_1.message));
                case 6:
                    if (!mlResponse || !mlResponse.items || !mlResponse.totals) {
                        console.error("Invalid ML Response Structure:", mlResponse);
                        throw new Error("Received invalid response from ML Service");
                    }
                    // 6. Return Response
                    res.status(200).json({
                        success: true,
                        data: {
                            budget: Number(budget),
                            recommendations: mlResponse.items.map(function (item) {
                                var _a;
                                // item.product_id might be string or int, ensure comparison works
                                var product = products_1.find(function (p) { return String(p.id) === String(item.product_id); });
                                return {
                                    product_id: item.product_id,
                                    product_name: item.name,
                                    current_stock: ((_a = product === null || product === void 0 ? void 0 : product.inventories[0]) === null || _a === void 0 ? void 0 : _a.quantity) || 0,
                                    recommended_qty: item.qty,
                                    cost: item.total_cost,
                                    expected_revenue: item.expected_revenue,
                                    priority: item.priority_score,
                                    reason: item.reasoning || ""
                                };
                            }),
                            summary: {
                                total_cost: mlResponse.totals.total_cost || 0,
                                total_items: mlResponse.totals.total_items || 0,
                                projected_revenue: mlResponse.totals.expected_revenue || 0,
                                roi: mlResponse.totals.expected_roi || 0,
                            },
                            insights: mlResponse.reasoning,
                            warnings: mlResponse.warnings || []
                        },
                    });
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _d.sent();
                    console.error("Restock Error:", ((_b = error_1.response) === null || _b === void 0 ? void 0 : _b.data) || error_1.message);
                    console.error("Full Error Stack:", error_1.stack);
                    res.status(500).json({
                        error: "Internal Server Error",
                        message: error_1.message || "Failed to calculate restocking strategy",
                        details: ((_c = error_1.response) === null || _c === void 0 ? void 0 : _c.data) || error_1.message,
                    });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function getMLServiceHealth(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var isHealthy, info, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, mlClient_1.mlClient.healthCheck()];
                case 1:
                    isHealthy = _a.sent();
                    return [4 /*yield*/, mlClient_1.mlClient.getServiceInfo()];
                case 2:
                    info = _a.sent();
                    res.json({
                        success: true,
                        healthy: isHealthy,
                        info: info
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    res.status(503).json({
                        success: false,
                        healthy: false,
                        error: error_2.message
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.default = {
    getRestockStrategy: getRestockStrategy,
    getMLServiceHealth: getMLServiceHealth
};
