import { api, type ApiResponse } from "./api";
import type { BackendMaterial, BackendUnit } from "./material.service";

export interface BackendInspectionItem {
  id: string;
  inspectionId: string;
  grnItemId: string;
  quantityInspected?: string | number | null;
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
  grnItem?: {
    id: string;
    materialId: string;
    deliveredQuantity: string | number;
    damagedQuantity: string | number;
    rejectedQuantity: string | number;
    acceptedQuantity: string | number;
    unitId: string;
    batchNumber?: string | null;
    storageLocationId?: string | null;
    remarks?: string | null;
    material?: BackendMaterial;
    unit?: BackendUnit;
    storageLocation?: {
      id: string;
      code: string;
      name: string;
    } | null;
  };
}

export interface BackendInspection {
  id: string;
  inspectionNumber: string;
  grnId: string;
  inspectorId: string;
  inspectionDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  decision?: "ACCEPTED" | "REJECTED" | "CONDITIONALLY_ACCEPTED" | "PARTIALLY_ACCEPTED" | "QUARANTINED" | null;
  remarks?: string | null;
  correctiveAction?: string | null;
  createdAt: string;
  grn?: {
    id: string;
    grnNumber: string;
    projectId?: string;
    supplierId?: string;
    deliveryDate?: string;
    status?: string;
    supplier?: {
      id: string;
      companyName: string;
      contactPerson?: string | null;
      phone?: string | null;
    };
    project?: {
      id: string;
      projectCode: string;
      name: string;
    };
    purchaseOrder?: {
      id: string;
      purchaseOrderNumber: string;
    };
    items?: {
      id: string;
      materialId: string;
      deliveredQuantity: string | number;
      unitId: string;
      material?: BackendMaterial;
      unit?: BackendUnit;
    }[];
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
    decision?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.grnId) query.set("grnId", params.grnId);
    if (params?.status) query.set("status", params.status);
    if (params?.decision) query.set("decision", params.decision);
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
      quantityConditionallyAccepted?: number;
      quantityQuarantined?: number;
      quantityRejected?: number;
      specification?: string;
      requiredStandard?: string;
      certificateNumber?: string;
      testRequired?: boolean;
      testResult?: string;
      remarks?: string;
    }[];
  }) {
    const res = await api.post<ApiResponse<BackendInspection>>("/api/inspections", payload);
    return res.data;
  },

  async updateInspection(id: string, payload: {
    inspectionDate?: string;
    remarks?: string;
    correctiveAction?: string;
  }) {
    const res = await api.patch<ApiResponse<BackendInspection>>(`/api/inspections/${id}`, payload);
    return res.data;
  },

  async startInspection(id: string) {
    const res = await api.post<ApiResponse<BackendInspection>>(`/api/inspections/${id}/start`);
    return res.data;
  },

  async completeInspection(id: string, payload: {
    decision: "ACCEPTED" | "REJECTED" | "CONDITIONALLY_ACCEPTED" | "PARTIALLY_ACCEPTED" | "QUARANTINED";
    remarks?: string;
    correctiveAction?: string;
  }) {
    const res = await api.post<ApiResponse<BackendInspection>>(`/api/inspections/${id}/complete`, payload);
    return res.data;
  },
};
