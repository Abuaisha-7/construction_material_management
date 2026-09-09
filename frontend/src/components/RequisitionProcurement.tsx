import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FileText, ShoppingCart, Plus, Check, X, ArrowRight, Truck, Banknote,
  CircleCheck, Search, Sparkles,
} from "lucide-react";
import {
  WORK_PACKAGES, etb, type AppState, type UserRole, type PurchaseOrder as Purchy, type Requisition, type Material,
  ProjectMeta,
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
  onCreateRequisitionBackend?: (
    items: MRItem[],
    opts?: { requiredDate?: string; priority?: MRPriority; purpose?: string; remarks?: string }
  ) => Promise<Requisition | null>;
  onApproveRequisitionBackend?: (id: string) => Promise<boolean>;
}

type Tab = "requisitions" | "pos";

const STATUS_STYLE: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  Issued: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  Delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Closed: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  // Backend PurchaseOrderStatus support
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  PARTIALLY_RECEIVED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  FULLY_RECEIVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  CLOSED: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

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

function NewPOModal({ req, onSubmit }: { req: Requisition | null; onSubmit: (p: Purchy) => void }) {
  const [supplier, setSupplier] = useState("Dangote Cement PLC");
  const [terms, setTerms] = useState("CFR site, 14 days");
  const mode = req ? "requisition" : "ad-hoc";

  const submit = () => {
    const items = req
      ? req.items.map((it) => {
        const m = MATERIALS.find((x) => x.id === it.materialId) ?? { name: "Unknown material", unitPrice: 0 };
        return { materialId: it.materialId, qty: it.qty, unitPrice: m.unitPrice };
      })
      : [{ materialId: MATERIALS[0].id, qty: 100, unitPrice: MATERIALS[0].unitPrice }];
    const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const po: Purchy = {
      id: "P" + Date.now(), ref: "PO-" + Math.floor(Math.random() * 90000) + 10000, requisitionRef: req ? req.ref : "AD-HOC",
      supplier, date: new Date().toISOString().slice(0, 10), items, status: "Draft",
      deliveryTerms: terms, total,
    };
    onSubmit(po);
  };

  return (
    <div className="p-6">
      <div className="text-lg font-bold tracking-tight">Issue Purchase Order</div>
      <p className="text-xs text-muted-foreground">
        {mode === "requisition" ? `Generated from ${req!.ref}` : "Ad-hoc purchase order"}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">Supplier</label>
          <select value={supplier} onChange={(e) => setSupplier(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none">
            <option>Dangote Cement PLC</option>
            <option>Mugher Cement Enterprise</option>
            <option>Akaki Steel PLC</option>
            <option>Somali Aggregate Supply</option>
            <option>Haramaya Fencing Co.</option>
            <option>Jigjiga Building Mart</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">Delivery Terms</label>
          <input value={terms} onChange={(e) => setTerms(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
            <tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Unit</th></tr>
          </thead>
          <tbody>
            {(req ? req.items : [{ materialId: MATERIALS[0].id, qty: 100 }]).map((it, i) => {
              const m = MATERIALS.find((x) => x.id === it.materialId) ?? { name: "Unknown material", unitPrice: 0 };
              return (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2 text-right font-mono">{it.qty}</td>
                  <td className="px-3 py-2 text-right font-mono">{etb(m.unitPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-right">
        <span className="text-[11px] text-muted-foreground">PO Total · </span>
        <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
          {etb(((req ? req.items : [{ materialId: MATERIALS[0].id, qty: 100 }]) as { materialId: string; qty: number }[]).reduce((s, it) => {
            const m = MATERIALS.find((x) => x.id === it.materialId) ?? { name: "Unknown material", unitPrice: 0 }; return s + it.qty * m.unitPrice;
          }, 0))}
        </span>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button onClick={submit} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
          <Truck size={15} /> Issue PO
        </button>
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
  onCreateRequisitionBackend,
  onApproveRequisitionBackend,
}: Props) {
  const [tab, setTab] = useState<Tab>(focus === "po" ? "pos" : "requisitions");
  const [showNew, setShowNew] = useState(false);
  const [showPO, setShowPO] = useState<false | Requisition | "ad">(false);
  const [filter, setFilter] = useState("All");

  const reqs = useMemo(() => {
    if (filter === "All") return state.requisitions;
    return state.requisitions.filter((r) => r.status === filter);
  }, [state.requisitions, filter]);

  const statuses = ["All", "Draft", "Pending", "Approved", "Rejected"];

  const canApprove = (r: Requisition) => {
    if (role === "Site Engineer" && !r.siteEngSigned) return true;
    if (role === "Project Manager" && r.siteEngSigned && !r.pmSigned) return true;
    return false;
  };

  const approve = async (r: Requisition) => {
    if (onApproveRequisitionBackend && (r.id.length > 10 || r.id.includes("-"))) {
      await onApproveRequisitionBackend(r.id);
    }
    const trace = [...r.approvalTrace];
    let siteEngSigned = r.siteEngSigned;
    let pmSigned = r.pmSigned;
    if (role === "Site Engineer" && !siteEngSigned) { siteEngSigned = true; trace.push("Site Eng: approved"); }
    else if (role === "Project Manager" && siteEngSigned && !pmSigned) { pmSigned = true; trace.push("PM: approved"); }
    const done = siteEngSigned && pmSigned;
    setState({
      ...state,
      requisitions: state.requisitions.map((x) =>
        x.id === r.id ? { ...x, siteEngSigned, pmSigned, approvalTrace: trace, status: done ? "Approved" : "Pending" } : x),
    });
    toast.success(done ? `${r.ref} fully approved` : `${r.ref} advanced in approval matrix`);
  };

  const togglePOStatus = (p: Purchy) => {
    const order: Purchy["status"][] = ["Draft", "Issued", "Shipped", "Delivered", "Closed"];
    const idx = order.indexOf(p.status);
    const next = order[Math.min(idx + 1, order.length - 1)];
    setState({ ...state, purchaseOrders: state.purchaseOrders.map((x) => (x.id === p.id ? { ...x, status: next } : x)) });
    toast.success(`${p.ref} → ${next}`);
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

  const addPO = (p: Purchy) => {
    setState({
      ...state,
      purchaseOrders: [...state.purchaseOrders, p],
    });
    setShowPO(false);
    toast.success(`${p.ref} issued to ${p.supplier}`);
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
                    <th className="px-3 py-2.5 text-center">Approval Trace</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reqs.map((r) => {
                    const m = materials.find((x) => x.id === r.items[0]?.materialId);
                    return (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3">
                          <div className="font-semibold">{r.ref}</div>
                          <div className="text-[11px] text-muted-foreground">{r.requestedBy} · {r.date}</div>
                        </td>
                        <td className="px-3 py-3"><span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">{r.workPackage}</span></td>
                        <td className="px-3 py-3">
                          <div className="text-xs">{r.items.length} line item(s)</div>
                          <div className="text-[11px] text-muted-foreground">{m?.name ?? ""}{r.items.length > 1 ? " +" + (r.items.length - 1) : ""}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold">{etb(r.estimatedTotal)}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span title="Site Eng" className={`h-2 w-2 rounded-full ${r.siteEngSigned ? "bg-emerald-500" : "bg-slate-300"}`} />
                            <ArrowRight size={11} className="text-muted-foreground" />
                            <span title="PM" className={`h-2 w-2 rounded-full ${r.pmSigned ? "bg-emerald-500" : "bg-slate-300"}`} />
                            <ArrowRight size={11} className="text-muted-foreground" />
                            <span title="Procurement" className={`h-2 w-2 rounded-full ${r.status === "Approved" ? "bg-emerald-500" : "bg-slate-300"}`} />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canApprove(r) && (
                              <button onClick={() => approve(r)}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500">
                                Approve
                              </button>
                            )}
                            {r.status === "Approved" && (
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
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">No requisitions found.</td></tr>
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
                <button onClick={() => setShowPO("ad" as unknown as Requisition)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
                  <Plus size={15} /> New PO
                </button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {state.purchaseOrders.map((p) => {
                const grnCount = state.grns.filter((g) => g.poRef === p.ref).length;
                return (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold">{p.ref}</div>
                        <div className="text-[11px] text-muted-foreground">from {p.requisitionRef}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[p.status]}`}>{p.status}</span>
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
                    {role === "Procurement Officer" &&
                      p.status !== "Closed" &&
                      p.status !== "CLOSED" &&
                      p.status !== "Cancelled" &&
                      p.status !== "CANCELLED" && (
                        <button onClick={() => togglePOStatus(p)}
                          className="mt-3 w-full rounded-lg border border-border py-1.5 text-xs font-semibold hover:bg-accent">
                          Advance to next stage
                        </button>
                      )}
                  </div>
                );
              })}
              {state.purchaseOrders.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <ShoppingCart size={28} /> No purchase orders yet.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PO modal */}
      <AnimatePresence>
        {showPO && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setShowPO(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card sm:rounded-2xl"
            >
              <NewPOModal req={showPO && showPO !== "ad" ? showPO : null} onSubmit={addPO} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}