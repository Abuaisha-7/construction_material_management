import { api } from "./api";

export interface BackendNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType:
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "ERROR"
    | "APPROVAL"
    | "INVENTORY"
    | "MATERIAL"
    | "PROCUREMENT"
    | "INSPECTION";
  referenceType?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface BackendNotificationResponse {
  success: boolean;
  notifications: BackendNotification[];
  unreadCount: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UINotification {
  id: string;
  title: string;
  description: string;
  category: "alert" | "approval" | "delivery" | "qc";
  workspace: "overview" | "req" | "quality" | "inventory";
  read: boolean;
  timestamp: string;
  rawType?: string;
  referenceType?: string | null;
  referenceId?: string | null;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 30) return "just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} wk ago`;

  return date.toLocaleDateString();
}

export function mapBackendNotificationToUI(b: BackendNotification): UINotification {
  const type = b.notificationType;
  const refType = (b.referenceType || "").toUpperCase();
  const titleLower = b.title.toLowerCase();

  let category: UINotification["category"] = "alert";
  if (
    type === "APPROVAL" ||
    refType.includes("APPROVAL") ||
    titleLower.includes("approval") ||
    titleLower.includes("pending")
  ) {
    category = "approval";
  } else if (
    type === "INSPECTION" ||
    refType.includes("INSPECTION") ||
    refType.includes("QUARANTINE") ||
    titleLower.includes("qc") ||
    titleLower.includes("inspection") ||
    titleLower.includes("quarantine") ||
    titleLower.includes("test")
  ) {
    category = "qc";
  } else if (
    type === "PROCUREMENT" ||
    refType.includes("PO") ||
    refType.includes("GRN") ||
    refType.includes("PURCHASE") ||
    titleLower.includes("delivery") ||
    titleLower.includes("arrived") ||
    titleLower.includes("supplier") ||
    titleLower.includes("po-") ||
    titleLower.includes("grn-")
  ) {
    category = "delivery";
  } else if (
    type === "WARNING" ||
    type === "ERROR" ||
    type === "INVENTORY" ||
    titleLower.includes("stock") ||
    titleLower.includes("critical") ||
    titleLower.includes("reorder") ||
    titleLower.includes("wastage") ||
    titleLower.includes("adjustment")
  ) {
    category = "alert";
  }

  let workspace: UINotification["workspace"] = "overview";
  if (
    category === "approval" ||
    refType.includes("REQUEST") ||
    refType.includes("REQUISITION") ||
    titleLower.includes("requisition") ||
    titleLower.includes("mr-")
  ) {
    workspace = "req";
  } else if (
    category === "qc" ||
    refType.includes("INSPECTION") ||
    refType.includes("QUARANTINE") ||
    titleLower.includes("test") ||
    titleLower.includes("inspection") ||
    titleLower.includes("quarantine")
  ) {
    workspace = "quality";
  } else if (category === "delivery" && (refType.includes("PO") || refType.includes("PURCHASE"))) {
    workspace = "req";
  } else if (category === "delivery") {
    workspace = "quality";
  } else if (
    category === "alert" ||
    refType.includes("STOCK") ||
    refType.includes("INVENTORY") ||
    refType.includes("WASTAGE") ||
    refType.includes("ADJUSTMENT")
  ) {
    workspace = "inventory";
  }

  return {
    id: b.id,
    title: b.title,
    description: b.message,
    category,
    workspace,
    read: b.isRead,
    timestamp: formatRelativeTime(b.createdAt),
    rawType: b.notificationType,
    referenceType: b.referenceType,
    referenceId: b.referenceId,
  };
}

export const notificationService = {
  async getNotifications(params?: {
    isRead?: boolean;
    notificationType?: string;
    page?: number;
    limit?: number;
  }): Promise<BackendNotificationResponse> {
    const query = new URLSearchParams();
    if (params?.isRead !== undefined) query.set("isRead", String(params.isRead));
    if (params?.notificationType) query.set("notificationType", params.notificationType);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/notifications${qs ? `?${qs}` : ""}`;
    return api.get<BackendNotificationResponse>(endpoint);
  },

  async markAsRead(notificationId: string) {
    return api.patch<{ success: boolean; message: string; data: BackendNotification }>(
      `/api/notifications/${notificationId}/read`
    );
  },

  async markAllAsRead() {
    return api.patch<{ success: boolean; message: string; data: { count: number } }>(
      "/api/notifications/read-all"
    );
  },

  async deleteNotification(notificationId: string) {
    return api.delete<{ success: boolean; message: string }>(
      `/api/notifications/${notificationId}`
    );
  },

  async clearAllNotifications() {
    return api.delete<{ success: boolean; message: string; data?: { count: number } }>(
      "/api/notifications/clear-all"
    );
  },
};
