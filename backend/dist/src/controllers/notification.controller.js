"use strict";
// src/controllers/notification.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationsController = getNotificationsController;
exports.getNotificationByIdController = getNotificationByIdController;
exports.markNotificationAsReadController = markNotificationAsReadController;
exports.markAllNotificationsAsReadController = markAllNotificationsAsReadController;
exports.deleteNotificationController = deleteNotificationController;
const notification_service_1 = require("../services/notification.service");
async function getNotificationsController(req, res) {
    try {
        const userId = req.user.id;
        const { isRead, notificationType, page = "1", limit = "20", } = req.query;
        const result = await (0, notification_service_1.getNotifications)({
            userId,
            isRead: isRead === undefined
                ? undefined
                : isRead === "true",
            notificationType: notificationType,
            page: Number(page),
            limit: Number(limit),
        });
        return res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
        });
    }
}
async function getNotificationByIdController(req, res) {
    try {
        const notification = await (0, notification_service_1.getNotificationById)(req.params.id, req.user.id);
        return res.status(200).json({
            success: true,
            data: notification,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
}
async function markNotificationAsReadController(req, res) {
    try {
        const notification = await (0, notification_service_1.markNotificationAsRead)(req.params.id, req.user.id);
        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
}
async function markAllNotificationsAsReadController(req, res) {
    try {
        const result = await (0, notification_service_1.markAllNotificationsAsRead)(req.user.id);
        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            data: result,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read",
        });
    }
}
async function deleteNotificationController(req, res) {
    try {
        await (0, notification_service_1.deleteNotification)(req.params.id, req.user.id);
        return res.status(200).json({
            success: true,
            message: "Notification deleted",
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
}
