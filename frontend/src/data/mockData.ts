import type {
  AppState,
  GRN,
  IssueVoucher,
  InventoryItem,
  Material,
  PurchaseOrder,
  QCInspection,
  Requisition,
  ReturnVoucher,
  WastageRecord,
} from "../types";

export const MATERIALS: Material[] = [
  { id: "M01", name: "PPC Cement 42.5N", category: "Cement", spec: "Mugher / Dangote", unit: "bag", unitPrice: 880, binZone: "Store A", minStock: 400, reorderPoint: 600 },
  { id: "M02", name: "OPC Cement 52.5R", category: "Cement", spec: "Dangote", unit: "bag", unitPrice: 960, binZone: "Store A", minStock: 150, reorderPoint: 250 },
  { id: "M03", name: "Rebar Ø8 Grade 60", category: "Rebar", spec: "Akaki Steel", unit: "ton", unitPrice: 112000, binZone: "Rebar Rack", minStock: 6, reorderPoint: 10 },
  { id: "M04", name: "Rebar Ø12 Grade 60", category: "Rebar", spec: "Akaki Steel", unit: "ton", unitPrice: 110500, binZone: "Rebar Rack", minStock: 8, reorderPoint: 14 },
  { id: "M05", name: "Rebar Ø16 Grade 60", category: "Rebar", spec: "Akaki Steel", unit: "ton", unitPrice: 110500, binZone: "Rebar Rack", minStock: 4, reorderPoint: 8 },
  { id: "M06", name: "Rebar Ø20 Grade 60", category: "Rebar", spec: "Akaki Steel", unit: "ton", unitPrice: 109800, binZone: "Rebar Rack", minStock: 3, reorderPoint: 6 },
  { id: "M07", name: "Rebar Ø24 Grade 60", category: "Rebar", spec: "Akaki Steel", unit: "ton", unitPrice: 109200, binZone: "Rebar Rack", minStock: 2, reorderPoint: 4 },
  { id: "M08", name: "River Sand (Fafan)", category: "Aggregate", spec: "Fafan riverbed, silt<2%", unit: "m3", unitPrice: 1850, binZone: "Yard", minStock: 40, reorderPoint: 70 },
  { id: "M09", name: "Basalt Aggregate 01", category: "Aggregate", spec: "12.5mm crushed", unit: "m3", unitPrice: 2450, binZone: "Yard", minStock: 50, reorderPoint: 80 },
  { id: "M10", name: "Basalt Aggregate 02", category: "Aggregate", spec: "20mm crushed", unit: "m3", unitPrice: 2380, binZone: "Yard", minStock: 45, reorderPoint: 75 },
  { id: "M11", name: "HCB Block 15cm", category: "Masonry", spec: "390x190x150mm", unit: "pc", unitPrice: 34, binZone: "Yard", minStock: 4000, reorderPoint: 6000 },
  { id: "M12", name: "HCB Block 20cm", category: "Masonry", spec: "390x190x200mm", unit: "pc", unitPrice: 41, binZone: "Yard", minStock: 3000, reorderPoint: 5000 },
  { id: "M13", name: "Chain-link Fence Wire", category: "Fencing", spec: "2.5mm galv, 50mm mesh", unit: "roll", unitPrice: 9200, binZone: "Secure Cage", minStock: 8, reorderPoint: 15 },
  { id: "M14", name: "Galvanized CGI Sheet", category: "Roofing", spec: "0.45mm corrugated", unit: "sheet", unitPrice: 420, binZone: "Yard", minStock: 300, reorderPoint: 500 },
  { id: "M15", name: "PVC Conduit 20mm", category: "Electrical", spec: "4m length", unit: "pc", unitPrice: 58, binZone: "Secure Cage", minStock: 200, reorderPoint: 350 },
  { id: "M16", name: "Binding Wire", category: "Rebar", spec: "1.2mm annealed, 20kg coil", unit: "coil", unitPrice: 1900, binZone: "Secure Cage", minStock: 10, reorderPoint: 20 },
  { id: "M17", name: "Timber Formwork", category: "Timber", spec: "1.5m 100x50mm", unit: "pc", unitPrice: 320, binZone: "Yard", minStock: 120, reorderPoint: 220 },
  { id: "M18", name: "Structural Bolts", category: "Fencing", spec: "M16 (galv) with nut", unit: "pc", unitPrice: 12, binZone: "Secure Cage", minStock: 800, reorderPoint: 1400 },
];

