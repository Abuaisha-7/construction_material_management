import { api, type ApiResponse } from "./api";
import type { BackendMaterial } from "./material.service";

export interface BackendRequestItem {
  id: string;
  requestId: string;
  materialId: string;
  requestedQuantity: string | number;
  approvedQuantity?: string | number | null;
  suppliedQuantity?: string | number | null;
  issuedQuantity?: string | number | null;
  estimatedUnitPrice?: string | number | null;
  remarks?: string | null;
  material?: BackendMaterial;
}

export interface BackendMaterialRequest {
  id: string;
  requestNumber: string;
  projectId: string;
  requestedBy: string;
  buildingId?: string | null;
  zoneId?: string | null;
  activityId?: string | null;
  requestDate: string;
  requiredDate?: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  purpose?: string | null;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "RETURNED"
    | "APPROVED"
    | "PARTIALLY_APPROVED"
    | "REJECTED"
    | "PARTIALLY_SUPPLIED"
    | "FULLY_SUPPLIED"
    | "COMPLETED"
    | "CANCELLED";
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    projectCode: string;
    name: string;
  };
  requester?: {
    id: string;
    fullName: string;
    email: string;
  };
  items: BackendRequestItem[];
}

export const requisitionService = {
  async getRequisitions(params?: {
    projectId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.projectId) query.set("projectId", params.projectId);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/material-requests${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<BackendMaterialRequest[]>>(endpoint);
    return res.data;
  },

  async getRequisitionById(id: string) {
    const res = await api.get<ApiResponse<BackendMaterialRequest>>(`/api/material-requests/${id}`);
    return res.data;
  },

  async createRequisition(payload: {
    projectId: string;
    requiredDate?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    purpose?: string;
    remarks?: string;
    items: {
      materialId: string;
      requestedQuantity: number;
      estimatedUnitPrice?: number;
      remarks?: string;
    }[];
  }) {
    const res = await api.post<ApiResponse<BackendMaterialRequest>>("/api/material-requests", payload);
    return res.data;
  },

  async submitRequisition(id: string) {
    const res = await api.post<ApiResponse<BackendMaterialRequest>>(`/api/material-requests/${id}/submit`);
    return res.data;
  },

  async startRequisitionReview(id: string) {
    const res = await api.post<ApiResponse<BackendMaterialRequest>>(`/api/material-requests/${id}/review`);
    return res.data;
  },

  async approveRequisition(id: string, comments?: string) {
    const res = await api.post<ApiResponse<BackendMaterialRequest>>(`/api/material-requests/${id}/approve`, {
      comments,
    });
    return res.data;
  },

  async rejectRequisition(id: string, reason: string) {
    const res = await api.post<ApiResponse<BackendMaterialRequest>>(`/api/material-requests/${id}/reject`, {
      reason,
    });
    return res.data;
  },

  async cancelRequisition(id: string) {
    const res = await api.post<ApiResponse<BackendMaterialRequest>>(`/api/material-requests/${id}/cancel`);
    return res.data;
  },
};
