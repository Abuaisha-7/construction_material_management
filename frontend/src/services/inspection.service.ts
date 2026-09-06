import { api, type ApiResponse } from "./api";
import type { BackendMaterial } from "./material.service";

export interface BackendInspectionItem {
  id: string;
  inspectionId: string;
  grnItemId: string;
  quantityInspected?: string | number;
  quantityAccepted: string | number;
  quantityConditionallyAccepted?: string | number;
  quantityQuarantined?: string | number;
  quantityRejected?: string | number;
  specification?: string | null;
  requiredStandard?: string | null;
  certificateNumber?: string | null;
  testRequired: boolean;
  testResult?: string | null;
  remarks?: string | null;
  materialId?: string | null;
  material?: BackendMaterial;
}

export interface BackendInspection {
  id: string;
  inspectionNumber: string;
  grnId: string;
  inspectorId: string;
  inspectionDate: string;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  overallResult?: "ACCEPTED" | "REJECTED" | "CONDITIONALLY_ACCEPTED" | "QUARANTINED" | null;
  remarks?: string | null;
  correctiveAction?: string | null;
  createdAt: string;
  grn?: {
    id: string;
    grnNumber: string;
    projectId?: string;
  };
  inspector?: {
    id: string;
    fullName: string;
    email: string;
  };
  items: BackendInspectionItem[];
}

export const inspectionService = {
  async getInspections(params?: {
    grnId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.grnId) query.set("grnId", params.grnId);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/inspections${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<BackendInspection[]>>(endpoint);
    return res.data;
  },

  async getInspectionById(id: string) {
    const res = await api.get<ApiResponse<BackendInspection>>(`/api/inspections/${id}`);
    return res.data;
  },

  async createInspection(payload: {
    grnId: string;
    inspectionDate?: string;
    remarks?: string;
    correctiveAction?: string;
    items: {
      grnItemId: string;
      materialId?: string;
      quantityInspected?: number;
      quantityAccepted?: number;
      quantityQuarantined?: number;
      quantityRejected?: number;
      specification?: string;
      requiredStandard?: string;
      testResult?: string;
      remarks?: string;
    }[];
  }) {
    const res = await api.post<ApiResponse<BackendInspection>>("/api/inspections", payload);
    return res.data;
  },

  async startInspection(id: string) {
    const res = await api.post<ApiResponse<BackendInspection>>(`/api/inspections/${id}/start`);
    return res.data;
  },

  async completeInspection(id: string, payload: {
    overallResult: "ACCEPTED" | "REJECTED" | "CONDITIONALLY_ACCEPTED" | "QUARANTINED";
    remarks?: string;
    correctiveAction?: string;
  }) {
    const res = await api.post<ApiResponse<BackendInspection>>(`/api/inspections/${id}/complete`, payload);
    return res.data;
  },
};
