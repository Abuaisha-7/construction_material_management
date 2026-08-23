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

export interface Requisition {
  id: string;
  ref: string;
  requestedBy: string;
  workPackage: WorkPackage;
  date: string;
  items: { materialId: string; qty: number; needDate: string }[];
  status: "Draft" | "Pending" | "Approved" | "Rejected";
  approvalTrace: string[];
  siteEngSigned: boolean;
  pmSigned: boolean;
  estimatedTotal: number;
}

export interface PurchaseOrder {
  id: string;
  ref: string;
  requisitionRef: string;
  supplier: string;
  date: string;
  items: { materialId: string; qty: number; unitPrice: number }[];
  status: "Draft" | "Issued" | "Shipped" | "Delivered" | "Closed";
  deliveryTerms: string;
  total: number;
}

export interface GRN {
  id: string;
  ref: string;
  poRef: string;
  supplier: string;
  date: string;
  waybill: string;
  truckPlate: string;
  items: { materialId: string; qty: number; condition: "Good" | "Damaged" | "Short" }[];
  status: "Logged" | "Pending QC" | "Completed";
  receivedBy: string;
}

export interface QCInspection {
  id: string;
  ref: string;
  grnRef: string;
  materialId: string;
  materialName: string;
  batch: string;
  testDate: string;
  tests: { id: string; name: string; value: string; standard: string; pass: boolean }[];
  status: "Pending Inspection" | "Approved for Use" | "Quarantined" | "Rejected";
  inspector: string;
  note: string;
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