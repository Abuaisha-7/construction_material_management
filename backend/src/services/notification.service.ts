import { prisma } from "../config/database";
import { NotificationType, Prisma } from "@prisma/client";

type DbClient =
  | typeof prisma
  | Prisma.TransactionClient;

/* =========================================================
   INPUT TYPES
========================================================= */

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  notificationType?: NotificationType;
  referenceType?: string;
  referenceId?: string;
}

interface CreateNotificationsInput {
  userIds: string[];
  title: string;
  message: string;
  notificationType?: NotificationType;
  referenceType?: string;
  referenceId?: string;
}

interface GetNotificationsOptions {
  userId: string;
  isRead?: boolean;
  notificationType?: NotificationType;
  page?: number;
  limit?: number;
}

/* =========================================================
   CREATE SINGLE NOTIFICATION
========================================================= */

export const createNotification = async (
  data: CreateNotificationInput,
  db: DbClient = prisma
) => {
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
      notificationType:
        data.notificationType ?? NotificationType.INFO,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
    },
  });
};

/* =========================================================
   GET NOTIFICATIONS
========================================================= */

export const getNotifications = async (
  options: GetNotificationsOptions
) => {
  const {
    userId,
    isRead,
    notificationType,
    page = 1,
    limit = 20,
  } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(isRead !== undefined && {
      isRead,
    }),
    ...(notificationType && {
      notificationType,
    }),
  };

  const [notifications, total, unreadCount] =
    await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.notification.count({
        where,
      }),

      prisma.notification.count({
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

/* =========================================================
   GET NOTIFICATION BY ID
========================================================= */

export const getNotificationById = async (
  notificationId: string,
  userId: string
) => {
  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });
};

/* =========================================================
   MARK ONE NOTIFICATION AS READ
========================================================= */

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
) => {
  const notification = await prisma.notification.findFirst({
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

  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
========================================================= */

export const markAllNotificationsAsRead = async (
  userId: string
) => {
  const result = await prisma.notification.updateMany({
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

/* =========================================================
   DELETE NOTIFICATION
========================================================= */

export const deleteNotification = async (
  notificationId: string,
  userId: string
) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });
};

/* =========================================================
   CREATE MULTIPLE NOTIFICATIONS
========================================================= */

export const createNotifications = async (
  data: CreateNotificationsInput,
  db: DbClient = prisma
) => {
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
      notificationType:
        data.notificationType ?? NotificationType.INFO,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
    })),
  });
};

/* =========================================================
   NOTIFY USERS BY ROLES
========================================================= */

export const notifyUsersByRoles = async (
  roles: string[],
  data: Omit<CreateNotificationsInput, "userIds">,
  db: DbClient = prisma
) => {
  if (roles.length === 0) {
    return {
      count: 0,
    };
  }

  const users = await db.user.findMany({
    where: {
      status: "ACTIVE",
      roles: {
        some: {
          role: {
            name: {
              in: roles,
            },
          },
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

  return createNotifications(
    {
      ...data,
      userIds,
    },
    db
  );
};

/* =========================================================
   NOTIFY SPECIFIC USER
========================================================= */

export const notifyUser = async (
  userId: string,
  data: Omit<CreateNotificationInput, "userId">,
  db: DbClient = prisma
) => {
  return createNotification(
    {
      ...data,
      userId,
    },
    db
  );
};

/* =========================================================
   NOTIFY PROJECT MANAGER
========================================================= */

export const notifyProjectManager = async (
  projectId: string,
  data: Omit<CreateNotificationInput, "userId">,
  db: DbClient = prisma
) => {
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
    return { count: 0 };
  }

  return notifyUser(
    project.projectManagerId,
    data,
    db
  );
};