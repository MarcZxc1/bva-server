"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../service/user.service");
const jwt_1 = require("../utils/jwt");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userService = new user_service_1.UserService();
class UserController {
    // Register a new user
    async register(req, res) {
        try {
            const { email, password, name } = req.body;
            const user = await userService.register(email, password, name);
            // We don't want to return the password hash
            const { password: _, ...userWithoutPassword } = user;
            const token = (0, jwt_1.generateToken)(user.id);
            res.status(201).json({
                success: true,
                data: userWithoutPassword,
                token,
                message: "User registered successfully",
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }
    // Login
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await userService.login(email, password);
            const { password: _, ...userWithoutPassword } = user;
            const token = (0, jwt_1.generateToken)(user.id);
            res.json({
                success: true,
                data: userWithoutPassword,
                token,
                message: "Login successful",
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: error.message,
            });
        }
    }
    async list(req, res) {
        try {
            const users = await userService.list();
            // Remove passwords from list
            const safeUsers = users.map((u) => {
                const { password, ...rest } = u;
                return rest;
            });
            res.json({
                success: true,
                data: safeUsers,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
    // Update user profile
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { firstName, lastName, email } = req.body;
            const updatedUser = await userService.updateProfile(userId, {
                firstName,
                lastName,
                email,
            });
            const { password: _, ...userWithoutPassword } = updatedUser;
            res.json({
                success: true,
                data: userWithoutPassword,
                message: "Profile updated successfully",
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }
    // Update password
    async updatePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: "Current and new password are required",
                });
            }
            // Verify current password
            const user = await userService.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                });
            }
            const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid current password",
                });
            }
            // Hash new password
            const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
            await userService.updatePassword(userId, hashedPassword);
            res.json({
                success: true,
                message: "Password updated successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map