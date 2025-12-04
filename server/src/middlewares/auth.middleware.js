"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: "No token provided" });
        return;
    }
    // Bearer <token>
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Invalid token format" });
        return;
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        // Attach user info to request
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map