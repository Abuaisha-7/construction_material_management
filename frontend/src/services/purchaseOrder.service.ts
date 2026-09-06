import { api, type ApiResponse } from "./api";
import type { BackendMaterial } from "./material.service";

export interface BackendPoItem {
  id: string;
  purchaseOrderId: string;
  materialId: string;
  orderedQuantity: string | number;
  unitPrice: string | number;
  totalPrice: string | number;
  deliveredQuantity?: string | number | null;
  material?: BackendMaterial;
}

export interface BackendSupplier {
  id: string;
  supplierCode: string;
  companyName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  rating?: string | number | null;
}

export interface BackendPurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  projectId: string;
  supplierId: string;
  materialRequestId?: string | null;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "PARTIALLY_RECEIVED"
    | "FULLY_RECEIVED"
    | "CANCELLED"
    | "CLOSED";
  subtotal: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  currency: string;
  remarks?: string | null;
  createdAt: string;
  project?: {
    id: string;
    projectCode: string;
    name: string;
  };
  supplier?: BackendSupplier;
  items: BackendPoItem[];
}

export const purchaseOrderService = {
  async getPurchaseOrders(params?: {
    projectId?: string;
    supplierId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.projectId) query.set("projectId", params.projectId);
    if (params?.supplierId) query.set("supplierId", params.supplierId);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/purchase-orders${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<BackendPurchaseOrder[]>>(endpoint);
    return res.data;
  },

  async getPurchaseOrderById(id: string) {
    const res = await api.get<ApiResponse<BackendPurchaseOrder>>(`/api/purchase-orders/${id}`);
    return res.data;
  },

  async getSuppliers() {
    const res = await api.get<ApiResponse<BackendSupplier[]>>("/api/suppliers");
    return res.data;
  },

  async createPurchaseOrder(payload: {
    projectId: string;
    supplierId: string;
    materialRequestId: string;
    expectedDeliveryDate?: string;
    currency?: string;
    remarks?: string;
    items: {
      materialId: string;
      orderedQuantity: number;
      unitPrice: number;
    }[];
  }) {
    const res = await api.post<ApiResponse<BackendPurchaseOrder>>("/api/purchase-orders", payload);
    return res.data;
  },

  async submitPurchaseOrder(id: string) {
    const res = await api.post<ApiResponse<BackendPurchaseOrder>>(`/api/purchase-orders/${id}/submit`);
    return res.data;
  },

  async approvePurchaseOrder(id: string) {
    const res = await api.post<ApiResponse<BackendPurchaseOrder>>(`/api/purchase-orders/${id}/approve`);
    return res.data;
  },

  async closePurchaseOrder(id: string) {
    const res = await api.post<ApiResponse<BackendPurchaseOrder>>(`/api/purchase-orders/${id}/close`);
    return res.data;
  },

  async cancelPurchaseOrder(id: string) {
    const res = await api.post<ApiResponse<BackendPurchaseOrder>>(`/api/purchase-orders/${id}/cancel`);
    return res.data;
  },
};
