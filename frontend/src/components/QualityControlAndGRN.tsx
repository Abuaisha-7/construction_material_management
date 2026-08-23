import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Truck, FlaskConical, Check, X, ShieldCheck, PackageCheck, PackageX,
  Boxes, Microscope, UserRound, FileText, RefreshCcw,
} from "lucide-react";
import { type AppState, type UserRole, type GRN as GRNType, type QCInspection } from "../types";
import { MATERIALS } from "../data/mockData";

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  role: UserRole;
  focus: string | null;
}

type Tab = "grn" | "qc";

const QC_STYLE: Record<string, string> = {
  "Pending Inspection": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "Approved for Use": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Quarantined: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

const COND_STYLE: Record<string, string> = {
  Good: "text-emerald-600 dark:text-emerald-400",
  Damaged: "text-rose-600 dark:text-rose-400",
  Short: "text-amber-600 dark:text-amber-400",
};

function NewGRNModal({ onSubmit }: { onSubmit: (g: GRNType) => void }) {
  const [poRef, setPoRef] = useState("");
  const [supplier, setSupplier] = useState("Dangote Cement PLC");
  const [waybill, setWaybill] = useState("");
  const [truck, setTruck] = useState("");
  const [rows, setRows] = useState<{ materialId: string; qty: number; condition: "Good" | "Damaged" | "Short" }[]>([
    { materialId: MATERIALS[0].id, qty: 1, condition: "Good" },
  ]);

  const upd = (i: number, patch: Partial<{ materialId: string; qty: number; condition: "Good" | "Damaged" | "Short" }>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = () => {
    if (!waybill.trim()) { toast.error("Waybill number is required"); return; }
    const valid = rows.filter((r) => r.qty > 0);
    const g: GRNType = {
      id: "G" + Date.now(),
      ref: "GRN-" + Math.floor(Math.random() * 90000) + 10000,
      poRef: poRef || "PO-AD-HOC",
      supplier, date: new Date().toISOString().slice(0, 10),
      waybill, truckPlate: truck || "N/A",
      items: valid, status: "Logged", receivedBy: "Current Storekeeper",
    };
    onSubmit(g);
  };

  return (
    <div className="p-6">
      <div className="text-lg font-bold tracking-tight">Log Goods Receipt Note</div>
      <p className="text-xs text-muted-foreground">Gate inbound delivery: waybill, truck plate and physical condition check.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold text-muted-foreground">Supplier</label>
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" /></div>
        <div><label className="text-xs font-semibold text-muted-foreground">PO Ref</label>
          <input value={poRef} onChange={(e) => setPoRef(e.target.value)} placeholder="PO-2025-121" className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" /></div>
        <div><label className="text-xs font-semibold text-muted-foreground">Waybill No.</label>
          <input value={waybill} onChange={(e) => setWaybill(e.target.value)} placeholder="WB-00000" className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" /></div>
        <div><label className="text-xs font-semibold text-muted-foreground">Truck Plate</label>
          <input value={truck} onChange={(e) => setTruck(e.target.value)} placeholder="AB 3-00000" className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" /></div>
      </div>
      <div className="mt-4 space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">Received Items</label>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <select value={r.materialId} onChange={(e) => upd(i, { materialId: e.target.value })}
              className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm outline-none">
              {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input type="number" min={1} value={r.qty} onChange={(e) => upd(i, { qty: Number(e.target.value) })}
              className="h-9 w-16 rounded-lg border border-input bg-background px-2 text-right text-sm outline-none" />
            <select value={r.condition} onChange={(e) => upd(i, { condition: e.target.value as "Good" })}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none">
              <option value="Good">Good</option><option value="Damaged">Damaged</option><option value="Short">Short</option>
            </select>
            <button onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} disabled={rows.length === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40">
              <X size={15} />
            </button>
          </div>
        ))}
        <button onClick={() => setRows((rs) => [...rs, { materialId: MATERIALS[0].id, qty: 1, condition: "Good" }])}
          className="flex items-center gap-1.5 rounded-lg text-xs font-semibold text-amber-600 hover:text-amber-500">
          <Boxes size={14} /> Add received item
        </button>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button onClick={submit} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
          <Truck size={15} /> Log GRN
        </button>
      </div>
    </div>
  );
}

