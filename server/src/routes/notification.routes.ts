import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.use(authMiddleware);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

export default router;