const REQS: Requisition[] = [
  {
    id: "R1", ref: "MR-2025-041", requestedBy: "Gr. Taddesse Alemu", workPackage: "Substructure",
    date: "2025-06-02", status: "Approved",
    items: [{ materialId: "M08", qty: 60, needDate: "2025-06-20" }, { materialId: "M09", qty: 55, needDate: "2025-06-20" }, { materialId: "M10", qty: 50, needDate: "2025-06-20" }],
    approvalTrace: ["Site Eng: approved", "PM: approved"], siteEngSigned: true, pmSigned: true, estimatedTotal: 371900,
  },
  {
    id: "R2", ref: "MR-2025-042", requestedBy: "Eng. Hanna Worku", workPackage: "Superstructure",
    date: "2025-06-08", status: "Pending",
    items: [{ materialId: "M01", qty: 320, needDate: "2025-06-25" }, { materialId: "M04", qty: 9, needDate: "2025-06-25" }],
    approvalTrace: ["Site Eng: pending"], siteEngSigned: true, pmSigned: false, estimatedTotal: 1275600,
  },
  {
    id: "R3", ref: "MR-2025-043", requestedBy: "Gr. Mulugeta Bekele", workPackage: "Masonry",
    date: "2025-06-14", status: "Draft",
    items: [{ materialId: "M11", qty: 8000, needDate: "2025-07-02" }, { materialId: "M12", qty: 2500, needDate: "2025-07-02" }, { materialId: "M08", qty: 40, needDate: "2025-07-02" }],
    approvalTrace: [], siteEngSigned: false, pmSigned: false, estimatedTotal: 524900,
  },
  {
    id: "R4", ref: "MR-2025-044", requestedBy: "Eng. Dawit Kebede", workPackage: "Fencing & Gate",
    date: "2025-06-18", status: "Approved",
    items: [{ materialId: "M13", qty: 18, needDate: "2025-07-10" }, { materialId: "M18", qty: 1600, needDate: "2025-07-10" }],
    approvalTrace: ["Site Eng: approved", "PM: approved"], siteEngSigned: true, pmSigned: true, estimatedTotal: 184800,
  },
];

const POS: PurchaseOrder[] = [
  {
    id: "P1", ref: "PO-2025-118", requisitionRef: "MR-2025-041", supplier: "Somali Aggregate Supply",
    date: "2025-06-05", status: "Delivered",
    items: [{ materialId: "M08", qty: 60, unitPrice: 1850 }, { materialId: "M09", qty: 55, unitPrice: 2450 }, { materialId: "M10", qty: 50, unitPrice: 2380 }],
    deliveryTerms: "FOB Jigjiga, 7 days", total: 371900,
  },
  {
    id: "P2", ref: "PO-2025-121", requisitionRef: "MR-2025-042", supplier: "Dangote Cement PLC",
    date: "2025-06-10", status: "Shipped",
    items: [{ materialId: "M01", qty: 320, unitPrice: 880 }, { materialId: "M04", qty: 9, unitPrice: 110500 }],
    deliveryTerms: "CFR site, 14 days", total: 1275600,
  },
  {
    id: "P3", ref: "PO-2025-124", requisitionRef: "MR-2025-044", supplier: "Haramaya Fencing Co.",
    date: "2025-06-20", status: "Issued",
    items: [{ materialId: "M13", qty: 18, unitPrice: 9200 }, { materialId: "M18", qty: 1600, unitPrice: 12 }],
    deliveryTerms: "FOB site yard", total: 184800,
  },
];

const GRNS: GRN[] = [
  {
    id: "G1", ref: "GRN-2025-077", poRef: "PO-2025-118", supplier: "Somali Aggregate Supply",
    date: "2025-06-16", waybill: "WB-88231", truckPlate: "AB 3-88412",
    items: [{ materialId: "M08", qty: 58, condition: "Good" }, { materialId: "M09", qty: 52, condition: "Good" }, { materialId: "M10", qty: 47, condition: "Good" }],
    status: "Pending QC", receivedBy: "Storekeeper A. Hamza",
  },
  {
    id: "G2", ref: "GRN-2025-078", poRef: "PO-2025-118", supplier: "Somali Aggregate Supply",
    date: "2025-06-17", waybill: "WB-88240", truckPlate: "AG 2-11903",
    items: [{ materialId: "M08", qty: 2, condition: "Short" }, { materialId: "M09", qty: 3, condition: "Short" }, { materialId: "M10", qty: 3, condition: "Short" }],
    status: "Logged", receivedBy: "Storekeeper A. Hamza",
  },
];

