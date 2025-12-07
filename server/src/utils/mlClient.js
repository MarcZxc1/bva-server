"use strict";
/**
 * ML Service Client
 *
 * Centralized client for communicating with the Python ML Service.
 * Implements the API Gateway pattern - all ML operations go through this client.
 *
 * Features:
 * - Ads Generation (MarketMate)
 * - Restock Optimization (Smart Restock Planner)
 * - Analytics & Forecasting (SmartShelf)
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlClient = exports.MLServiceClient = void 0;
var axios_1 = __importDefault(require("axios"));
var MLServiceClient = /** @class */ (function () {
    function MLServiceClient() {
        this.baseURL = process.env.ML_SERVICE_URL || "http://localhost:8001";
        this.client = axios_1.default.create({
            baseURL: this.baseURL,
            timeout: 60000, // 60 seconds for ML operations
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
    // ============================================
    // Generic HTTP Methods
    // ============================================
    MLServiceClient.prototype.post = function (endpoint, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.post(endpoint, data)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_1 = _a.sent();
                        this.handleError(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MLServiceClient.prototype.get = function (endpoint) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.get(endpoint)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_2 = _a.sent();
                        this.handleError(error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // Feature-Specific Methods
    // ============================================
    /**
     * MarketMate: Generate complete AI-powered ad (copy + image)
     * Endpoint: POST /api/v1/ads/generate
     */
    MLServiceClient.prototype.generateCompleteAd = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post("/api/v1/ads/generate", request)];
            });
        });
    };
    /**
     * MarketMate: Generate AI-powered ad copy only
     * Endpoint: POST /api/v1/ads/generate-copy
     */
    MLServiceClient.prototype.generateAdCopy = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post("/api/v1/ads/generate-copy", request)];
            });
        });
    };
    /**
     * MarketMate: Generate AI-powered ad image
     * Endpoint: POST /api/v1/ads/generate-image
     */
    MLServiceClient.prototype.generateAdImage = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post("/api/v1/ads/generate-image", request)];
            });
        });
    };
    /**
     * Smart Restock Planner: Calculate optimal restocking strategy
     * Endpoint: POST /api/v1/restock/strategy
     */
    MLServiceClient.prototype.calculateRestockStrategy = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post("/api/v1/restock/strategy", request)];
            });
        });
    };
    /**
     * SmartShelf: Detect at-risk inventory
     * Endpoint: POST /api/v1/smart-shelf/at-risk
     */
    MLServiceClient.prototype.detectAtRiskInventory = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post("/api/v1/smart-shelf/at-risk", request)];
            });
        });
    };
    /**
     * SmartShelf: Generate promotions for near-expiry items
     * Endpoint: POST /api/v1/smart-shelf/promotions
     */
    MLServiceClient.prototype.generatePromotions = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post("/api/v1/smart-shelf/promotions", request)];
            });
        });
    };
    /**
     * SmartShelf: Get sales forecast and analytics for dashboard
     * Endpoint: POST /api/v1/smart-shelf/forecast
     */
    MLServiceClient.prototype.getDashboardForecast = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post("/api/v1/smart-shelf/forecast", request)];
            });
        });
    };
    /**
     * SmartShelf: Get sales insights for analytics
     * Endpoint: POST /api/v1/smart-shelf/insights
     */
    MLServiceClient.prototype.getSalesInsights = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post("/api/v1/smart-shelf/insights", request)];
            });
        });
    };
    // ============================================
    // Health & Utilities
    // ============================================
    /**
     * Check if ML Service is healthy and reachable
     */
    MLServiceClient.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.get("/health")];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get ML Service status and version info
     */
    MLServiceClient.prototype.getServiceInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.get("/health")];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, { status: "unavailable" }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // Error Handling
    // ============================================
    MLServiceClient.prototype.handleError = function (error) {
        var _a, _b;
        if (error.response) {
            // ML-service returned an error response
            var detail = ((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.detail) || ((_b = error.response.data) === null || _b === void 0 ? void 0 : _b.message);
            var status_1 = error.response.status;
            if (status_1 === 503) {
                throw new Error("AI Service Unavailable: The ML service is temporarily unavailable. Please try again later.");
            }
            throw new Error(detail || "ML Service error (".concat(status_1, "): ").concat(error.message));
        }
        else if (error.request) {
            // No response received - service is down
            throw new Error("AI Service Unavailable: Cannot reach ML service at ".concat(this.baseURL, ". Please ensure the service is running."));
        }
        else {
            // Request setup error
            throw new Error("Request failed: ".concat(error.message));
        }
    };
    return MLServiceClient;
}());
exports.MLServiceClient = MLServiceClient;
// Singleton instance
exports.mlClient = new MLServiceClient();
