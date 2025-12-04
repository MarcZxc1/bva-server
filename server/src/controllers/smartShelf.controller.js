"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardAnalytics = exports.getAtRiskInventory = void 0;
const smartShelfService = __importStar(require("../service/smartShelf.service"));
const getAtRiskInventory = async (req, res) => {
    try {
        const { shopId } = req.params;
        if (!shopId) {
            return res.status(400).json({
                success: false,
                error: "Shop ID is required"
            });
        }
        const result = await smartShelfService.getAtRiskInventory(shopId);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Error in getAtRiskInventory:", error);
        if (error.message?.includes("AI Service Unavailable")) {
            return res.status(503).json({
                success: false,
                error: "AI Service Unavailable",
                message: "The AI service is currently unavailable. Please try again later."
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};
exports.getAtRiskInventory = getAtRiskInventory;
const getDashboardAnalytics = async (req, res) => {
    try {
        const { shopId } = req.params;
        if (!shopId) {
            return res.status(400).json({
                success: false,
                error: "Shop ID is required"
            });
        }
        const analytics = await smartShelfService.getDashboardAnalytics(shopId);
        res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        console.error("Error in getDashboardAnalytics:", error);
        if (error.message?.includes("AI Service Unavailable")) {
            return res.status(503).json({
                success: false,
                error: "AI Service Unavailable",
                message: "The AI service is currently unavailable. Please try again later."
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};
exports.getDashboardAnalytics = getDashboardAnalytics;
//# sourceMappingURL=smartShelf.controller.js.map