import { Request, Response } from "express";
import prisma from "../lib/prisma";

export class NotificationController {
  // Get all notifications for the current user
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Mark a specific notification as read
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Notification ID is required",
        });
      }

      // Ensure the notification belongs to the user
      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: "Notification not found",
        });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
