import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FileText, ShoppingCart, Plus, Check, X, ArrowRight, Truck, Banknote,
  CircleCheck, Search, Sparkles, Eye,
} from "lucide-react";
import {
  WORK_PACKAGES, etb, etb2, fmtQty, type AppState, type UserRole, type PurchaseOrder as Purchy, type Requisition, type Material,
  type Supplier, type ProjectMeta,
} from "../types";
import { MATERIALS } from "../data/mockData";
import { materialService, type BackendCategory, type BackendMaterial, type BackendUnit } from "../services/material.service";

type MRPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type MRItem = { materialId: string; qty: number; unitPrice?: number; name?: string; remarks?: string };

type MRDraft = {
  items: MRItem[];
  requiredDate: string;
  priority: MRPriority;
  purpose: string;
  remarks: string;
};

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  role: UserRole;
  project?: ProjectMeta;
  focus: string | null;
  materials?: Material[];
  suppliers?: Supplier[];
  onCreateRequisitionBackend?: (
    items: MRItem[],
    opts?: { requiredDate?: string; priority?: MRPriority; purpose?: string; remarks?: string }
  ) => Promise<Requisition | null>;
  onSubmitRequisitionBackend?: (id: string) => Promise<boolean>;
  onStartRequisitionReviewBackend?: (id: string) => Promise<boolean>;
  onApproveRequisitionBackend?: (id: string, comments?: string) => Promise<boolean>;
  onRejectRequisitionBackend?: (id: string, reason?: string) => Promise<boolean>;
  onCancelRequisitionBackend?: (id: string) => Promise<boolean>;
  onCreatePurchaseOrderBackend?: (
    reqId: string,
    opts: {
      supplierId: string;
      expectedDeliveryDate?: string;
      remarks?: string;
      items: { materialId: string; orderedQuantity: number; unitPrice: number }[];
    }
  ) => Promise<Purchy | null>;
  onSubmitPurchaseOrderBackend?: (id: string) => Promise<boolean>;
  onApprovePurchaseOrderBackend?: (id: string) => Promise<boolean>;
  onCancelPurchaseOrderBackend?: (id: string, reason: string) => Promise<boolean>;
  onClosePurchaseOrderBackend?: (id: string) => Promise<boolean>;
  onCreateSupplierBackend?: (data: {
    supplierCode: string;
    companyName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) => Promise<Supplier | null>;
}

