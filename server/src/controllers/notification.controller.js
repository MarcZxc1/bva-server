"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class NotificationController {
    // Get all notifications for the current user
    async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const notifications = await prisma_1.default.notification.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            });
            res.json({
                success: true,
                data: notifications,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
    // Mark a specific notification as read
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "Notification ID is required",
                });
            }
            // Ensure the notification belongs to the user
            const notification = await prisma_1.default.notification.findFirst({
                where: { id, userId },
            });
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    error: "Notification not found",
                });
            }
            const updated = await prisma_1.default.notification.update({
                where: { id },
                data: { isRead: true },
            });
            res.json({
                success: true,
                data: updated,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
    // Mark all notifications as read
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            await prisma_1.default.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
            res.json({
                success: true,
                message: "All notifications marked as read",
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
exports.NotificationController = NotificationController;
//# sourceMappingURL=notification.controller.js.map