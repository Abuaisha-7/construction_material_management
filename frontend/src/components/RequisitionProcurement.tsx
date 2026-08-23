import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FileText, ShoppingCart, Plus, Check, X, ArrowRight, Truck, Banknote,
  CircleCheck, Search,
} from "lucide-react";
import {
  WORK_PACKAGES, etb, type AppState, type UserRole, type PurchaseOrder as Purchy, type Requisition,
} from "../types";
import { MATERIALS } from "../data/mockData";

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  role: UserRole;
  focus: string | null;
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
};

function NewRequisitionModal({ onSubmit }: { onSubmit: (r: Requisition, inv: { materialId: string; qty: number }[]) => void }) {
  const [wp, setWp] = useState(WORK_PACKAGES[0]);
  const [rows, setRows] = useState([{ materialId: MATERIALS[0].id, qty: 1 }]);
  const [needDate, setNeedDate] = useState("2025-07-01");

  const updRow = (i: number, patch: Partial<{ materialId: string; qty: number }>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = () => {
    const valid = rows.filter((r) => r.qty > 0);
    if (valid.length === 0) return;
    const items = valid.map((r) => ({ materialId: r.materialId, qty: r.qty, needDate }));
    const estimatedTotal = valid.reduce((s, r) => {
      const m = MATERIALS.find((x) => x.id === r.materialId);
      return s + (m ? m.unitPrice * r.qty : 0);
    }, 0);
    const req: Requisition = {
      id: "R" + Date.now(), ref: "MR-" + Math.floor(Math.random() * 90000) + 10000, requestedBy: "Current User",
      workPackage: wp as Requisition["workPackage"], date: new Date().toISOString().slice(0, 10),
      status: "Draft", items, approvalTrace: [], siteEngSigned: false, pmSigned: false,
      estimatedTotal,
    };
    onSubmit(req, valid);
  };

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
        {rows.map((r, i) => {
          const m = MATERIALS.find((x) => x.id === r.materialId);
          return (
            <div key={i} className="flex items-center gap-2">
              <select
                value={r.materialId}
                onChange={(e) => updRow(i, { materialId: e.target.value })}
                className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2"
              >
                {MATERIALS.map((mm) => <option key={mm.id} value={mm.id}>{mm.name} · {mm.unit}</option>)}
              </select>
              <input
                type="number" min={1} value={r.qty}
                onChange={(e) => updRow(i, { qty: Number(e.target.value) })}
                className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-right text-sm outline-none ring-ring focus:ring-2"
              />
              <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                {m ? etb(m.unitPrice * r.qty) : ""}
              </span>
              <button
                onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                disabled={rows.length === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
        <button
          onClick={() => setRows((rs) => [...rs, { materialId: MATERIALS[0].id, qty: 1 }])}
          className="flex items-center gap-1.5 rounded-lg text-xs font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400"
        >
          <Plus size={14} /> Add line item
        </button>
      </div>

      <div className="mt-3 flex items-end justify-between rounded-lg bg-muted/50 p-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Need By</label>
          <input type="date" value={needDate} onChange={(e) => setNeedDate(e.target.value)}
            className="mt-1 h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none" />
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground">Estimated Total</div>
          <div className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
            {etb(rows.reduce((s, r) => { const m = MATERIALS.find((x) => x.id === r.materialId); return s + (m ? m.unitPrice * r.qty : 0); }, 0))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button onClick={submit} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
          <Check size={15} /> Save Requisition
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
          const m = MATERIALS.find((x) => x.id === it.materialId)!;
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
              const m = MATERIALS.find((x) => x.id === it.materialId)!;
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
            const m = MATERIALS.find((x) => x.id === it.materialId)!; return s + it.qty * m.unitPrice;
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

export default function RequisitionProcurement({ state, setState, role, focus }: Props) {
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

  const approve = (r: Requisition) => {
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

  const addReq = (r: Requisition, inv: { materialId: string; qty: number }[]) => {
    setState({
      ...state,
      requisitions: [...state.requisitions, r],
      inventory: state.inventory.map((it) => {
        const hit = inv.find((v) => v.materialId === it.materialId);
        return hit ? { ...it, onOrder: it.onOrder + hit.qty } : it;
      }),
    });
    setShowNew(false);
    toast.success(`${r.ref} saved (${etb(r.estimatedTotal)})`);
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
                <NewRequisitionModal onSubmit={addReq} />
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
                    const m = MATERIALS.find((x) => x.id === r.items[0]?.materialId);
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
                    {role === "Procurement Officer" && p.status !== "Closed" && (
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