const QC: QCInspection[] = [
  {
    id: "Q1", ref: "MIR-2025-052", grnRef: "GRN-2025-077", materialId: "M08", materialName: "River Sand (Fafan)",
    batch: "BATCH-S-010", testDate: "2025-06-16", status: "Quarantined", inspector: "QA/QC L. Bontu",
    note: "Silt content marginally high, re-test after washing.",
    tests: [
      { id: "t1", name: "Silt Content", value: "2.8%", standard: "<= 2.0%", pass: false },
      { id: "t2", name: "Organic Impurities", value: "Pass", standard: "Free", pass: true },
      { id: "t3", name: "Grading (FM)", value: "2.6", standard: "2.3 - 3.1", pass: true },
    ],
  },
  {
    id: "Q2", ref: "MIR-2025-053", grnRef: "GRN-2025-077", materialId: "M09", materialName: "Basalt Aggregate 01",
    batch: "BATCH-A-204", testDate: "2025-06-16", status: "Approved for Use", inspector: "QA/QC L. Bontu",
    note: "Complies with grading requirement.",
    tests: [
      { id: "t4", name: "Gradation", value: "Complies", standard: "ASTM C33", pass: true },
      { id: "t5", name: "Fineness Modulus", value: "6.8", standard: "6.0 - 7.5", pass: true },
      { id: "t6", name: "Deleterious Materials", value: "0.4%", standard: "<=1%", pass: true },
    ],
  },
  {
    id: "Q3", ref: "MIR-2025-054", grnRef: "TRIAL".repeat(0) + "Concrete Cube 7", materialId: "M01", materialName: "PPC Cement 42.5N",
    batch: "CUBE-7-118", testDate: "2025-06-10", status: "Approved for Use", inspector: "QA/QC L. Bontu",
    note: "7-day cube achieved 18.4 MPa (target C25).",
    tests: [
      { id: "t7", name: "Compressive 7d", value: "18.4 MPa", standard: ">=16 MPa", pass: true },
      { id: "t8", name: "Slump", value: "82 mm", standard: "60-100 mm", pass: true },
      { id: "t9", name: "Water/Cement", value: "0.48", standard: "<=0.5", pass: true },
    ],
  },
  {
    id: "Q4", ref: "MIR-2025-055", grnRef: "GRN-2025-077", materialId: "M10", materialName: "Basalt Aggregate 02",
    batch: "BATCH-A-205", testDate: "2025-06-16", status: "Pending Inspection", inspector: "QA/QC L. Bontu",
    note: "Awaiting gradation result.",
    tests: [{ id: "t10", name: "Gradation", value: "In progress", standard: "ASTM C33", pass: false }],
  },
];

const INV: InventoryItem[] = [
  { materialId: "M01", quantity: 1420, reserved: 120, lastUpdated: "2025-06-18", onOrder: 320 },
  { materialId: "M02", quantity: 85, reserved: 0, lastUpdated: "2025-06-18", onOrder: 0 },
  { materialId: "M03", quantity: 12, reserved: 2, lastUpdated: "2025-06-17", onOrder: 0 },
  { materialId: "M04", quantity: 16, reserved: 3, lastUpdated: "2025-06-17", onOrder: 9 },
  { materialId: "M05", quantity: 7, reserved: 1, lastUpdated: "2025-06-17", onOrder: 0 },
  { materialId: "M06", quantity: 4, reserved: 0, lastUpdated: "2025-06-16", onOrder: 0 },
  { materialId: "M07", quantity: 5, reserved: 0, lastUpdated: "2025-06-16", onOrder: 0 },
  { materialId: "M08", quantity: 132, reserved: 10, lastUpdated: "2025-06-18", onOrder: 0 },
  { materialId: "M09", quantity: 108, reserved: 8, lastUpdated: "2025-06-18", onOrder: 0 },
  { materialId: "M10", quantity: 96, reserved: 6, lastUpdated: "2025-06-18", onOrder: 0 },
  { materialId: "M11", quantity: 5600, reserved: 400, lastUpdated: "2025-06-17", onOrder: 8000 },
  { materialId: "M12", quantity: 2100, reserved: 100, lastUpdated: "2025-06-17", onOrder: 2500 },
  { materialId: "M13", quantity: 12, reserved: 0, lastUpdated: "2025-06-15", onOrder: 18 },
  { materialId: "M14", quantity: 640, reserved: 50, lastUpdated: "2025-06-16", onOrder: 0 },
  { materialId: "M15", quantity: 320, reserved: 30, lastUpdated: "2025-06-16", onOrder: 0 },
  { materialId: "M16", quantity: 22, reserved: 2, lastUpdated: "2025-06-17", onOrder: 0 },
  { materialId: "M17", quantity: 260, reserved: 0, lastUpdated: "2025-06-15", onOrder: 0 },
  { materialId: "M18", quantity: 1900, reserved: 100, lastUpdated: "2025-06-15", onOrder: 1600 },
];

