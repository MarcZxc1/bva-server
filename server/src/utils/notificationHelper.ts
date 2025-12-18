/**
 * Notification Helper
 * 
 * Provides utility functions for creating notifications with deduplication
 */

import prisma from "../lib/prisma";

interface CreateNotificationOptions {
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  deduplicationKey?: string; // Optional key to prevent duplicates (e.g., "sync_shopee_<shopId>")
  deduplicationWindowHours?: number; // How many hours to check for duplicates (default: 24)
}

/**
 * Create a notification with optional deduplication
 * 
 * @param options Notification options
 * @returns The created notification or null if duplicate was found
 */
export async function createNotificationWithDeduplication(
  options: CreateNotificationOptions
): Promise<{ id: string } | null> {
  try {
    const {
      userId,
      title,
      message,
      type,
      deduplicationKey,
      deduplicationWindowHours = 24,
    } = options;

    // If deduplication key is provided, check for existing notification
    if (deduplicationKey) {
      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() - deduplicationWindowHours);

      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          title,
          type,
          createdAt: {
            gte: windowStart,
          },
        },
        // Check if message contains the deduplication key or matches exactly
        // This is a simple approach - you could store deduplicationKey in a separate field if needed
      });

      // If exact match found within the window, skip creation
      if (existingNotification && existingNotification.message === message) {
        console.log(`ℹ️  Duplicate notification skipped for user ${userId}: ${title}`);
        return null;
      }
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false,
      },
    });

    console.log(`📬 Notification created for user ${userId}: ${title}`);
    return { id: notification.id };
  } catch (error) {
    console.error(`⚠️  Failed to create notification:`, error);
    // Don't throw - notification creation failure shouldn't break the main operation
    return null;
  }
}

/**
 * Create a simple notification without deduplication
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "info" | "warning" | "success" = "info"
): Promise<{ id: string } | null> {
  return createNotificationWithDeduplication({
    userId,
    title,
    message,
    type,
  });
}

