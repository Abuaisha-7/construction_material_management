import type {
  BinZone,
  GRN,
  InventoryItem,
  IssueVoucher,
  Material,
  ProjectMeta,
  PurchaseOrder,
  PurchaseOrderItem,
  QCInspection,
  Requisition,
  Supplier,
  WorkPackage,
} from "../types";
import type { BackendMaterial } from "./material.service";
import type { BackendProject } from "./project.service";
import type { BackendMaterialRequest } from "./requisition.service";
import type { BackendPurchaseOrder } from "./purchaseOrder.service";
import type { BackendGrn } from "./grn.service";
import type { BackendInspection } from "./inspection.service";
import type {
  BackendInventoryBalance,
  BackendMaterialIssue,
} from "./inventory.service";

function determineBinZone(catName?: string, matName?: string): BinZone {
  const c = (catName || "").toLowerCase();
  const m = (matName || "").toLowerCase();

  if (c.includes("rebar") || m.includes("rebar") || m.includes("steel")) {
    return "Rebar Rack";
  }
  if (
    c.includes("aggregate") ||
    c.includes("sand") ||
    c.includes("block") ||
    c.includes("brick") ||
    m.includes("sand") ||
    m.includes("aggregate") ||
    m.includes("block")
  ) {
    return "Yard";
  }
  if (
    c.includes("hardware") ||
    c.includes("electrical") ||
    c.includes("fastener") ||
    c.includes("fencing") ||
    m.includes("bolt") ||
    m.includes("conduit") ||
    m.includes("wire")
  ) {
    return "Secure Cage";
  }
  if (c.includes("fuel") || c.includes("paint") || c.includes("hazardous")) {
    return "Hazardous";
  }
  return "Store A";
}

export function adaptMaterial(m: BackendMaterial): Material {
  const categoryName = m.category?.name || "General";
  const unitSymbol = m.unit?.symbol || m.unit?.code || "unit";
  const currentPrice = Number(m.currentUnitPrice ?? 0);
  const estimatedPrice = Number(m.estimatedUnitPrice ?? 0);
  const unitPrice = !isNaN(currentPrice) && currentPrice > 0 ? currentPrice : estimatedPrice;

  return {
    id: m.id,
    name: m.name,
    category: categoryName,
    spec: m.specification || m.description || m.materialCode,
    unit: unitSymbol,
    unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
    binZone: determineBinZone(categoryName, m.name),
    minStock: Number(m.minimumStock || 0),
    reorderPoint: Number(m.reorderLevel || 0),
  };
}

export function adaptProject(p: BackendProject): ProjectMeta {
  const contractVal = Number(p.contractValue || 0);
  return {
    name: p.name || "Main Construction Project",
    ref: p.projectCode || "PRJ-001",
    location: p.location || "Ethiopia",
    client: p.clientName || "Project Client",
    budget: isNaN(contractVal) || contractVal === 0 ? 25000000 : contractVal,
    started: p.startDate ? p.startDate.slice(0, 10) : "2025-01-01",
    targetDate: p.completionDate ? p.completionDate.slice(0, 10) : "2026-12-31",
    progressPct: p.status === "COMPLETED" ? 100 : 45,
  };
}

