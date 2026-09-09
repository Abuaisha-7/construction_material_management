import { api, type ApiResponse } from "./api";
import type { BackendMaterial, BackendUnit } from "./material.service";
import type { BackendPurchaseOrder, BackendSupplier } from "./purchaseOrder.service";
import type { GrnStatus } from "../types";

export interface BackendGrnItem {
  id: string;
  grnId: string;
  materialId: string;
  orderedQuantity?: string | number | null;
  deliveredQuantity: string | number;
  damagedQuantity: string | number;
  rejectedQuantity: string | number;
  acceptedQuantity: string | number;
  unitId: string;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  storageLocationId?: string | null;
  remarks?: string | null;
  material?: BackendMaterial;
  unit?: BackendUnit;
  storageLocation?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface BackendGrn {
  id: string;
  grnNumber: string;
  projectId: string;
  supplierId: string;
  purchaseOrderId?: string | null;
  deliveryDate: string;
  deliveryNoteNumber?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  status: GrnStatus;
  receivedBy?: string | null;
  remarks?: string | null;
  createdAt: string;
  project?: {
    id: string;
    projectCode: string;
    name: string;
  };
  supplier?: BackendSupplier;
  purchaseOrder?: BackendPurchaseOrder;
  receiver?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  items: BackendGrnItem[];
}

export const grnService = {
  async getGrns() {
    const res = await api.get<ApiResponse<BackendGrn[]>>("/api/grns");
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
    deliveryDate: string;
    deliveryNoteNumber?: string;
    vehicleNumber?: string;
    driverName?: string;
    remarks?: string;
    items: {
      materialId: string;
      deliveredQuantity: number;
      damagedQuantity?: number;
      rejectedQuantity?: number;
      unitId: string;
      batchNumber?: string;
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

  async rejectGrn(id: string, reason: string) {
    const res = await api.post<ApiResponse<BackendGrn>>(`/api/grns/${id}/reject`, { reason });
    return res.data;
  },
};