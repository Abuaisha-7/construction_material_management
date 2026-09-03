// src/controllers/notification.controller.ts

import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

import {
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notification.service";

export async function getNotificationsController(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.user!.id;

    const {
      isRead,
      notificationType,
      page = "1",
      limit = "20",
    } = req.query;

    const result = await getNotifications({
      userId,
      isRead:
        isRead === undefined
          ? undefined
          : isRead === "true",
      notificationType:
        notificationType as any,
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
}

export async function getNotificationByIdController(
  req: AuthRequest,
  res: Response
) {
  try {
    const notification = await getNotificationById(
      (req as any).params.id,
      req.user!.id
    );

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

export async function markNotificationAsReadController(
  req: AuthRequest,
  res: Response
) {
  try {
    const notification = await markNotificationAsRead(
      (req as any).params.id,
      req.user!.id
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

export async function markAllNotificationsAsReadController(
  req: AuthRequest,
  res: Response
) {
  try {
    const result = await markAllNotificationsAsRead(
      req.user!.id
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
    });
  }
}

export async function deleteNotificationController(
  req: AuthRequest,
  res: Response
) {
  try {
    await deleteNotification(
      (req as any).params.id,
      req.user!.id
    );

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}