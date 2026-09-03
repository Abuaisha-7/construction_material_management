import {prisma} from "../config/database";
import { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
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

export async function createNotification(
  data: CreateNotificationInput
) {
  const user = await prisma.user.findUnique({
    where: {
      id: data.userId
    },
    select: {
      id: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      notificationType: data.notificationType ?? NotificationType.INFO,
      referenceType: data.referenceType,
      referenceId: data.referenceId
    }
  });
}

export async function getNotifications(
  options: GetNotificationsOptions
) {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const where = {
    userId: options.userId,
    ...(options.isRead !== undefined && {
      isRead: options.isRead
    }),
    ...(options.notificationType && {
      notificationType: options.notificationType
    })
  };

  const [notifications, total, unreadCount] =
    await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),

      prisma.notification.count({
        where
      }),

      prisma.notification.count({
        where: {
          userId: options.userId,
          isRead: false
        }
      })
    ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    unreadCount
  };
}

export async function getNotificationById(
  id: string,
  userId: string
) {
  return prisma.notification.findFirst({
    where: {
      id,
      userId
    }
  });
}

export async function markNotificationAsRead(
  id: string,
  userId: string
) {
  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: {
      id
    },
    data: {
      isRead: true
    }
  });
}

export async function markAllNotificationsAsRead(
  userId: string
) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return {
    updatedCount: result.count
  };
}

export async function deleteNotification(
  id: string,
  userId: string
) {
  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  await prisma.notification.delete({
    where: {
      id
    }
  });

  return {
    message: "Notification deleted successfully"
  };
}