export function adaptRequisition(r: BackendMaterialRequest): Requisition {
  const items = (r.items || []).map((item) => {
    const qty = Number(item.requestedQuantity || 0);
    const needDate = r.requiredDate ? r.requiredDate.slice(0, 10) : r.requestDate.slice(0, 10);
    const material = item.material;
    return {
      materialId: item.materialId,
      qty,
      needDate,
      name: material?.name,
      unit: material?.unit?.symbol ?? material?.unit?.code,
      unitPrice: item.estimatedUnitPrice != null ? Number(item.estimatedUnitPrice) : undefined,
      remarks: item.remarks ?? undefined,
    };
  });

  const estimatedTotal = (r.items || []).reduce((sum, item) => {
    const qty = Number(item.requestedQuantity || 0);
    const price = Number(item.estimatedUnitPrice || 0);
    return sum + qty * price;
  }, 0);

  return {
    id: r.id,
    ref: r.requestNumber,
    requestedBy: r.requester?.fullName || "Site Team",
    workPackage: "Superstructure" as WorkPackage,
    date: r.requestDate ? r.requestDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    requiredDate: r.requiredDate ? r.requiredDate.slice(0, 10) : undefined,
    priority: r.priority,
    purpose: r.purpose ?? undefined,
    remarks: r.remarks ?? undefined,
    status: r.status as Requisition["status"],
    approvalTrace: [],
    siteEngSigned: false,
    pmSigned: r.status === "APPROVED",
    estimatedTotal: Math.round(estimatedTotal),
    items,
  };
}

export function adaptPurchaseOrder(po: BackendPurchaseOrder): PurchaseOrder {
  const items: PurchaseOrderItem[] = (po.items || []).map((item) => ({
    materialId: item.materialId,
    qty: Number(item.orderedQuantity || 0),
    unitPrice: Number(item.unitPrice || 0),
    receivedQty:
      item.receivedQuantity != null
        ? Number(item.receivedQuantity)
        : item.deliveredQuantity != null
        ? Number(item.deliveredQuantity)
        : undefined,
    name: item.material?.name,
    unit: (item.material as { unit?: { name?: string } } | undefined)?.unit?.name,
    unitId: (item.material as { unitId?: string } | undefined)?.unitId,
  }));

  const supplier = po.supplier;

  return {
    id: po.id,
    ref: po.purchaseOrderNumber,
    requisitionRef: po.materialRequestId ? `REQ-${po.materialRequestId.slice(0, 8)}` : "Direct PO",
    materialRequestId: po.materialRequestId,
    projectId: po.projectId,
    supplierId: po.supplierId,
    supplier: supplier?.companyName || "Unassigned supplier",
    contactPerson: supplier?.contactPerson,
    phone: supplier?.phone,
    email: supplier?.email,
    address: supplier?.address,
    date: po.orderDate ? po.orderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: po.expectedDeliveryDate ? po.expectedDeliveryDate.slice(0, 10) : null,
    deliveryTerms: po.remarks || "Standard site delivery",
    remarks: po.remarks,
    items,
    status: po.status,
    subtotal: Number(po.subtotal || 0),
    taxAmount: Number(po.taxAmount || 0),
    total: Math.round(Number(po.totalAmount || 0)),
    currency: po.currency || "ETB",
  };
}

export function adaptSupplier(s: {
  id: string;
  supplierCode: string;
  companyName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  rating?: string | number | null;
  isActive?: boolean;
}): Supplier {
  return {
    id: s.id,
    supplierCode: s.supplierCode,
    companyName: s.companyName,
    contactPerson: s.contactPerson,
    phone: s.phone,
    email: s.email,
    address: s.address,
    rating: s.rating != null ? Number(s.rating) : null,
    isActive: s.isActive,
  };
}

