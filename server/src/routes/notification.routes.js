"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const notificationController = new notification_controller_1.NotificationController();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map