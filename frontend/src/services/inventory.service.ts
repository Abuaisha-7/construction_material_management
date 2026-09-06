import { api, type ApiResponse } from "./api";
import type { BackendMaterial } from "./material.service";
import type { BackendProject } from "./project.service";

export interface BackendWarehouse {
  id: string;
  code: string;
  name: string;
  type?: string | null;
  capacityDescription?: string | null;
  isActive: boolean;
}

export interface BackendStorageLocation {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  locationType?: string | null;
  capacity?: string | number | null;
}

export interface BackendInventoryBalance {
  id: string;
  projectId: string;
  materialId: string;
  warehouseId: string;
  storageLocationId?: string | null;
  physicalQuantity: string | number;
  reservedQuantity: string | number;
  averageUnitCost?: string | number | null;
  stockValue?: string | number | null;
  updatedAt: string;
  material?: BackendMaterial;
  project?: BackendProject;
  warehouse?: BackendWarehouse;
  storageLocation?: BackendStorageLocation;
}

export interface BackendMaterialIssueItem {
  id: string;
  materialIssueId: string;
  materialId: string;
  approvedQuantity: string | number;
  issuedQuantity: string | number;
  unitCost?: string | number;
  totalCost?: string | number;
  storageLocationId?: string | null;
  remarks?: string | null;
  material?: BackendMaterial;
}

export interface BackendMaterialIssue {
  id: string;
  issueNumber: string;
  projectId: string;
  warehouseId: string;
  issueDate: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "ISSUED" | "CANCELLED";
  purpose?: string | null;
  remarks?: string | null;
  requestedBy?: string | null;
  receiverId?: string | null;
  createdAt: string;
  items: BackendMaterialIssueItem[];
  project?: BackendProject;
  warehouse?: BackendWarehouse;
  requester?: {
    id: string;
    fullName: string;
    email: string;
  };
  receiver?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export const inventoryService = {
  async getInventoryBalances(params?: {
    projectId?: string;
    materialId?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.projectId) query.set("projectId", params.projectId);
    if (params?.materialId) query.set("materialId", params.materialId);
    if (params?.warehouseId) query.set("warehouseId", params.warehouseId);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/inventory/balances${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<BackendInventoryBalance[]>>(endpoint);
    return res.data;
  },

  async getInventoryTransactions(params?: {
    projectId?: string;
    materialId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.projectId) query.set("projectId", params.projectId);
    if (params?.materialId) query.set("materialId", params.materialId);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/inventory/transactions${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<any[]>>(endpoint);
    return res.data;
  },

  async getMaterialIssues(params?: {
    projectId?: string;
    warehouseId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.projectId) query.set("projectId", params.projectId);
    if (params?.warehouseId) query.set("warehouseId", params.warehouseId);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/material-issues${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<BackendMaterialIssue[]>>(endpoint);
    return res.data;
  },

  async createMaterialIssue(payload: {
    projectId: string;
    warehouseId: string;
    purpose?: string;
    remarks?: string;
    items: {
      materialId: string;
      approvedQuantity: number;
      issuedQuantity?: number;
      unitCost?: number;
      storageLocationId?: string;
    }[];
  }) {
    const res = await api.post<ApiResponse<BackendMaterialIssue>>("/api/material-issues", payload);
    return res.data;
  },

  async submitMaterialIssue(id: string) {
    const res = await api.post<ApiResponse<BackendMaterialIssue>>(`/api/material-issues/${id}/submit`);
    return res.data;
  },

  async approveMaterialIssue(id: string) {
    const res = await api.post<ApiResponse<BackendMaterialIssue>>(`/api/material-issues/${id}/approve`);
    return res.data;
  },

  async issueMaterial(id: string) {
    const res = await api.post<ApiResponse<BackendMaterialIssue>>(`/api/material-issues/${id}/issue`);
    return res.data;
  },

  async getWarehouses() {
    const res = await api.get<ApiResponse<BackendWarehouse[]>>("/api/warehouses");
    return res.data;
  },

  async getStorageLocations() {
    const res = await api.get<ApiResponse<BackendStorageLocation[]>>("/api/storage-locations");
    return res.data;
  },
};
