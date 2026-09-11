export type UserRole =
  | "Project Manager"
  | "Site Engineer"
  | "Storekeeper"
  | "QA/QC Inspector"
  | "Procurement Officer"
  | "Finance Officer";

export const ROLES: UserRole[] = [
  "Project Manager",
  "Site Engineer",
  "Storekeeper",
  "QA/QC Inspector",
  "Procurement Officer",
  "Finance Officer",
];

export type WorkPackage =
  | "Substructure"
  | "Superstructure"
  | "Masonry"
  | "Fencing & Gate"
  | "Store Building"
  | "Finishing";

export const WORK_PACKAGES: WorkPackage[] = [
  "Substructure",
  "Superstructure",
  "Masonry",
  "Fencing & Gate",
  "Store Building",
  "Finishing",
];

export type BinZone = "Store A" | "Yard" | "Rebar Rack" | "Secure Cage" | "Hazardous";

export const BIN_ZONES: BinZone[] = [
  "Store A",
  "Yard",
  "Rebar Rack",
  "Secure Cage",
  "Hazardous",
];

export interface Material {
  id: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  unitPrice: number; // ETB per unit
  binZone: BinZone;
  minStock: number;
  reorderPoint: number;
}

export type RequisitionStatus =
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

export interface Requisition {
  id: string;
  ref: string;
  requestedBy: string;
  workPackage: WorkPackage;
  date: string;
  requiredDate?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  purpose?: string;
  remarks?: string;
  items: {
    materialId: string;
    qty: number;
    needDate: string;
    unitPrice?: number;
    name?: string;
    unit?: string;
    remarks?: string;
  }[];
  status: RequisitionStatus;
  approvalTrace: string[];
  siteEngSigned: boolean;
  pmSigned: boolean;
  estimatedTotal: number;
}

export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "FULLY_RECEIVED"
  | "CANCELLED"
  | "CLOSED";

export interface PurchaseOrderItem {
  materialId: string;
  qty: number;
  unitPrice: number;
  receivedQty?: number;
  name?: string;
  unit?: string;
  unitId?: string;
}

export interface PurchaseOrder {
  id: string;
  ref: string;
  requisitionRef: string;
  projectId?: string;
  materialRequestId?: string | null;
  supplierId?: string;
  supplier: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  date: string;
  expectedDeliveryDate?: string | null;
  deliveryTerms: string;
  remarks?: string | null;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  subtotal?: number;
  taxAmount?: number;
  total: number;
  currency?: string;
}

export interface Supplier {
  id: string;
  supplierCode: string;
  companyName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  rating?: number | null;
  isActive?: boolean;
}

export type GrnStatus =
  | "DRAFT"
  | "AWAITING_INSPECTION"
  | "PARTIALLY_ACCEPTED"
  | "ACCEPTED"
  | "REJECTED"
  | "POSTED"
  | "CANCELLED";

export interface GRNItem {
  materialId: string;
  name?: string;
  unit?: string;
  orderedQty?: number;
  deliveredQty: number;
  damagedQty?: number;
  rejectedQty?: number;
  acceptedQty?: number;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  remarks?: string;
}

export interface GRN {
  id: string;
  ref: string;
  poRef?: string;
  supplier: string;
  projectId?: string;
  supplierId?: string;
  purchaseOrderId?: string;
  date: string;
  waybill?: string;
  truckPlate?: string;
  driverName?: string;
  receivedBy?: string;
  remarks?: string;
  items: GRNItem[];
  status: GrnStatus;
  poItems?: { materialId: string; orderedQuantity: number; unitPrice: number }[];
}

export type InspectionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type InspectionDecision = "ACCEPTED" | "CONDITIONALLY_ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED" | "QUARANTINED";

export interface InspectionItemDetail {
  id: string;
  grnItemId: string;
  materialId?: string;
  materialName?: string;
  materialCode?: string;
  unit?: string;
  deliveredQuantity?: number;
  quantityInspected?: number;
  quantityAccepted: number;
  quantityConditionallyAccepted: number;
  quantityQuarantined: number;
  quantityRejected: number;
  specification?: string;
  requiredStandard?: string;
  certificateNumber?: string;
  testRequired: boolean;
  testResult?: string;
  remarks?: string;
}

export interface QCInspection {
  id: string;
  ref: string;
  grnRef: string;
  grnId?: string;
  materialId: string;
  materialName: string;
  batch: string;
  testDate: string;
  tests: { id: string; name: string; value: string; standard: string; pass: boolean }[];
  status: "Pending Inspection" | "In Progress" | "Approved for Use" | "Quarantined" | "Rejected";
  inspector: string;
  inspectorId?: string;
  note: string;
  decision?: InspectionDecision | null;
  correctiveAction?: string;
  supplier?: string;
  poRef?: string;
  inspectionItems?: InspectionItemDetail[];
}

export interface InventoryItem {
  materialId: string;
  quantity: number;
  reserved: number;
  lastUpdated: string;
  onOrder: number;
}

export interface IssueVoucher {
  id: string;
  ref: string;
  date: string;
  workPackage: WorkPackage;
  taskCode: string;
  gang: string;
  items: { materialId: string; qty: number; binZone: BinZone }[];
  issuedBy: string;
  receivedBy: string;
}

export interface ReturnVoucher {
  id: string;
  ref: string;
  date: string;
  workPackage: WorkPackage;
  items: { materialId: string; qty: number; reason: string }[];
  approvedBy: string;
}

export interface WastageRecord {
  id: string;
  materialId: string;
  materialName: string;
  workPackage: WorkPackage;
  boqUsed: number;
  actualUsed: number;
  unit: string;
  unitPrice: number;
  allowancePct: number;
}

export interface ActivityLog {
  id: string;
  ts: string;
  role: UserRole;
  actor: string;
  action: string;
  ref: string;
}

export interface ProjectMeta {
  name: string;
  ref: string;
  location: string;
  client: string;
  budget: number;
  started: string;
  targetDate: string;
  progressPct: number;
}

export interface AppState {
  requisitions: Requisition[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  inspections: QCInspection[];
  inventory: InventoryItem[];
  issues: IssueVoucher[];
  returns: ReturnVoucher[];
  wastage: WastageRecord[];
  logs: ActivityLog[];
}

export const PROJECT: ProjectMeta = {
  name: "Office with Store and Fence Work",
  ref: "ET-SOM-JIG-2025-04",
  location: "Jigjiga, Somali Region, Ethiopia",
  client: "Regional Infrastructure Bureau",
  budget: 24850000,
  started: "2024-11-03",
  targetDate: "2025-12-18",
  progressPct: 42,
};

export function etb(n: number): string {
  return "ETB " + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function etb2(n: number): string {
  return "ETB " + n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtQty(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}