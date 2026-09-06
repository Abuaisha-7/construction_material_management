import { api, type ApiResponse } from "./api";
import type { BackendMaterial } from "./material.service";
import type { BackendSupplier } from "./purchaseOrder.service";

export interface BackendGrnItem {
  id: string;
  grnId: string;
  materialId: string;
  orderedQuantity: string | number;
  deliveredQuantity: string | number;
  acceptedQuantity: string | number;
  damagedQuantity?: string | number;
  rejectedQuantity?: string | number;
  batchNumber?: string | null;
  storageLocationId?: string | null;
  remarks?: string | null;
  material?: BackendMaterial;
  unit?: {
    code: string;
    name: string;
  };
}

export interface BackendGrn {
  id: string;
  grnNumber: string;
  projectId: string;
  supplierId: string;
  purchaseOrderId: string;
  deliveryNoteNumber?: string | null;
  truckNumber?: string | null;
  receivedDate: string;
  status: "DRAFT" | "SUBMITTED" | "INSPECTED" | "CONFIRMED" | "REJECTED";
  remarks?: string | null;
  receivedBy: string;
  createdAt: string;
  project?: {
    id: string;
    projectCode: string;
    name: string;
  };
  supplier?: BackendSupplier;
  purchaseOrder?: {
    id: string;
    purchaseOrderNumber: string;
  };
  receiver?: {
    id: string;
    fullName: string;
    email: string;
  };
  items: BackendGrnItem[];
}

export const grnService = {
  async getGrns(params?: {
    projectId?: string;
    supplierId?: string;
    purchaseOrderId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.projectId) query.set("projectId", params.projectId);
    if (params?.supplierId) query.set("supplierId", params.supplierId);
    if (params?.purchaseOrderId) query.set("purchaseOrderId", params.purchaseOrderId);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/grns${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<BackendGrn[]>>(endpoint);
    return res.data;
  },

  async getGrnById(id: string) {
    const res = await api.get<ApiResponse<BackendGrn>>(`/api/grns/${id}`);
    return res.data;
  },

  async createGrn(payload: {
    projectId: string;
    supplierId: string;
    purchaseOrderId: string;
    deliveryNoteNumber?: string;
    truckNumber?: string;
    receivedDate?: string;
    remarks?: string;
    items: {
      materialId: string;
      orderedQuantity: number;
      deliveredQuantity: number;
      acceptedQuantity: number;
      damagedQuantity?: number;
      rejectedQuantity?: number;
      batchNumber?: string;
      storageLocationId?: string;
      remarks?: string;
    }[];
  }) {
    const res = await api.post<ApiResponse<BackendGrn>>("/api/grns", payload);
    return res.data;
  },

  async confirmGrn(id: string) {
    const res = await api.post<ApiResponse<BackendGrn>>(`/api/grns/${id}/confirm`);
    return res.data;
  },

  async rejectGrn(id: string, reason?: string) {
    const res = await api.post<ApiResponse<BackendGrn>>(`/api/grns/${id}/reject`, { reason });
    return res.data;
  },
};
