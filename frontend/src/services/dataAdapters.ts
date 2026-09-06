import type {
  BinZone,
  GRN,
  InventoryItem,
  IssueVoucher,
  Material,
  ProjectMeta,
  PurchaseOrder,
  QCInspection,
  Requisition,
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
  const unitPrice = Number(m.currentUnitPrice || m.estimatedUnitPrice || 0);

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
  const statusMap: Record<string, Requisition["status"]> = {
    DRAFT: "Draft",
    SUBMITTED: "Pending",
    UNDER_REVIEW: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Rejected",
  };

  const isApproved = r.status === "APPROVED";
  const items = (r.items || []).map((item) => {
    const qty = Number(item.requestedQuantity || 0);
    const needDate = r.requiredDate ? r.requiredDate.slice(0, 10) : r.requestDate.slice(0, 10);
    return {
      materialId: item.materialId,
      qty,
      needDate,
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
    status: statusMap[r.status] || "Draft",
    approvalTrace: isApproved
      ? ["Site Eng: approved", "PM: approved"]
      : r.status === "SUBMITTED"
      ? ["Site Eng: submitted, pending PM approval"]
      : [],
    siteEngSigned: Boolean(r.requestedBy),
    pmSigned: isApproved,
    estimatedTotal: Math.round(estimatedTotal),
    items,
  };
}

export function adaptPurchaseOrder(po: BackendPurchaseOrder): PurchaseOrder {
  const statusMap: Record<string, PurchaseOrder["status"]> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Issued",
    APPROVED: "Issued",
    PARTIALLY_RECEIVED: "Shipped",
    FULLY_RECEIVED: "Delivered",
    CLOSED: "Closed",
    CANCELLED: "Cancelled",
  };

  const items = (po.items || []).map((item) => ({
    materialId: item.materialId,
    qty: Number(item.orderedQuantity || 0),
    unitPrice: Number(item.unitPrice || 0),
  }));

  const total = Number(po.totalAmount || 0);

  return {
    id: po.id,
    ref: po.purchaseOrderNumber,
    requisitionRef: po.materialRequestId ? `REQ-${po.materialRequestId.slice(0, 8)}` : "Direct PO",
    supplier: po.supplier?.companyName || "Approved Supplier",
    date: po.orderDate ? po.orderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    items,
    status: statusMap[po.status] || "Draft",
    deliveryTerms: po.remarks || "Standard site delivery (FOB)",
    total: Math.round(total),
  };
}

export function adaptGrn(g: BackendGrn): GRN {
  const statusMap: Record<string, GRN["status"]> = {
    DRAFT: "Logged",
    SUBMITTED: "Pending QC",
    INSPECTED: "Pending QC",
    CONFIRMED: "Completed",
    REJECTED: "Logged",
  };

  const items = (g.items || []).map((item) => {
    const damaged = Number(item.damagedQuantity || 0);
    const rejected = Number(item.rejectedQuantity || 0);
    let condition: "Good" | "Damaged" | "Short" = "Good";
    if (damaged > 0 || rejected > 0) {
      condition = "Damaged";
    }

    return {
      materialId: item.materialId,
      qty: Number(item.acceptedQuantity || item.deliveredQuantity || 0),
      condition,
    };
  });

  return {
    id: g.id,
    ref: g.grnNumber,
    poRef: g.purchaseOrder?.purchaseOrderNumber || "PO-REF",
    supplier: g.supplier?.companyName || "Vendor",
    date: g.receivedDate ? g.receivedDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    waybill: g.deliveryNoteNumber || "WB-PENDING",
    truckPlate: g.truckNumber || "TRUCK-01",
    items,
    status: statusMap[g.status] || "Logged",
    receivedBy: g.receiver?.fullName || "Storekeeper",
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
