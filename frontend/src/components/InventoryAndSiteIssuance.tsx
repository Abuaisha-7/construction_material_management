import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Boxes, Warehouse, ArrowUpRight, ArrowDownRight, Printer, MapPin,
  Layers, Package, PackageCheck, TriangleAlert, X, Check, Recycle,
} from "lucide-react";
import {
  BIN_ZONES, WORK_PACKAGES, etb, fmtQty, type AppState, type UserRole,
  type IssueVoucher, type BinZone, type ReturnVoucher,
} from "../types";
import { MATERIALS } from "../data/mockData";

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  role: UserRole;
  focus: string | null;
}

type Tab = "inventory" | "issues" | "returns";

const ZONE_STYLE: Record<string, string> = {
  "Store A": "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Yard: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "Rebar Rack": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "Secure Cage": "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Hazardous: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

function NewIssueModal({ onSubmit }: { onSubmit: (v: IssueVoucher) => void }) {
  const [wp, setWp] = useState<IssueVoucher["workPackage"]>("Substructure");
  const [taskCode, setTaskCode] = useState("TASK");
  const [gang, setGang] = useState("Gang 1");
  const [rows, setRows] = useState([{ materialId: MATERIALS[0].id, qty: 1, binZone: "Store A" as BinZone }]);

  const upd = (i: number, patch: Partial<{ materialId: string; qty: number; binZone: BinZone }>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = () => {
    if (!taskCode.trim()) { toast.error("Task code is required"); return; }
    const valid = rows.filter((r) => r.qty > 0);
    const v: IssueVoucher = {
      id: "I" + Date.now(), ref: "SIV-" + Math.floor(Math.random() * 90000) + 10000,
      date: new Date().toISOString().slice(0, 10), workPackage: wp, taskCode, gang,
      items: valid, issuedBy: "Current Storekeeper", receivedBy: "Gang Foreman",
    };
    onSubmit(v);
  };

  return (
    <div className="p-6">
      <div className="text-lg font-bold tracking-tight">New Store Issue Voucher</div>
      <p className="text-xs text-muted-foreground">Issue materials to site against an approved task code.</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div><label className="text-xs font-semibold text-muted-foreground">Work Package</label>
          <select value={wp} onChange={(e) => setWp(e.target.value as IssueVoucher["workPackage"])}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none">
            {WORK_PACKAGES.map((p) => <option key={p}>{p}</option>)}
          </select></div>
        <div><label className="text-xs font-semibold text-muted-foreground">Task Code</label>
          <input value={taskCode} onChange={(e) => setTaskCode(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" /></div>
        <div><label className="text-xs font-semibold text-muted-foreground">Gang / Subcontractor</label>
          <input value={gang} onChange={(e) => setGang(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none" /></div>
      </div>
      <div className="mt-4 space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">Materials</label>
        {rows.map((r, i) => {
          const m = MATERIALS.find((x) => x.id === r.materialId);
          return (
            <div key={i} className="flex items-center gap-2">
              <select value={r.materialId} onChange={(e) => upd(i, { materialId: e.target.value })}
                className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm outline-none">
                {MATERIALS.map((mm) => <option key={mm.id} value={mm.id}>{mm.name}</option>)}
              </select>
              <input type="number" min={1} value={r.qty} onChange={(e) => upd(i, { qty: Number(e.target.value) })}
                className="h-9 w-16 rounded-lg border border-input bg-background px-2 text-right text-sm outline-none" />
              <select value={r.binZone} onChange={(e) => upd(i, { binZone: e.target.value as BinZone })}
                className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none">
                {BIN_ZONES.map((z) => <option key={z}>{z}</option>)}
              </select>
              <span className="w-12 text-right font-mono text-[11px] text-muted-foreground">{m ? etb(m.unitPrice * r.qty) : ""}</span>
              <button onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} disabled={rows.length === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40">
                <X size={15} />
              </button>
            </div>
          );
        })}
        <button onClick={() => setRows((rs) => [...rs, { materialId: MATERIALS[0].id, qty: 1, binZone: "Store A" }])}
          className="flex items-center gap-1.5 rounded-lg text-xs font-semibold text-amber-600 hover:text-amber-500">
          <Package size={14} /> Add issue item
        </button>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button onClick={submit} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
          <ArrowUpRight size={15} /> Issue to Site
        </button>
      </div>
    </div>
  );
}

export default function InventoryAndSiteIssuance({ state, setState, role, focus }: Props) {
  const [tab, setTab] = useState<Tab>(focus === "issue" ? "issues" : "inventory");
  const [showIssue, setShowIssue] = useState(false);

  const addIssue = (v: IssueVoucher) => {
    setState({
      ...state,
      issues: [...state.issues, v],
      inventory: state.inventory.map((it) => {
        const hit = v.items.find((i) => i.materialId === it.materialId);
        return hit ? { ...it, quantity: Math.max(0, it.quantity - hit.qty), reserved: it.reserved } : it;
      }),
    });
    setShowIssue(false);
    toast.success(`${v.ref} issued to ${v.gang} · ${v.taskCode}`);
  };

  const lowStock = useMemo(() => state.inventory.filter((it) => {
    const m = MATERIALS.find((x) => x.id === it.materialId);
    return m && it.quantity <= m.reorderPoint;
  }), [state.inventory]);

  const totalValue = useMemo(() => state.inventory.reduce((s, it) => {
    const m = MATERIALS.find((x) => x.id === it.materialId);
    return s + (m ? m.unitPrice * it.quantity : 0);
  }, 0), [state.inventory]);

  const returnsActive = tab === "returns";

  const addReturn = (rv: ReturnVoucher) => {
    setState({
      ...state,
      returns: [...state.returns, rv],
      inventory: state.inventory.map((it) => {
        const hit = rv.items.find((i) => i.materialId === it.materialId);
        return hit ? { ...it, quantity: it.quantity + hit.qty } : it;
      }),
    });
    toast.success(`${rv.ref} returned ${rv.items.reduce((s, i) => s + i.qty, 0)} unit(s)`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
        {([
          ["inventory", "Stock & Bin Map", Boxes],
          ["issues", "Issue Vouchers (SIV)", ArrowUpRight],
          ["returns", "Returns & Wastage", Recycle],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === key ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950" : "text-muted-foreground hover:bg-accent"}`}>
            <Icon size={15} /> {label}
            <span className="ml-1 rounded-md bg-muted px-1.5 text-[10px]">{key === "inventory" ? state.inventory.length : key === "issues" ? state.issues.length : state.returns.length}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "inventory" && (
          <motion.div key="inv" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Stock Value", value: etb(totalValue), icon: Warehouse, tone: "text-amber-600", ring: "bg-amber-100 dark:bg-amber-950" },
                { label: "Bin Zones", value: String(BIN_ZONES.length), icon: MapPin, tone: "text-sky-600", ring: "bg-sky-100 dark:bg-sky-950" },
                { label: "Low / Reorder", value: String(lowStock.length), icon: TriangleAlert, tone: "text-rose-600", ring: "bg-rose-100 dark:bg-rose-950" },
                { label: "On Order", value: String(state.inventory.reduce((s, i) => s + i.onOrder, 0)), icon: Layers, tone: "text-emerald-600", ring: "bg-emerald-100 dark:bg-emerald-950" },
              ].map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">{c.label}</span>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.ring}`}><c.icon size={16} className={c.tone} /></span>
                  </div>
                  <div className="mt-2 font-mono text-xl font-bold">{c.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Visual bin map */}
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {BIN_ZONES.map((z, i) => {
                const items = state.inventory.filter((it) => MATERIALS.find((m) => m.id === it.materialId)?.binZone === z);
                const value = items.reduce((s, it) => { const m = MATERIALS.find((x) => x.id === it.materialId); return s + (m ? m.unitPrice * it.quantity : 0); }, 0);
                return (
                  <motion.div key={z} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ZONE_STYLE[z]}`}><Warehouse size={15} /></span>
                      <div>
                        <div className="text-sm font-bold">{z}</div>
                        <div className="text-[11px] text-muted-foreground">{items.length} material types</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {items.slice(0, 3).map((it) => {
                        const m = MATERIALS.find((x) => x.id === it.materialId)!;
                        return (
                          <div key={it.materialId} className="flex items-center justify-between text-[11px]">
                            <span className="truncate text-muted-foreground">{m.name.split(" ")[0]} {m.name.includes("Rebar") ? "Ø" + m.name.split(" ")[1] : ""}</span>
                            <span className={`font-mono font-semibold ${it.quantity <= m.reorderPoint ? "text-rose-500" : "text-foreground"}`}>{fmtQty(it.quantity)} {m.unit}</span>
                          </div>
                        );
                      })}
                      {items.length === 0 && <div className="text-[11px] text-muted-foreground">Empty</div>}
                    </div>
                    <div className="mt-2 border-t border-border pt-1.5 text-[11px]">
                      <span className="text-muted-foreground">Value </span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{etb(value)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Full stock table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-sm font-bold">
                Live Stock Ledger
                <button onClick={() => toast.success("Stock ledger refreshed")}
                  className="font-normal text-muted-foreground hover:text-foreground">Refresh</button>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5">Material</th>
                    <th className="px-3 py-2.5">Bin</th>
                    <th className="px-3 py-2.5 text-right">On Hand</th>
                    <th className="px-3 py-2.5 text-right">Reserved</th>
                    <th className="px-3 py-2.5 text-right">On Order</th>
                    <th className="px-3 py-2.5 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {state.inventory.map((it) => {
                    const m = MATERIALS.find((x) => x.id === it.materialId)!;
                    const low = it.quantity <= m.reorderPoint;
                    const avail = it.quantity - it.reserved;
                    return (
                      <tr key={it.materialId} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-2.5">
                          <div className="font-medium">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground">{m.spec}</div>
                        </td>
                        <td className="px-3 py-2.5"><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ZONE_STYLE[m.binZone]}`}>{m.binZone}</span></td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`font-mono font-semibold ${low ? "text-rose-500" : ""}`}>{fmtQty(it.quantity)}</span>
                          <span className="text-[11px] text-muted-foreground"> {m.unit}</span>
                          {low && <div className="text-[10px] font-semibold text-rose-500">below {fmtQty(m.reorderPoint)}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{fmtQty(it.reserved)}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{fmtQty(it.onOrder)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold">{etb(m.unitPrice * it.quantity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === "issues" && (
          <motion.div key="issues" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Site dispatch against approved task codes, signed off by gang foreman.</div>
              {role === "Storekeeper" && (
                <button onClick={() => setShowIssue((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
                  <ArrowUpRight size={15} /> New SIV
                </button>
              )}
            </div>
            {showIssue && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mb-4 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <NewIssueModal onSubmit={addIssue} />
              </motion.div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              {state.issues.map((v) => (
                <div key={v.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold">{v.ref}</div>
                      <div className="text-[11px] text-muted-foreground">{v.date}</div>
                    </div>
                    <div className="text-right">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{v.workPackage}</span>
                      <div className="mt-1 font-mono text-[11px] text-muted-foreground">{v.taskCode}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Gang: <span className="font-semibold text-foreground">{v.gang}</span></div>
                  <div className="mt-2 space-y-1 border-t border-border pt-2">
                    {v.items.map((it, i) => {
                      const m = MATERIALS.find((x) => x.id === it.materialId)!;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span>{m.name} <span className="text-muted-foreground">× {fmtQty(it.qty)} {m.unit}</span></span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ZONE_STYLE[it.binZone]}`}>{it.binZone}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                    <span>Issued by {v.issuedBy}</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600"><Check size={12} /> {v.receivedBy}</span>
                  </div>
                  <button onClick={() => toast.success(`${v.ref} sent to printer queue`)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent">
                    <Printer size={13} /> Print Voucher
                  </button>
                </div>
              ))}
              {state.issues.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <ArrowUpRight size={28} /> No issue vouchers yet.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {returnsActive && (
          <motion.div key="returns" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="mb-3 text-sm text-muted-foreground">
              Returns of unused material and wastage variance vs BOQ standard allowance.
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Store returns */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <PackageCheck size={16} className="text-emerald-500" /> Store Return Vouchers (SRV)
                </div>
                <div className="mt-3 space-y-2">
                  {state.returns.map((rv) => (
                    <div key={rv.id} className="rounded-lg border border-border p-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold">{rv.ref}</span>
                        <span className="text-muted-foreground">{rv.date} · {rv.workPackage}</span>
                      </div>
                      {rv.items.map((it, i) => {
                        const m = MATERIALS.find((x) => x.id === it.materialId);
                        return (
                          <div key={i} className="mt-1.5 text-[11px] text-muted-foreground">
                            {m?.name} × {fmtQty(it.qty)} <span className="italic">({it.reason})</span>
                          </div>
                        );
                      })}
                      <div className="mt-1.5 text-[10px] text-muted-foreground">Approved by {rv.approvedBy}</div>
                    </div>
                  ))}
                  {state.returns.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground">No returns logged.</div>
                  )}
                </div>
              </div>

              {/* Wastage */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Recycle size={16} className="text-amber-500" /> Wastage vs BOQ Allowance
                </div>
                <div className="mt-3 space-y-3">
                  {state.wastage.map((w) => {
                    const overrun = Math.max(0, w.actualUsed - w.boqUsed);
                    const overAllow = overrun - (w.boqUsed * w.allowancePct) / 100;
                    const excessLoss = overAllow > 0 ? overAllow * w.unitPrice : 0;
                    return (
                      <div key={w.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">{w.materialName} <span className="text-muted-foreground">({w.workPackage})</span></span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${excessLoss > 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                            {excessLoss > 0 ? `${((overAllow / w.boqUsed) * 100).toFixed(1)}% over allowance` : "Within allowance"}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-muted">
                          <div className={`h-full rounded-full ${excessLoss > 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (w.actualUsed / w.boqUsed) * 100)}%` }} />
                        </div>
                        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                          <span>BOQ {fmtQty(w.boqUsed)} {w.unit} · Actual {fmtQty(w.actualUsed)} {w.unit} · Allow {w.allowancePct}%</span>
                          {excessLoss > 0
                            ? <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">ETB {excessLoss.toLocaleString()}</span>
                            : <Check size={13} className="text-emerald-500" />}
                        </div>
                      </div>
                    );
                  })}
                  {state.wastage.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground">No wastage records.</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}