export function adaptGrn(g: BackendGrn): GRN {
  const items: GRN["items"] = (g.items || []).map((item) => ({
    materialId: item.materialId,
    name: item.material?.name,
    unit: item.unit?.symbol || item.unit?.code || item.unit?.name,
    orderedQty:
      item.orderedQuantity != null ? Number(item.orderedQuantity) : undefined,
    deliveredQty: Number(item.deliveredQuantity || 0),
    damagedQty: Number(item.damagedQuantity || 0),
    rejectedQty: Number(item.rejectedQuantity || 0),
    acceptedQty: Number(item.acceptedQuantity || 0),
    batchNumber: item.batchNumber ?? undefined,
    manufacturingDate: item.manufacturingDate
      ? item.manufacturingDate.slice(0, 10)
      : undefined,
    expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : undefined,
    remarks: item.remarks ?? undefined,
  }));

  const poItems = (g.purchaseOrder?.items || []).map((poItem) => ({
    materialId: poItem.materialId,
    orderedQuantity: Number(poItem.orderedQuantity || 0),
    unitPrice: Number(poItem.unitPrice || 0),
  }));

  return {
    id: g.id,
    ref: g.grnNumber,
    poRef: g.purchaseOrder?.purchaseOrderNumber,
    supplier: g.supplier?.companyName || "Vendor",
    projectId: g.projectId,
    supplierId: g.supplierId,
    purchaseOrderId: g.purchaseOrderId ?? undefined,
    date: g.deliveryDate ? g.deliveryDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    waybill: g.deliveryNoteNumber ?? undefined,
    truckPlate: g.vehicleNumber ?? undefined,
    driverName: g.driverName ?? undefined,
    receivedBy: g.receiver?.fullName ?? undefined,
    remarks: g.remarks ?? undefined,
    items,
    status: g.status,
    poItems,
  };
}

export function adaptInspection(ins: BackendInspection): QCInspection {
  const statusMap: Record<string, QCInspection["status"]> = {
    DRAFT: "Pending Inspection",
    IN_PROGRESS: "Pending Inspection",
    COMPLETED:
      ins.overallResult === "ACCEPTED"
        ? "Approved for Use"
        : ins.overallResult === "QUARANTINED"
        ? "Quarantined"
        : ins.overallResult === "CONDITIONALLY_ACCEPTED"
        ? "Approved for Use"
        : "Rejected",
    CANCELLED: "Rejected",
  };

  const firstItem = ins.items?.[0];
  const tests = (ins.items || []).map((item, idx) => ({
    id: item.id || `t-${idx}`,
    name: item.remarks || "Visual & Standard Check",
    value: item.testResult || (Number(item.quantityAccepted || 0) > 0 ? "Complies" : "Pending"),
    standard: item.requiredStandard || "Standard Spec",
    pass: Number(item.quantityRejected || 0) === 0,
  }));

  return {
    id: ins.id,
    ref: ins.inspectionNumber,
    grnRef: ins.grn?.grnNumber || "GRN-REF",
    materialId: firstItem?.materialId || "",
    materialName: firstItem?.material?.name || "Inspected Material",
    batch: firstItem?.certificateNumber || "BATCH-01",
    testDate: ins.inspectionDate ? ins.inspectionDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    tests: tests.length > 0 ? tests : [
      { id: "t1", name: "Specification Compliance", value: "Verified", standard: "ASTM / ES", pass: true },
    ],
    status: statusMap[ins.status] || "Pending Inspection",
    inspector: ins.inspector?.fullName || "QC Inspector",
    note: ins.remarks || ins.correctiveAction || "QC evaluation completed.",
  };
}

export function adaptInventoryBalance(bal: BackendInventoryBalance): InventoryItem {
  return {
    materialId: bal.materialId,
    quantity: Number(bal.physicalQuantity || 0),
    reserved: Number(bal.reservedQuantity || 0),
    lastUpdated: bal.updatedAt ? bal.updatedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    onOrder: 0,
  };
}

export function adaptMaterialIssue(iss: BackendMaterialIssue): IssueVoucher {
  const items = (iss.items || []).map((item) => ({
    materialId: item.materialId,
    qty: Number(item.issuedQuantity || item.approvedQuantity || 0),
    binZone: determineBinZone(item.material?.category?.name, item.material?.name),
  }));

  return {
    id: iss.id,
    ref: iss.issueNumber,
    date: iss.issueDate ? iss.issueDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    workPackage: "Substructure" as WorkPackage,
    taskCode: iss.purpose || "TASK-SITE-GENERAL",
    gang: iss.receiver?.fullName ? `Gang (${iss.receiver.fullName})` : "Site Team",
    items,
    issuedBy: iss.requester?.fullName || "Storekeeper",
    receivedBy: iss.receiver?.fullName || "Site Engineer",
  };
}