const ISSUES: IssueVoucher[] = [
  {
    id: "I1", ref: "SIV-2025-203", date: "2025-06-18", workPackage: "Substructure", taskCode: "TASK-SUB-031",
    gang: "Gang 3 (RCC)", items: [{ materialId: "M08", qty: 30, binZone: "Yard" }, { materialId: "M10", qty: 25, binZone: "Yard" }],
    issuedBy: "Storekeeper A. Hamza", receivedBy: "Gang Foreman O. Ali",
  },
  {
    id: "I2", ref: "SIV-2025-204", date: "2025-06-18", workPackage: "Masonry", taskCode: "TASK-MAS-015",
    gang: "Gang 1 (Blockwork)", items: [{ materialId: "M11", qty: 2200, binZone: "Yard" }],
    issuedBy: "Storekeeper A. Hamza", receivedBy: "Gang Foreman K. Yusuf",
  },
];

const RETURNS: ReturnVoucher[] = [
  {
    id: "RV1", ref: "SRV-2025-056", date: "2025-06-17", workPackage: "Substructure",
    items: [{ materialId: "M09", qty: 4, reason: "Over-issued surplus" }], approvedBy: "Eng. Hanna Worku",
  },
];

const WASTAGE: WastageRecord[] = [
  { id: "W1", materialId: "M04", materialName: "Rebar Ø12", workPackage: "Substructure", boqUsed: 8.2, actualUsed: 8.9, unit: "ton", unitPrice: 110500, allowancePct: 3 },
  { id: "W2", materialId: "M08", materialName: "River Sand (Fafan)", workPackage: "Substructure", boqUsed: 52, actualUsed: 55, unit: "m3", unitPrice: 1850, allowancePct: 5 },
  { id: "W3", materialId: "M01", materialName: "PPC Cement 42.5N", workPackage: "Substructure", boqUsed: 90, actualUsed: 97, unit: "bag", unitPrice: 880, allowancePct: 4 },
];

const LOGS = [
  { id: "L1", ts: "2025-06-18 09:12", role: "Site Engineer", actor: "Eng. Hanna Worku", action: "Approved MR-2025-042", ref: "MR-2025-042" },
  { id: "L2", ts: "2025-06-18 08:40", role: "Storekeeper", actor: "A. Hamza", action: "Issued SIV-2025-204", ref: "SIV-2025-204" },
  { id: "L3", ts: "2025-06-16 14:05", role: "QA/QC Inspector", actor: "L. Bontu", action: "Quarantined MIR-2025-052", ref: "MIR-2025-052" },
  { id: "L4", ts: "2025-06-16 10:22", role: "Finance Officer", actor: "F. Tesfaye", action: "3-way match PO-2025-118", ref: "PO-2025-118" },
  { id: "L5", ts: "2025-06-15 16:48", role: "Procurement Officer", actor: "S. Omer", action: "Shipped PO-2025-121", ref: "PO-2025-121" },
] as AppState["logs"];

export function buildSeedState(): AppState {
  return {
    requisitions: REQS,
    purchaseOrders: POS,
    grns: GRNS,
    inspections: QC,
    inventory: INV,
    issues: ISSUES,
    returns: RETURNS,
    wastage: WASTAGE,
    logs: LOGS,
  };
}