type Tab = "requisitions" | "pos";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  SUBMITTED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  UNDER_REVIEW: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  RETURNED: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  PARTIALLY_APPROVED: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  PARTIALLY_SUPPLIED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  FULLY_SUPPLIED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  COMPLETED: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  // Legacy / PO status support
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  Issued: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  Delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Closed: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PARTIALLY_RECEIVED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  FULLY_RECEIVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  CLOSED: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const MR_FILTERS = ["All", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED", "RETURNED"];

const isBackendId = (id: string) => id.length > 10 || id.includes("-");

interface NewMaterialRow {
  kind: "existing" | "new";
  materialId: string;
  qty: number;
  newName: string;
  newCode: string;
  categoryId: string;
  unitId: string;
  unitPrice: number;
  spec: string;
}

function NewRequisitionModal({
  onSubmit,
  materials = MATERIALS,
  setShowNew,
  
}: {
  onSubmit: (draft: MRDraft) => void;
  materials?: Material[];
  setShowNew: (value: boolean) => void;
  
}) {
  const activeMaterials = materials.length > 0 ? materials : MATERIALS;
  const [units, setUnits] = useState<BackendUnit[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [created, setCreated] = useState<BackendMaterial[]>([]);
  const [wp, setWp] = useState(WORK_PACKAGES[0]);
  const [rows, setRows] = useState<NewMaterialRow[]>(() => {
    const firstMat = materials?.[0] || MATERIALS[0] || { id: "", unitPrice: 0 };
    return [
      {
        kind: "existing",
        materialId: firstMat.id,
        qty: 1,
        newName: "",
        newCode: "",
        categoryId: "",
        unitId: "",
        unitPrice: firstMat.unitPrice || 0,
        spec: "",
      },
    ];
  });
  const [needDate, setNeedDate] = useState("2025-07-01");
  const [priority, setPriority] = useState<MRPriority>("NORMAL");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    materialService.getUnits().then((u) => alive && setUnits(u)).catch(() => {});
    materialService.getCategories().then((c) => alive && setCategories(c)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const allMaterials = useMemo(() => [...activeMaterials, ...created], [activeMaterials, created]);

  const materialLabel = (mm: Material | BackendMaterial): string => {
    const unit = typeof mm.unit === "string" ? mm.unit : (mm.unit?.symbol || mm.unit?.name || "unit");
    return `${mm.name} · ${unit}`;
  };

  const materialPrice = (mm: Material | BackendMaterial | undefined): number => {
    if (!mm) return 0;

    // Try to get price from Material type
    if ("unitPrice" in mm && typeof (mm as Material).unitPrice === "number") {
      return (mm as Material).unitPrice;
    }

    // Try to get price from BackendMaterial type
    const bm = mm as BackendMaterial;
    const currentPrice = Number(bm.currentUnitPrice ?? 0);
    const estimatedPrice = Number(bm.estimatedUnitPrice ?? 0);
    const price = !isNaN(currentPrice) && currentPrice > 0 ? currentPrice : estimatedPrice;
    return Number(price) || 0;
  };

  const rowPrice = (r: NewMaterialRow): number =>
    r.kind === "new"
      ? r.unitPrice || 0
      : materialPrice(allMaterials.find((x) => x.id === r.materialId));

  const updRow = (i: number, patch: Partial<NewMaterialRow>) =>
    setRows((rs) => {
      const newRows = rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r));

      // If we just changed the materialId, update the unitPrice to match the new material's DB price
      if ("materialId" in patch && patch.materialId) {
        const row = newRows[i];
        if (row.kind === "existing") {
          const m = allMaterials.find((x) => x.id === row.materialId);
          const price = materialPrice(m);
          newRows[i] = { ...row, unitPrice: price };
        }
      }

      return newRows;
    });

  const addRow = () => {
    const firstMat = allMaterials[0];
    const price = firstMat ? materialPrice(firstMat) : 0;
    setRows((rs) => [
      ...rs,
      {
        kind: "existing",
        materialId: firstMat?.id ?? "",
        qty: 1,
        newName: "",
        newCode: "",
        categoryId: categories[0]?.id ?? "",
        unitId: units[0]?.id ?? "",
        unitPrice: price,
        spec: "",
      },
    ]);
  };

  const submit = async () => {
    const valid = rows.filter((r) =>
      r.qty > 0 &&
      (r.kind === "existing"
        ? Boolean(r.materialId)
        : Boolean(r.newName.trim()) && Boolean(r.newCode.trim()) && Boolean(r.categoryId) && Boolean(r.unitId))
    );
    if (valid.length === 0) return;
    setSubmitting(true);
    try {
      const resolved: MRItem[] = [];
      for (const r of valid) {
        if (r.kind === "new") {
          const fresh = await materialService.createMaterial({
            materialCode: r.newCode.trim(),
            name: r.newName.trim(),
            categoryId: r.categoryId,
            unitId: r.unitId,
            estimatedUnitPrice: r.unitPrice || 0,
            specification: r.spec.trim() || undefined,
          });
          setCreated((cs) => [...cs, fresh]);
          resolved.push({ materialId: fresh.id, qty: r.qty, unitPrice: r.unitPrice || 0, name: fresh.name });
        } else {
          const m = allMaterials.find((x) => x.id === r.materialId);
          resolved.push({ materialId: r.materialId, qty: r.qty, unitPrice: materialPrice(m), name: m?.name });
        }
      }

      onSubmit({
        items: resolved,
        requiredDate: needDate,
        priority,
        purpose: purpose.trim(),
        remarks: remarks.trim(),
      });
    } catch (err) {
      console.error("Failed to create material:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create material / requisition");
    } finally {
      setSubmitting(false);
    }
  };

  const estTotal = rows.reduce((s, r) => s + rowPrice(r) * r.qty, 0);
 
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
      <div className="text-lg font-bold tracking-tight">New Material Requisition</div>
      <p className="text-xs text-muted-foreground">Link items to a Jigjiga work package with ETB cost estimation.</p>

      <div className="mt-4">
        <label className="text-xs font-semibold text-muted-foreground">Work Package</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {WORK_PACKAGES.map((p) => (
            <button
              key={p} onClick={() => setWp(p)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${wp === p ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">Required Items</label>
        {rows.map((r, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={r.kind === "new" ? "__new__" : r.materialId}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    updRow(i, {
                      kind: "new",
                      newCode: r.newCode || `MAT-${String(allMaterials.length + 1).padStart(3, "0")}`,
                      categoryId: r.categoryId || categories[0]?.id || "",
                      unitId: r.unitId || units[0]?.id || "",
                    });
                  } else {
                    updRow(i, { kind: "existing", materialId: e.target.value });
                  }
                }}
                className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2"
              >
                {allMaterials.map((mm) => <option key={mm.id} value={mm.id}>{materialLabel(mm)}</option>)}
                {units.length > 0 && categories.length > 0 && (
                  <option value="__new__" className="font-semibold text-amber-600">＋ Create new material…</option>
                )}
              </select>
              <input
                type="number" min={1} value={r.qty}
                onChange={(e) => updRow(i, { qty: Number(e.target.value) })}
                className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-right text-sm outline-none ring-ring focus:ring-2"
              />
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                {etb(r.kind === "existing" ? materialPrice(allMaterials.find((m) => m.id === r.materialId)) : r.unitPrice)}
              </span>
              <button
                onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                disabled={rows.length === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
              >
                <X size={15} />
              </button>
            </div>

            {r.kind === "new" && (
              <div className="rounded-lg border border-dashed border-amber-400/50 bg-amber-50/40 p-3 dark:bg-amber-500/5">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <Sparkles size={12} /> New material — registered to catalog on save
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Material Name
                    <input
                      value={r.newName}
                      onChange={(e) => updRow(i, { newName: e.target.value })}
                      placeholder="e.g. Rebar T16 Grade 60"
                      className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Material Code
                    <input
                      value={r.newCode}
                      onChange={(e) => updRow(i, { newCode: e.target.value })}
                      placeholder="e.g. MAT-021"
                      className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Category <span className="font-normal text-muted-foreground/70">(from DB)</span>
                    <select
                      value={r.categoryId}
                      onChange={(e) => updRow(i, { categoryId: e.target.value })}
                      className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2"
                    >
                      {categories.length === 0 && <option value="">No categories loaded</option>}
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Unit <span className="font-normal text-muted-foreground/70">(from DB)</span>
                    <select
                      value={r.unitId}
                      onChange={(e) => updRow(i, { unitId: e.target.value })}
                      className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2"
                    >
                      {units.length === 0 && <option value="">No units loaded</option>}
                      {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol || u.code})</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Est. Unit Price (ETB)
                    <input
                      type="number" min={0} value={r.unitPrice}
                      onChange={(e) => updRow(i, { unitPrice: Number(e.target.value) })}
                      className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Specification <span className="font-normal text-muted-foreground/70">(optional)</span>
                    <input
                      value={r.spec}
                      onChange={(e) => updRow(i, { spec: e.target.value })}
                      placeholder="e.g. CEM II 42.5N"
                      className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-lg text-xs font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400"
        >
          <Plus size={14} /> Add line item
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-muted/50 p-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Required Date</label>
          <input type="date" value={needDate} onChange={(e) => setNeedDate(e.target.value)}
            className="mt-1 h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as MRPriority)}
            className="mt-1 h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none">
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Purpose</label>
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Wall construction phase"
            className="mt-1 h-9 w-64 rounded-lg border border-input bg-background px-2 text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Remarks</label>
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional note"
            className="mt-1 h-9 w-64 rounded-lg border border-input bg-background px-2 text-sm outline-none" />
        </div>
        <div className="ml-auto text-right">
          <div className="text-[11px] text-muted-foreground">Estimated Total</div>
          <div className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
            {etb(estTotal)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => setShowNew(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button onClick={submit} disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950">
          <Check size={15} /> {submitting ? "Saving…" : "Save Requisition"}
        </button>
      </div>
    </motion.div>
  );
}

function NewPOModal({
  req,
  catalog,
  suppliers,
  busy,
  onCreateSupplier,
  onSubmit,
  onClose,
}: {
  req: Requisition;
  catalog: Material[];
  suppliers: Supplier[];
  busy: boolean;
  onCreateSupplier: (data: {
    supplierCode: string;
    companyName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  }) => Promise<Supplier | null>;
  onSubmit: (opts: {
    supplierId: string;
    expectedDeliveryDate?: string;
    remarks?: string;
    items: { materialId: string; orderedQuantity: number; unitPrice: number }[];
  }) => Promise<void>;
  onClose: () => void;
}) {
  const byId = (id: string) => catalog.find((x) => x.id === id);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [terms, setTerms] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [nsBusy, setNsBusy] = useState(false);
  const [nsForm, setNsForm] = useState({ supplierCode: "", companyName: "", contactPerson: "", phone: "", email: "" });
  const [createdSuppliers, setCreatedSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState(
    () =>
      req.items.map((it) => {
        const m = byId(it.materialId);
        const base = it.unitPrice != null && Number(it.unitPrice) > 0 ? Number(it.unitPrice) : m?.unitPrice ?? 0;
        return { materialId: it.materialId, orderedQuantity: it.qty, unitPrice: base };
      })
  );

  const allSuppliers =
    createdSuppliers.length > 0
      ? [...createdSuppliers, ...suppliers.filter((s) => !createdSuppliers.some((c) => c.id === s.id))]
      : suppliers;

  const subtotal = items.reduce((s, it) => s + it.orderedQuantity * it.unitPrice, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const patchItem = (i: number, patch: Partial<{ orderedQuantity: number; unitPrice: number }>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const createNewSupplier = async () => {
    if (!nsForm.companyName.trim() || !nsForm.supplierCode.trim()) {
      toast.error("Company name and supplier code are required.");
      return;
    }
    setNsBusy(true);
    try {
      const created = await onCreateSupplier({
        companyName: nsForm.companyName.trim(),
        supplierCode: nsForm.supplierCode.trim().toUpperCase(),
        contactPerson: nsForm.contactPerson.trim() || undefined,
        phone: nsForm.phone.trim() || undefined,
        email: nsForm.email.trim() || undefined,
      });
      if (created) {
        setCreatedSuppliers((prev) => (prev.some((s) => s.id === created.id) ? prev : [created, ...prev]));
        setSupplierId(created.id);
        setShowNewSupplier(false);
        setNsForm({ supplierCode: "", companyName: "", contactPerson: "", phone: "", email: "" });
      }
    } finally {
      setNsBusy(false);
    }
  };

  const submit = async () => {
    if (!supplierId) {
      toast.error("Please select a supplier for this purchase order.");
      return;
    }
    if (items.length === 0 || items.some((it) => it.orderedQuantity <= 0)) {
      toast.error("Every line item needs a quantity greater than zero.");
      return;
    }
    if (items.some((it) => it.unitPrice < 0)) {
      toast.error("Unit prices cannot be negative.");
      return;
    }
    await onSubmit({
      supplierId,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      remarks: terms.trim() || undefined,
      items: items.map((it) => ({ materialId: it.materialId, orderedQuantity: it.orderedQuantity, unitPrice: it.unitPrice })),
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-bold tracking-tight">Create Purchase Order</div>
          <p className="text-xs text-muted-foreground">
            DRAFT PO generated from APPROVED requisition {req.ref}
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Supplier <span className="text-rose-500">*</span>
          </label>
          <div className="mt-1 flex gap-2">
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none">
              {allSuppliers.length === 0 && <option value="">No suppliers yet</option>}
              {allSuppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.companyName} ({s.supplierCode})</option>
              ))}
            </select>
            <button onClick={() => setShowNewSupplier((v) => !v)} disabled={nsBusy}
              className="shrink-0 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-60">
              <Plus size={13} className="mr-1 inline" /> New supplier
            </button>
          </div>

          {showNewSupplier && (
            <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-muted-foreground">Company Name *</label>
                  <input value={nsForm.companyName} onChange={(e) => setNsForm({ ...nsForm, companyName: e.target.value })}
                    className="mt-0.5 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Supplier Code *</label>
                  <input value={nsForm.supplierCode} onChange={(e) => setNsForm({ ...nsForm, supplierCode: e.target.value })}
                    placeholder="SUP-010"
                    className="mt-0.5 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Contact Person</label>
                  <input value={nsForm.contactPerson} onChange={(e) => setNsForm({ ...nsForm, contactPerson: e.target.value })}
                    className="mt-0.5 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Phone</label>
                  <input value={nsForm.phone} onChange={(e) => setNsForm({ ...nsForm, phone: e.target.value })}
                    className="mt-0.5 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Email</label>
                  <input value={nsForm.email} onChange={(e) => setNsForm({ ...nsForm, email: e.target.value })}
                    className="mt-0.5 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" />
                </div>
              </div>
              <button onClick={createNewSupplier} disabled={nsBusy}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950">
                {nsBusy ? "Saving supplier…" : "Save supplier"}
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Expected Delivery</label>
          <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Delivery Terms / Remarks</label>
          <input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. CFR site, 14 days"
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-right">Unit</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const reqItem = req.items[i];
              const m = byId(it.materialId);
              return (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="font-medium">{reqItem?.name ?? m?.name ?? "Unknown material"}</div>
                    <div className="text-[10px] text-muted-foreground">approved qty: {fmtQty(reqItem?.qty ?? it.orderedQuantity)} {m?.unit}</div>
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{m?.unit ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" min={1} value={it.orderedQuantity}
                      onChange={(e) => patchItem(i, { orderedQuantity: Math.max(0, Number(e.target.value) || 0) })}
                      className="h-7 w-20 rounded-md border border-input bg-background px-2 text-right font-mono text-xs outline-none" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" min={0} value={it.unitPrice}
                      onChange={(e) => patchItem(i, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                      className="h-7 w-24 rounded-md border border-input bg-background px-2 text-right font-mono text-xs outline-none" />
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmtQty(it.orderedQuantity * it.unitPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-0.5 text-right text-xs text-muted-foreground">
        <div>Subtotal · <span className="font-mono">{etb2(subtotal)}</span></div>
        <div>VAT (15%) · <span className="font-mono">{etb2(tax)}</span></div>
        <div className="text-sm font-semibold text-foreground">
          PO Total · <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">{etb2(total)}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button onClick={submit} disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950">
          <Check size={15} /> {busy ? "Creating…" : "Save DRAFT PO"}
        </button>
      </div>
    </div>
  );
}

function PurchaseOrderDetailModal({
  p,
  catalog,
  reqs,
  suppliers,
  canAct,
  busy,
  onClose,
  onSubmit,
  onApprove,
  onCancel,
  onClosePO,
}: {
  p: Purchy;
  catalog: Material[];
  reqs: Requisition[];
  suppliers: Supplier[];
  canAct: boolean;
  busy: { id: string; action: string } | null;
  onClose: () => void;
  onSubmit: (x: Purchy) => void;
  onApprove: (x: Purchy) => void;
  onCancel: (x: Purchy, reason: string) => void;
  onClosePO: (x: Purchy) => void;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const byId = (id: string) => catalog.find((x) => x.id === id);
  const supplier = suppliers.find((s) => s.id === p.supplierId);
  const mr = reqs.find((r) => r.id === p.materialRequestId);

  const subtotal = p.subtotal ?? p.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const tax = p.taxAmount ?? subtotal * 0.15;
  const total = p.total;

  const submitCancel = () => {
    if (!cancelReason.trim()) {
      toast.error("A cancellation reason is required.");
      return;
    }
    onCancel(p, cancelReason.trim());
  };

  const isBusy = (action: string) => busy?.id === p.id && busy.action === action;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">{p.ref}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[p.status]}`}>{p.status.replace(/_/g, " ")}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Purchase order {p.requisitionRef === "Direct PO" ? "· direct" : `from ${mr ? mr.ref : p.requisitionRef}`}
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[11px] font-bold uppercase text-muted-foreground">Supplier</div>
          <div className="mt-1 text-sm font-semibold">{p.supplier}</div>
          {supplier?.supplierCode && <div className="text-[11px] text-muted-foreground">Code: {supplier.supplierCode}</div>}
          {(supplier?.contactPerson || p.contactPerson) && (
            <div className="mt-1 text-xs text-muted-foreground">Contact: {supplier?.contactPerson ?? p.contactPerson}</div>
          )}
          {(supplier?.phone || p.phone) && (
            <div className="text-xs text-muted-foreground">Phone: {supplier?.phone ?? p.phone}</div>
          )}
          {(supplier?.email || p.email) && (
            <div className="text-xs text-muted-foreground">Email: {supplier?.email ?? p.email}</div>
          )}
          {(supplier?.address || p.address) && (
            <div className="text-xs text-muted-foreground">Address: {supplier?.address ?? p.address}</div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[11px] font-bold uppercase text-muted-foreground">Delivery</div>
          <div className="mt-1 text-sm">Order date: <span className="font-mono">{p.date}</span></div>
          {p.expectedDeliveryDate && (
            <div className="text-sm">Expected: <span className="font-mono">{p.expectedDeliveryDate}</span></div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">{p.deliveryTerms || "Standard site delivery"}</div>
          {p.remarks && p.remarks !== p.deliveryTerms && (
            <div className="mt-2 whitespace-pre-line rounded-md bg-background/60 p-2 text-[11px] text-muted-foreground">{p.remarks}</div>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-right">Unit</th>
              <th className="px-3 py-2 text-right">Ordered</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {p.items.map((it, i) => {
              const m = byId(it.materialId);
              return (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2">{it.name ?? m?.name ?? "Unknown material"}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{it.unit ?? m?.unit ?? "-"}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtQty(it.qty)}{it.receivedQty != null ? ` / ${fmtQty(it.receivedQty)} rcvd` : ""}</td>
                  <td className="px-3 py-2 text-right font-mono">{etb2(it.unitPrice)}</td>
                  <td className="px-3 py-2 text-right font-mono">{etb2(it.qty * it.unitPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-0.5 text-right text-xs text-muted-foreground">
        <div>Subtotal · <span className="font-mono">{etb2(subtotal)}</span> ({p.currency || "ETB"})</div>
        <div>VAT (15%) · <span className="font-mono">{etb2(tax)}</span></div>
        <div className="text-sm font-semibold text-foreground">
          Total · <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">{etb2(total)}</span>
        </div>
      </div>

      {mr && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Related material request</span>
          <span className="font-semibold">{mr.ref} · <span className={`rounded-full px-1.5 py-0.5 ${STATUS_STYLE[mr.status]}`}>{mr.status}</span></span>
        </div>
      )}

      {canAct && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
          {p.status === "DRAFT" && (
            <button onClick={() => onSubmit(p)} disabled={isBusy("po-submit")}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950">
              <ArrowRight size={15} /> {isBusy("po-submit") ? "Submitting…" : "Submit for Approval"}
            </button>
          )}
          {p.status === "PENDING_APPROVAL" && (
            <>
              <button onClick={() => onApprove(p)} disabled={isBusy("po-approve")}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                <CircleCheck size={15} /> {isBusy("po-approve") ? "Approving…" : "Approve"}
              </button>
              <button onClick={() => setCancelOpen((v) => !v)} disabled={isBusy("po-cancel")}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent">
                Cancel
              </button>
            </>
          )}
          {p.status === "APPROVED" && (
            <button onClick={() => setCancelOpen((v) => !v)} disabled={isBusy("po-cancel")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent">
              Cancel
            </button>
          )}
          {p.status === "PARTIALLY_RECEIVED" && (
            <button onClick={() => setCancelOpen((v) => !v)} disabled={isBusy("po-cancel")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent">
              Cancel
            </button>
          )}
          {p.status === "FULLY_RECEIVED" && (
            <button onClick={() => onClosePO(p)} disabled={isBusy("po-close")}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950">
              <CircleCheck size={15} /> {isBusy("po-close") ? "Closing…" : "Close PO"}
            </button>
          )}
        </div>
      )}

      {cancelOpen && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <label className="text-xs font-semibold text-foreground">Cancellation reason <span className="text-rose-500">*</span></label>
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={2}
            placeholder="Required — recorded on the purchase order"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setCancelOpen(false); setCancelReason(""); }}
              className="rounded-lg border border-input px-3 py-1.5 text-xs font-semibold hover:bg-accent">Back</button>
            <button onClick={submitCancel} disabled={isBusy("po-cancel")}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60">
              {isBusy("po-cancel") ? "Cancelling…" : "Confirm cancellation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequisitionDetailModal({
  r,
  catalog,
  isManager,
  busy,
  onClose,
  onSubmit,
  onStartReview,
  onApprove,
  onReject,
  onCancel,
  onOpenPO,
}: {
  r: Requisition;
  catalog: Material[];
  isManager: boolean;
  busy: { id: string; action: string } | null;
  onClose: () => void;
  onSubmit: (x: Requisition) => void;
  onStartReview: (x: Requisition) => void;
  onApprove: (x: Requisition, comments?: string) => void;
  onReject: (x: Requisition, reason?: string) => void;
  onCancel: (x: Requisition) => void;
  onOpenPO: (x: Requisition) => void;
}) {
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveComments, setApproveComments] = useState("");

  const byId = (id: string) => catalog.find((x) => x.id === id);
  const unitPrice = (it: Requisition["items"][number]) => {
    const p = it.unitPrice != null ? Number(it.unitPrice) : NaN;
    return !Number.isNaN(p) && p > 0 ? p : byId(it.materialId)?.unitPrice ?? 0;
  };
  const unit = (it: Requisition["items"][number]) => it.unit ?? byId(it.materialId)?.unit ?? "unit";
  const name = (it: Requisition["items"][number]) => it.name ?? byId(it.materialId)?.name ?? "Unknown material";

  const busyFor = (a: string) => busy?.id === r.id && busy.action === a;

  const doRejectWithReason = () => {
    if (!rejectReason.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    onReject(r, rejectReason.trim());
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight">{r.ref}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>{r.status.replace(/_/g, " ")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{r.requestedBy} · {r.date}</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent" aria-label="Close">
          <X size={15} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-muted/40 p-2.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Work Package</div>
          <div className="font-semibold">{r.workPackage}</div>
        </div>
        {r.requiredDate && (
          <div className="rounded-lg bg-muted/40 p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Required By</div>
            <div className="font-semibold">{r.requiredDate}</div>
          </div>
        )}
        {r.priority && (
          <div className="rounded-lg bg-muted/40 p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Priority</div>
            <div className="font-semibold">{r.priority}</div>
          </div>
        )}
      </div>

      {(r.purpose || r.remarks) && (
        <div className="mt-3 space-y-1.5 text-sm">
          {r.purpose && (
            <div>
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">Purpose · </span>
              <span className="text-muted-foreground">{r.purpose}</span>
            </div>
          )}
          {r.remarks && (
            <div>
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">Remarks · </span>
              <span className="text-muted-foreground">{r.remarks}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-center">Unit</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {r.items.map((it, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{name(it)}</div>
                  <div className="text-[11px] text-muted-foreground">{byId(it.materialId)?.spec ?? it.remarks ?? ""}</div>
                </td>
                <td className="px-3 py-2 text-center text-muted-foreground">{unit(it)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtQty(it.qty)}</td>
                <td className="px-3 py-2 text-right font-mono">{etb(unitPrice(it))}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{etb(unitPrice(it) * it.qty)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td colSpan={5} className="px-3 py-2 text-right text-[11px] uppercase tracking-wide text-muted-foreground">Estimated Total</td>
              <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 dark:text-amber-400">{etb(r.estimatedTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 space-y-2">
        {r.status === "DRAFT" && (
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={() => onCancel(r)} disabled={busyFor("cancel")}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">Cancel</button>
            <button onClick={() => onSubmit(r)} disabled={busyFor("submit")}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950">
              <Check size={15} /> {busyFor("submit") ? "Submitting…" : "Submit for Approval"}
            </button>
          </div>
        )}

        {r.status === "SUBMITTED" && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!isManager && <span className="mr-auto text-xs text-muted-foreground">Awaiting review by Project Manager.</span>}
            {isManager && (
              <button onClick={() => onStartReview(r)} disabled={busyFor("review")}
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">
                <ArrowRight size={15} /> {busyFor("review") ? "Moving…" : "Start Review"}
              </button>
            )}
            <button onClick={() => onCancel(r)} disabled={busyFor("cancel")}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">Cancel</button>
          </div>
        )}

        {r.status === "UNDER_REVIEW" && (
          <div className="space-y-3">
            {isManager ? (
              <>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <label className="text-xs font-semibold text-muted-foreground">Approval Comments (optional)</label>
                  <textarea value={approveComments} onChange={(e) => setApproveComments(e.target.value)} rows={2}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none"
                    placeholder="e.g. Budget confirmed, proceed with procurement." />
                  <button onClick={() => onApprove(r, approveComments.trim() || undefined)} disabled={busyFor("approve")}
                    className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                    <Check size={15} /> {busyFor("approve") ? "Approving…" : "Approve Requisition"}
                  </button>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
                  <label className="text-xs font-semibold text-rose-600 dark:text-rose-400">Rejection Reason (required)</label>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none"
                    placeholder="e.g. Quantity exceeds budgeted allowance." />
                  {confirmReject ? (
                    <div className="mt-2 flex gap-2">
                      <button onClick={doRejectWithReason} disabled={busyFor("reject")}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
                        {busyFor("reject") ? "Rejecting…" : "Confirm Reject"}
                      </button>
                      <button onClick={() => setConfirmReject(false)}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">Back</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmReject(true)}
                      className="mt-2 rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400">
                      Reject Requisition
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-right text-xs text-muted-foreground">Under review — awaiting Project Manager decision.</div>
            )}
            <div className="flex justify-end">
              <button onClick={() => onCancel(r)} disabled={busyFor("cancel")}
                className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">Cancel Requisition</button>
            </div>
          </div>
        )}

        {r.status === "APPROVED" && (
          <div className="flex flex-wrap justify-end gap-2">
            <p className="mr-auto self-center text-xs text-muted-foreground">Approved by project management.</p>
            <button onClick={() => onOpenPO(r)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
              <Banknote size={15} /> Issue Purchase Order
            </button>
          </div>
        )}

        {["REJECTED", "CANCELLED", "RETURNED", "PARTIALLY_APPROVED", "COMPLETED"].includes(r.status) && (
          <div className="flex justify-end">
            <p className="mr-auto self-center text-xs text-muted-foreground">
              {r.status === "REJECTED" && (r.remarks ? `Reason: ${r.remarks}` : "Rejected by project management.")}
              {r.status === "CANCELLED" && "This requisition was cancelled."}
              {r.status === "RETURNED" && "Returned to requester for revision."}
              {r.status === "PARTIALLY_APPROVED" && "Partially approved — awaiting remaining quantities."}
              {r.status === "COMPLETED" && "Fully executed and closed."}
            </p>
            <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequisitionProcurement({
  state,
  setState,
  role,
  focus,
  materials,
  suppliers = [],
  onCreateRequisitionBackend,
  onSubmitRequisitionBackend,
  onStartRequisitionReviewBackend,
  onApproveRequisitionBackend,
  onRejectRequisitionBackend,
  onCancelRequisitionBackend,
  onCreatePurchaseOrderBackend,
  onSubmitPurchaseOrderBackend,
  onApprovePurchaseOrderBackend,
  onCancelPurchaseOrderBackend,
  onClosePurchaseOrderBackend,
  onCreateSupplierBackend,
}: Props) {
  const [tab, setTab] = useState<Tab>(focus === "po" ? "pos" : "requisitions");
  const [showNew, setShowNew] = useState(false);
  const [showPO, setShowPO] = useState<Requisition | null>(null);
  const [viewPO, setViewPO] = useState<Purchy | null>(null);
  const [viewReq, setViewReq] = useState<Requisition | null>(null);
  const [filter, setFilter] = useState("All");
  const [busy, setBusy] = useState<{ id: string; action: string } | null>(null);

  const catalog = materials && materials.length > 0 ? materials : MATERIALS;
  const byId = (id: string) => catalog.find((x) => x.id === id);

  const reqs = useMemo(() => {
    if (filter === "All") return state.requisitions;
    return state.requisitions.filter((r) => r.status === filter);
  }, [state.requisitions, filter]);

  const statuses = MR_FILTERS;

  const isManager = role === "Project Manager";

  const patchReq = (id: string, patch: Partial<Requisition>) => {
    setState({
      ...state,
      requisitions: state.requisitions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  };

  const runTransition = async (
    r: Requisition,
    action: string,
    nextStatus: Requisition["status"],
    backend: (() => Promise<boolean>) | null,
    localExtra?: Partial<Requisition> & { mockMessage?: string }
  ) => {
    setBusy({ id: r.id, action });
    try {
      if (backend && isBackendId(r.id)) {
        await backend();
      } else {
        patchReq(r.id, { ...(localExtra ?? {}), status: nextStatus });
        setViewReq((v) => (v && v.id === r.id ? { ...v, ...(localExtra ?? {}), status: nextStatus } : v));
        toast.success(localExtra?.mockMessage ?? `${r.ref} → ${nextStatus}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const doSubmit = (r: Requisition) =>
    runTransition(r, "submit", "SUBMITTED", onSubmitRequisitionBackend ? () => onSubmitRequisitionBackend!(r.id) : null, { mockMessage: `${r.ref} submitted for approval` });

  const doStartReview = (r: Requisition) =>
    runTransition(r, "review", "UNDER_REVIEW", onStartRequisitionReviewBackend ? () => onStartRequisitionReviewBackend!(r.id) : null, { mockMessage: `${r.ref} moved to UNDER_REVIEW` });

  const doApprove = (r: Requisition, comments?: string) =>
    runTransition(r, "approve", "APPROVED", onApproveRequisitionBackend ? () => onApproveRequisitionBackend!(r.id, comments) : null, { pmSigned: true, approvalTrace: [...r.approvalTrace, "PM: approved"], mockMessage: `${r.ref} approved` });

  const doReject = (r: Requisition, reason?: string) =>
    runTransition(r, "reject", "REJECTED", onRejectRequisitionBackend ? () => onRejectRequisitionBackend!(r.id, reason) : null, { remarks: reason || "Rejected", mockMessage: `${r.ref} rejected` });

  const doCancel = (r: Requisition) =>
    runTransition(r, "cancel", "CANCELLED", onCancelRequisitionBackend ? () => onCancelRequisitionBackend!(r.id) : null, { mockMessage: `${r.ref} cancelled` });

  const itemName = (it: Requisition["items"][number]) => it.name ?? byId(it.materialId)?.name ?? "Unknown material";

  const canActPO = role === "Procurement Officer" || role === "Project Manager";

  const addPO = async (opts: {
    supplierId: string;
    expectedDeliveryDate?: string;
    remarks?: string;
    items: { materialId: string; orderedQuantity: number; unitPrice: number }[];
  }) => {
    if (!showPO) return;
    setBusy({ id: showPO.id, action: "po-create" });
    try {
      const created = onCreatePurchaseOrderBackend
        ? await onCreatePurchaseOrderBackend(showPO.id, opts)
        : null;
      if (created) {
        setShowPO(null);
        setViewReq((v) => (v && v.id === showPO.id ? null : v));
      }
    } finally {
      setBusy(null);
    }
  };

  const doSubmitPO = (p: Purchy) => {
    if (!onSubmitPurchaseOrderBackend) return;
    setBusy({ id: p.id, action: "po-submit" });
    void onSubmitPurchaseOrderBackend(p.id).then((ok) => { if (ok) setViewPO(null); }).finally(() => setBusy(null));
  };

  const doApprovePO = (p: Purchy) => {
    if (!onApprovePurchaseOrderBackend) return;
    setBusy({ id: p.id, action: "po-approve" });
    void onApprovePurchaseOrderBackend(p.id).then((ok) => { if (ok) setViewPO(null); }).finally(() => setBusy(null));
  };

  const doCancelPO = (p: Purchy, reason: string) => {
    if (!onCancelPurchaseOrderBackend) return;
    setBusy({ id: p.id, action: "po-cancel" });
    void onCancelPurchaseOrderBackend(p.id, reason).then((ok) => { if (ok) setViewPO(null); }).finally(() => setBusy(null));
  };

  const doClosePO = (p: Purchy) => {
    if (!onClosePurchaseOrderBackend) return;
    setBusy({ id: p.id, action: "po-close" });
    void onClosePurchaseOrderBackend(p.id).then((ok) => { if (ok) setViewPO(null); }).finally(() => setBusy(null));
  };

  const addReq = async (draft: MRDraft) => {
    let createdReq: Requisition | null = null;
    if (onCreateRequisitionBackend) {
      createdReq = await onCreateRequisitionBackend(draft.items, {
        requiredDate: draft.requiredDate,
        priority: draft.priority,
        purpose: draft.purpose,
        remarks: draft.remarks,
      });
    }

    if (!createdReq) {
      toast.error("Failed to save requisition to database.");
      return;
    }

    setState({
      ...state,
      requisitions: [...state.requisitions, createdReq],
      inventory: state.inventory.map((it) => {
        const hit = draft.items.find((v) => v.materialId === it.materialId);
        return hit ? { ...it, onOrder: it.onOrder + hit.qty } : it;
      }),
    });
    setShowNew(false);
    toast.success(`${createdReq.ref} saved (${etb(createdReq.estimatedTotal)})`);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
        <button onClick={() => setTab("requisitions")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === "requisitions" ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950" : "text-muted-foreground hover:bg-accent"}`}>
          <FileText size={15} /> Requisitions <span className="ml-1 rounded-md bg-muted px-1.5 text-[10px]">{state.requisitions.length}</span>
        </button>
        <button onClick={() => setTab("pos")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === "pos" ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950" : "text-muted-foreground hover:bg-accent"}`}>
          <ShoppingCart size={15} /> Purchase Orders <span className="ml-1 rounded-md bg-muted px-1.5 text-[10px]">{state.purchaseOrders.length}</span>
        </button>
      </div>

      <AnimatePresence>
        {tab === "requisitions" ? (
          <motion.div key="req" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
                {statuses.map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === s ? "bg-amber-500 text-slate-950" : "text-muted-foreground hover:bg-accent"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setShowNew((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
                  <Plus size={15} /> New MR
                </button>
              </div>
            </div>

            {showNew && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mb-4 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <NewRequisitionModal onSubmit={addReq} materials={materials} setShowNew={setShowNew}  />
              </motion.div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5">Ref</th>
                    <th className="px-3 py-2.5">Work Package</th>
                    <th className="px-3 py-2.5">Items</th>
                    <th className="px-3 py-2.5 text-right">Est. Total (ETB)</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reqs.map((r) => {
                    const first = r.items[0];
                    const firstDesc = itemName(first ?? { materialId: "", qty: 0, needDate: "" });
                    return (
                      <tr key={r.id} onClick={() => setViewReq(r)}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3">
                          <div className="font-semibold">{r.ref}</div>
                          <div className="text-[11px] text-muted-foreground">{r.requestedBy} · {r.date}</div>
                        </td>
                        <td className="px-3 py-3"><span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">{r.workPackage}</span></td>
                        <td className="px-3 py-3">
                          <div className="text-xs">{r.items.length} line item(s)</div>
                          <div className="text-[11px] text-muted-foreground">{firstDesc}{r.items.length > 1 ? " +" + (r.items.length - 1) : ""}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold">{etb(r.estimatedTotal)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>{r.status.replace(/_/g, " ")}</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {r.status === "DRAFT" && (
                              <>
                                <button onClick={() => doSubmit(r)} disabled={busy?.id === r.id}
                                  className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950">
                                  <Check size={12} /> {busy?.id === r.id && busy.action === "submit" ? "Submitting…" : "Submit"}
                                </button>
                                <button onClick={() => doCancel(r)} disabled={busy?.id === r.id}
                                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50">
                                  Cancel
                                </button>
                              </>
                            )}
                            {r.status === "SUBMITTED" && (
                              <>
                                {isManager ? (
                                  <button onClick={() => doStartReview(r)} disabled={busy?.id === r.id}
                                    className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50">
                                    <ArrowRight size={12} /> {busy?.id === r.id && busy.action === "review" ? "Moving…" : "Start Review"}
                                  </button>
                                ) : (
                                  <button onClick={() => setViewReq(r)}
                                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-accent">
                                    <Eye size={12} /> Review
                                  </button>
                                )}
                                <button onClick={() => doCancel(r)} disabled={busy?.id === r.id}
                                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50">
                                  Cancel
                                </button>
                              </>
                            )}
                            {r.status === "UNDER_REVIEW" && isManager && (
                              <>
                                <button onClick={() => doApprove(r)} disabled={busy?.id === r.id}
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                                  {busy?.id === r.id && busy.action === "approve" ? "Approving…" : "Approve"}
                                </button>
                                <button onClick={() => doReject(r)} disabled={busy?.id === r.id}
                                  className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
                                  Reject
                                </button>
                                <button onClick={() => doCancel(r)} disabled={busy?.id === r.id}
                                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50">
                                  Cancel
                                </button>
                              </>
                            )}
                            {r.status === "UNDER_REVIEW" && !isManager && (
                              <button onClick={() => setViewReq(r)}
                                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-accent">
                                <Eye size={12} /> View
                              </button>
                            )}
                            {r.status === "APPROVED" && (
                              <button onClick={() => setShowPO(r)}
                                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-accent">
                                <Banknote size={12} /> PO
                              </button>
                            )}
                            </div>
                        </td>
                      </tr>
                    );
                  })}
                  {reqs.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">No requisitions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div key="po" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Search size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">PO vs GRN vs Invoice 3-way match enabled for Finance</span>
              </div>
              <div className="ml-auto">
                <button onClick={() => setTab("requisitions")}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-accent">
                  <Plus size={15} /> Create from APPROVED MR
                </button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {state.purchaseOrders.map((p) => {
                const grnCount = state.grns.filter((g) => g.poRef === p.ref).length;
                const poBusy = busy?.id === p.id;
                return (
                  <div key={p.id} onClick={() => setViewPO(p)}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") setViewPO(p); }}
                    className="cursor-pointer rounded-xl border border-border bg-card p-4 transition hover:border-amber-300 hover:shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold">{p.ref}</div>
                        <div className="text-[11px] text-muted-foreground">from {p.requisitionRef}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[p.status]}`}>{p.status.replace(/_/g, " ")}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-sm font-medium">
                      <ShoppingCart size={14} className="text-muted-foreground" /> {p.supplier}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText size={12} /> {p.items.reduce((s, i) => s + i.qty, 0)} units · {etb(p.total)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Truck size={12} /> {p.deliveryTerms}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-2 py-1.5 text-[11px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CircleCheck size={12} className={grnCount > 0 ? "text-emerald-500" : "text-slate-300"} /> GRN
                      </span>
                      <span className="font-semibold">{grnCount > 0 ? `${grnCount} received` : "not received"}</span>
                    </div>

                    {canActPO && (
                      <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
                        {p.status === "DRAFT" && (
                          <button onClick={() => doSubmitPO(p)} disabled={poBusy}
                            className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950">
                            <ArrowRight size={12} /> {poBusy && busy.action === "po-submit" ? "Submitting…" : "Submit"}
                          </button>
                        )}
                        {p.status === "PENDING_APPROVAL" && (
                          <>
                            <button onClick={() => doApprovePO(p)} disabled={poBusy}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                              <CircleCheck size={12} /> {poBusy && busy.action === "po-approve" ? "Approving…" : "Approve"}
                            </button>
                            <button onClick={() => setViewPO(p)}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent">
                              Cancel
                            </button>
                          </>
                        )}
                        {(p.status === "APPROVED" || p.status === "PARTIALLY_RECEIVED") && (
                          <button onClick={() => setViewPO(p)}
                            className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent">
                            Cancel
                          </button>
                        )}
                        {p.status === "FULLY_RECEIVED" && (
                          <button onClick={() => doClosePO(p)} disabled={poBusy}
                            className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950">
                            <CircleCheck size={12} /> {poBusy && busy.action === "po-close" ? "Closing…" : "Close"}
                          </button>
                        )}
                        {(p.status === "CANCELLED" || p.status === "CLOSED") && (
                          <span className="text-[11px] italic text-muted-foreground">No further actions</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {state.purchaseOrders.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <ShoppingCart size={28} />
                  No purchase orders yet — create one from an APPROVED requisition.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PO creation modal (from APPROVED MR) */}
      <AnimatePresence>
        {showPO && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setShowPO(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card sm:rounded-2xl"
            >
              <NewPOModal
                req={showPO}
                catalog={catalog}
                suppliers={suppliers}
                busy={busy?.id === showPO.id && busy.action === "po-create"}
                onCreateSupplier={onCreateSupplierBackend ? (d) => onCreateSupplierBackend!(d) : async () => null}
                onSubmit={addPO}
                onClose={() => setShowPO(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MR detail / review modal */}
      <AnimatePresence>
        {viewReq && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setViewReq(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card sm:rounded-2xl"
            >
              <RequisitionDetailModal
                r={viewReq}
                catalog={catalog}
                isManager={isManager}
                busy={busy}
                onClose={() => setViewReq(null)}
                onSubmit={(x) => void doSubmit(x).then(() => setViewReq((v) => (v && v.id === x.id ? null : v)))}
                onStartReview={(x) => void doStartReview(x).then(() => setViewReq((v) => (v && v.id === x.id ? null : v)))}
                onApprove={(x, comments) => void doApprove(x, comments).then(() => setViewReq((v) => (v && v.id === x.id ? null : v)))}
                onReject={(x, reason) => void doReject(x, reason).then(() => setViewReq((v) => (v && v.id === x.id ? null : v)))}
                onCancel={(x) => void doCancel(x).then(() => setViewReq((v) => (v && v.id === x.id ? null : v)))}
                onOpenPO={(x) => {
                  setShowPO(x);
                  setViewReq(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PO detail / review modal */}
      <AnimatePresence>
        {viewPO && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setViewPO(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card sm:rounded-2xl"
            >
              <PurchaseOrderDetailModal
                p={viewPO}
                catalog={catalog}
                reqs={state.requisitions}
                suppliers={suppliers}
                canAct={canActPO}
                busy={busy}
                onClose={() => setViewPO(null)}
                onSubmit={(x) => doSubmitPO(x)}
                onApprove={(x) => doApprovePO(x)}
                onCancel={(x, reason) => doCancelPO(x, reason)}
                onClosePO={(x) => doClosePO(x)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}