export default function QualityControlAndGRN({ state, setState, role, focus }: Props) {
  const [tab, setTab] = useState<Tab>(focus === "qc" ? "qc" : "grn");
  const [showNew, setShowNew] = useState(false);

  const addGRN = (g: GRNType) => {
    setState({
      ...state,
      grns: [...state.grns, g],
      inventory: state.inventory.map((it) => {
        const hit = g.items.find((i) => i.materialId === it.materialId && i.condition === "Good");
        return hit ? { ...it, quantity: it.quantity + hit.qty, reserved: it.reserved } : it;
      }),
    });
    setShowNew(false);
    toast.success(`${g.ref} logged · ${g.items.length} item(s)`);
  };

  const setQcStatus = (q: QCInspection, status: QCInspection["status"]) => {
    setState({
      ...state,
      inspections: state.inspections.map((x) => (x.id === q.id ? { ...x, status } : x)),
    });
    const msg = status === "Approved for Use" ? "released to store inventory"
      : status === "Quarantined" ? "placed on hold for further testing"
      : "rejected / returned to supplier";
    toast[status === "Rejected" ? "error" : status === "Approved for Use" ? "success" : "warning"](`${q.ref} ${status} · ${msg}`);
  };

  const canDecide = role === "QA/QC Inspector" || role === "Project Manager";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
        <button onClick={() => setTab("grn")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === "grn" ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950" : "text-muted-foreground hover:bg-accent"}`}>
          <Truck size={15} /> Gate & GRN <span className="ml-1 rounded-md bg-muted px-1.5 text-[10px]">{state.grns.length}</span>
        </button>
        <button onClick={() => setTab("qc")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === "qc" ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950" : "text-muted-foreground hover:bg-accent"}`}>
          <FlaskConical size={15} /> Lab & QA/QC <span className="ml-1 rounded-md bg-muted px-1.5 text-[10px]">{state.inspections.length}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "grn" ? (
          <motion.div key="grn" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Inbound gate deliveries with physical condition checks.
              </div>
              {(role === "Storekeeper" || role === "Procurement Officer") && (
                <button onClick={() => setShowNew((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
                  <Truck size={15} /> New GRN
                </button>
              )}
            </div>
            {showNew && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mb-4 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <NewGRNModal onSubmit={addGRN} />
              </motion.div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5">Ref</th>
                    <th className="px-3 py-2.5">PO / Supplier</th>
                    <th className="px-3 py-2.5">Gate Details</th>
                    <th className="px-3 py-2.5">Items</th>
                    <th className="px-3 py-2.5 text-center">Conditions</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.grns.map((g) => (
                    <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-3">
                        <div className="font-semibold">{g.ref}</div>
                        <div className="text-[11px] text-muted-foreground">{g.date} · {g.receivedBy}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs font-medium">{g.supplier}</div>
                        <div className="text-[11px] text-muted-foreground">{g.poRef}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 text-xs"><FileText size={12} className="text-muted-foreground" /> {g.waybill}</div>
                        <div className="text-[11px] text-muted-foreground">Truck {g.truckPlate}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs">{g.items.reduce((s, i) => s + i.qty, 0)} units</div>
                        {g.items.slice(0, 2).map((it, idx) => {
                          const m = MATERIALS.find((x) => x.id === it.materialId);
                          return <div key={idx} className="text-[11px] text-muted-foreground">{m?.name ?? it.materialId} × {it.qty}</div>;
                        })}
                        {g.items.length > 2 && <div className="text-[11px] text-muted-foreground">+{g.items.length - 2} more</div>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-center gap-1">
                          {["Good", "Damaged", "Short"].map((c) => {
                            const count = g.items.filter((i) => i.condition === c).length;
                            if (count === 0) return null;
                            return <span key={c} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${COND_STYLE[c]}`}>{c} {count}</span>;
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${g.status === "Logged" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : g.status === "Pending QC" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {state.grns.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">No GRNs logged yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div key="qc" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Microscope size={15} className="text-emerald-500" />
              Mandatory QC gate before stock release. Cube tests, rebar tensile and silt checks per Ethiopian standards.
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {state.inspections.map((q) => {
                const m = MATERIALS.find((x) => x.id === q.materialId);
                const anyFail = q.tests.some((t) => !t.pass);
                return (
                  <div key={q.id} className={`rounded-xl border bg-card p-4 ${q.status === "Quarantined" ? "border-orange-300 dark:border-orange-800" : q.status === "Rejected" ? "border-rose-300 dark:border-rose-800" : "border-border"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">{q.ref} · {q.grnRef}</div>
                        <div className="font-bold">{q.materialName}</div>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${QC_STYLE[q.status]}`}>
                        {q.status === "Approved for Use" ? <PackageCheck size={12} /> : q.status === "Rejected" ? <PackageX size={12} /> : <ShieldCheck size={12} />}
                        {q.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">{q.batch}</span>
                      <span>{q.testDate}</span>
                      <span className="flex items-center gap-0.5"><UserRound size={11} /> {q.inspector}</span>
                    </div>

                    <div className="mt-3 overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/40 text-muted-foreground">
                          <tr><th className="px-2 py-1.5 text-left font-semibold">Test</th><th className="px-2 py-1.5 text-left font-semibold">Result</th><th className="px-2 py-1.5 text-left font-semibold">Standard</th><th className="px-2 py-1.5 text-right">Pass</th></tr>
                        </thead>
                        <tbody>
                          {q.tests.map((t) => (
                            <tr key={t.id} className="border-t border-border">
                              <td className="px-2 py-1.5 font-medium">{t.name}</td>
                              <td className="px-2 py-1.5 font-mono">{t.value}</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{t.standard}</td>
                              <td className="px-2 py-1.5 text-right">
                                {t.pass
                                  ? <Check size={14} className="ml-auto text-emerald-500" />
                                  : <X size={14} className="ml-auto text-rose-500" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {q.note && <div className="mt-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">Note: {q.note}</div>}

                    {canDecide && q.status === "Pending Inspection" && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button onClick={() => setQcStatus(q, "Approved for Use")}
                          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500">
                          <Check size={13} /> Approve
                        </button>
                        <button onClick={() => setQcStatus(q, "Quarantined")}
                          className="flex items-center justify-center gap-1 rounded-lg bg-orange-500 py-1.5 text-xs font-semibold text-white hover:bg-orange-400">
                          <ShieldCheck size={13} /> Hold
                        </button>
                        <button onClick={() => setQcStatus(q, "Rejected")}
                          className="flex items-center justify-center gap-1 rounded-lg bg-rose-600 py-1.5 text-xs font-semibold text-white hover:bg-rose-500">
                          <X size={13} /> Reject
                        </button>
                      </div>
                    )}
                    {canDecide && q.status !== "Pending Inspection" && (
                      <button onClick={() => setQcStatus(q, "Pending Inspection")}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent">
                        <RefreshCcw size={13} /> Reopen for re-inspection
                      </button>
                    )}
                    {anyFail && q.status === "Approved for Use" && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
                        <PackageX size={12} /> Some tests below threshold
                      </div>
                    )}
                  </div>
                );
              })}
              {state.inspections.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <FlaskConical size={28} /> No inspections recorded.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}