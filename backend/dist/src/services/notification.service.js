"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyProjectManager = exports.notifyUser = exports.notifyUsersByRoles = exports.createNotifications = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotificationById = exports.getNotifications = exports.createNotification = void 0;
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
/* =========================================================
   CREATE SINGLE NOTIFICATION
========================================================= */
const createNotification = async (data, db = database_1.prisma) => {
    const user = await db.user.findUnique({
        where: {
            id: data.userId,
        },
        select: {
            id: true,
            status: true,
        },
    });
    if (!user) {
        throw new Error("Notification recipient not found");
    }
    // Do not create notifications for inactive users
    if (user.status !== "ACTIVE") {
        return null;
    }
    return db.notification.create({
        data: {
            userId: data.userId,
            title: data.title,
            message: data.message,
            notificationType: data.notificationType ?? client_1.NotificationType.INFO,
            referenceType: data.referenceType,
            referenceId: data.referenceId,
        },
    });
};
exports.createNotification = createNotification;
/* =========================================================
   GET NOTIFICATIONS
========================================================= */
const getNotifications = async (options) => {
    const { userId, isRead, notificationType, page = 1, limit = 20, } = options;
    const skip = (page - 1) * limit;
    const where = {
        userId,
        ...(isRead !== undefined && {
            isRead,
        }),
        ...(notificationType && {
            notificationType,
        }),
    };
    const [notifications, total, unreadCount] = await Promise.all([
        database_1.prisma.notification.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),
        database_1.prisma.notification.count({
            where,
        }),
        database_1.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        }),
    ]);
    return {
        notifications,
        unreadCount,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
exports.getNotifications = getNotifications;
/* =========================================================
   GET NOTIFICATION BY ID
========================================================= */
const getNotificationById = async (notificationId, userId) => {
    return database_1.prisma.notification.findFirst({
        where: {
            id: notificationId,
            userId,
        },
    });
};
exports.getNotificationById = getNotificationById;
/* =========================================================
   MARK ONE NOTIFICATION AS READ
========================================================= */
const markNotificationAsRead = async (notificationId, userId) => {
    const notification = await database_1.prisma.notification.findFirst({
        where: {
            id: notificationId,
            userId,
        },
    });
    if (!notification) {
        throw new Error("Notification not found");
    }
    if (notification.isRead) {
        return notification;
    }
    return database_1.prisma.notification.update({
        where: {
            id: notificationId,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });
};
exports.markNotificationAsRead = markNotificationAsRead;
/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
========================================================= */
const markAllNotificationsAsRead = async (userId) => {
    const result = await database_1.prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });
    return {
        count: result.count,
    };
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
/* =========================================================
   DELETE NOTIFICATION
========================================================= */
const deleteNotification = async (notificationId, userId) => {
    const notification = await database_1.prisma.notification.findFirst({
        where: {
            id: notificationId,
            userId,
        },
    });
    if (!notification) {
        throw new Error("Notification not found");
    }
    return database_1.prisma.notification.delete({
        where: {
            id: notificationId,
        },
    });
};
exports.deleteNotification = deleteNotification;
/* =========================================================
   CREATE MULTIPLE NOTIFICATIONS
========================================================= */
const createNotifications = async (data, db = database_1.prisma) => {
    // Remove duplicate user IDs
    const userIds = [...new Set(data.userIds)];
    if (userIds.length === 0) {
        return {
            count: 0,
        };
    }
    // Only active users should receive notifications
    const users = await db.user.findMany({
        where: {
            id: {
                in: userIds,
            },
            status: "ACTIVE",
        },
        select: {
            id: true,
        },
    });
    if (users.length === 0) {
        return {
            count: 0,
        };
    }
    const activeUserIds = users.map((user) => user.id);
    return db.notification.createMany({
        data: activeUserIds.map((userId) => ({
            userId,
            title: data.title,
            message: data.message,
            notificationType: data.notificationType ?? client_1.NotificationType.INFO,
            referenceType: data.referenceType,
            referenceId: data.referenceId,
        })),
    });
};
exports.createNotifications = createNotifications;
/* =========================================================
   NOTIFY USERS BY ROLES
========================================================= */
const notifyUsersByRoles = async (roles, data, db = database_1.prisma) => {
    if (roles.length === 0) {
        return {
            count: 0,
        };
    }
    const users = await db.user.findMany({
        where: {
            status: "ACTIVE",
            role: {
                name: {
                    in: roles,
                },
            },
        },
        select: {
            id: true,
        },
    });
    const userIds = users.map((user) => user.id);
    if (userIds.length === 0) {
        return {
            count: 0,
        };
    }
    return (0, exports.createNotifications)({
        ...data,
        userIds,
    }, db);
};
exports.notifyUsersByRoles = notifyUsersByRoles;
/* =========================================================
   NOTIFY SPECIFIC USER
========================================================= */
const notifyUser = async (userId, data, db = database_1.prisma) => {
    return (0, exports.createNotification)({
        ...data,
        userId,
    }, db);
};
exports.notifyUser = notifyUser;
/* =========================================================
   NOTIFY PROJECT MANAGER
========================================================= */
const notifyProjectManager = async (projectId, data, db = database_1.prisma) => {
    const project = await db.project.findUnique({
        where: {
            id: projectId,
        },
        select: {
            projectManagerId: true,
        },
    });
    if (!project) {
        throw new Error("Project not found");
    }
    if (!project.projectManagerId) {
        return null;
    }
    return (0, exports.notifyUser)(project.projectManagerId, data, db);
};
exports.notifyProjectManager = notifyProjectManager;
