"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPasswordMiddleware = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const hashPasswordMiddleware = async (req, res, next) => {
    try {
        // Only hash if password is provided in the body
        if (req.body.password) {
            const saltRounds = 10;
            req.body.password = await bcrypt_1.default.hash(req.body.password, saltRounds);
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: "Error processing password" });
    }
};
exports.hashPasswordMiddleware = hashPasswordMiddleware;
//# sourceMappingURL=hashPassword.middleware.js.map