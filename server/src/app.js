"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../.env") });
const ad_router_1 = __importDefault(require("./api/ads/ad.router"));
const restock_routes_1 = __importDefault(require("./routes/restock.routes"));
const smartShelf_routes_1 = __importDefault(require("./routes/smartShelf.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// --- 2. Routes ---
// Health check route (good for testing if the server is alive)
app.get("/health", (req, res) => {
    res.status(200).json({ status: "up" });
});
app.use("/test", (req, res) => {
    res.send("WORKING!");
});
// Register your Ad Router
// All routes in adRouter will be prefixed with /api/v1/ads
app.use("/api/v1/ads", ad_router_1.default);
// Register AI Restocking Router
// All routes in restockRouter will be prefixed with /api/ai
app.use("/api/ai", restock_routes_1.default);
// Register SmartShelf Router
app.use("/api/smart-shelf", smartShelf_routes_1.default);
// Register User Router
app.use("/api/users", user_routes_1.default);
// Register Notification Router
app.use("/api/v1/notifications", notification_routes_1.default);
// Register Product Router
app.use("/api/products", product_routes_1.default);
// Register Reports Router
app.use("/api/reports", reports_routes_1.default);
// --- 3. Export the App ---
// We export the app so server.ts can import it
exports.default = app;
//# sourceMappingURL=app.js.map