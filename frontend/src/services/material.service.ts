import { api, type ApiResponse } from "./api";

export interface BackendMaterial {
  id: string;
  materialCode: string;
  name: string;
  categoryId: string;
  unitId: string;
  specification?: string | null;
  standard?: string | null;
  description?: string | null;
  estimatedUnitPrice?: string | number;
  currentUnitPrice?: string | number;
  minimumStock?: string | number;
  reorderLevel?: string | number;
  maximumStock?: string | number;
  requiresInspection?: boolean;
  requiresCertificate?: boolean;
  isActive?: boolean;
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  unit?: {
    id: string;
    code: string;
    name: string;
    symbol?: string;
  };
}

export interface BackendCategory {
  id: string;
  name: string;
  description?: string;
}

export interface BackendUnit {
  id: string;
  code: string;
  name: string;
  symbol?: string;
}

export const materialService = {
  async getMaterials(params?: {
    search?: string;
    categoryId?: string;
    unitId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.categoryId) query.set("categoryId", params.categoryId);
    if (params?.unitId) query.set("unitId", params.unitId);
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/materials${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<BackendMaterial[]>>(endpoint);
    return res.data;
  },

  async getMaterialById(id: string) {
    const res = await api.get<ApiResponse<BackendMaterial>>(`/api/materials/${id}`);
    return res.data;
  },

  async getCategories() {
    const res = await api.get<ApiResponse<BackendCategory[]>>("/api/material-categories");
    return res.data;
  },

  async getUnits() {
    const res = await api.get<ApiResponse<BackendUnit[]>>("/api/units");
    return res.data;
  },

  async createMaterial(payload: {
    materialCode: string;
    name: string;
    categoryId: string;
    unitId: string;
    specification?: string;
    description?: string;
    estimatedUnitPrice?: number;
    minimumStock?: number;
    reorderLevel?: number;
    maximumStock?: number;
    requiresInspection?: boolean;
  }) {
    const res = await api.post<ApiResponse<BackendMaterial>>("/api/materials", payload);
    return res.data;
  },
};
