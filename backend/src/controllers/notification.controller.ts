import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  createNotification,
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from "../services/notification.service";
import { NotificationType } from "@prisma/client";

export async function createNotificationController(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      userId,
      title,
      message,
      notificationType,
      referenceType,
      referenceId
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, title and message are required"
      });
    }

    if (
      notificationType &&
      !Object.values(NotificationType).includes(notificationType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type"
      });
    }

    const notification = await createNotification({
      userId,
      title,
      message,
      notificationType,
      referenceType,
      referenceId
    });

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification
    });
  } catch (error: any) {
    console.error("Create notification error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create notification"
    });
  }
}

export async function getNotificationsController(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const isReadParam = req.query.isRead as string | undefined;
    const notificationType = req.query.notificationType as
      | NotificationType
      | undefined;

    let isRead: boolean | undefined;

    if (isReadParam !== undefined) {
      if (isReadParam !== "true" && isReadParam !== "false") {
        return res.status(400).json({
          success: false,
          message: "isRead must be true or false"
        });
      }

      isRead = isReadParam === "true";
    }

    if (
      notificationType &&
      !Object.values(NotificationType).includes(notificationType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type"
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await getNotifications({
      userId: req.user.id,
      isRead,
      notificationType,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get notifications"
    });
  }
}

export async function getNotificationByIdController(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const notification = await getNotificationById(
      (req as any).params.id,
      req.user.id
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    console.error("Get notification error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get notification"
    });
  }
}

export async function markNotificationAsReadController(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const notification = await markNotificationAsRead(
      (req as any).params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error: any) {
    console.error("Mark notification as read error:", error);

    const status =
      error.message === "Notification not found" ? 404 : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to mark notification as read"
    });
  }
}

export async function markAllNotificationsAsReadController(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const result = await markAllNotificationsAsRead(req.user.id);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result
    });
  } catch (error: any) {
    console.error("Mark all notifications as read error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to mark all notifications as read"
    });
  }
}

export async function deleteNotificationController(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const result = await deleteNotification(
      (req as any).params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error("Delete notification error:", error);

    const status =
      error.message === "Notification not found" ? 404 : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to delete notification"
    });
  }
}