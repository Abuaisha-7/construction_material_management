import { motion } from "framer-motion";
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Package, FlaskConical,
  TriangleAlert, CircleCheckBig, MapPin, Calendar, ArrowRight,
} from "lucide-react";
import { PROJECT, etb, type AppState, type UserRole, WORK_PACKAGES } from "../types";
import { MATERIALS } from "../data/mockData";

interface Props {
  state: AppState;
  role: UserRole;
}

const STAGES = ["Requisition", "PO", "GRN", "Lab QC", "Storage", "Site Issue", "Variance"];

export default function ProjectOverview({ state, role }: Props) {
  const budget = PROJECT.budget;
  const invoiced = 9840000;
  const committed = state.purchaseOrders.filter((p) => p.status !== "Closed")
    .reduce((s, p) => s + p.total, 0);
  const spent = 7135000;
  const variance = budget - (invoiced + committed);

  const warnItems = state.inventory.filter((i) => {
    const m = MATERIALS.find((x) => x.id === i.materialId);
    return m && i.quantity <= m.reorderPoint;
  });
  const pendingQc = state.inspections.filter((q) => q.status === "Pending Inspection");
  const pendingMr = state.requisitions.filter((r) => r.status === "Pending");

  const cards = [
    { label: "Total Budget", value: etb(budget), sub: "ET-SOM-JIG-2025-04", icon: Wallet, tone: "text-slate-700 dark:text-slate-200", ring: "bg-slate-100 dark:bg-slate-800" },
    { label: "Committed (PO)", value: etb(committed), sub: `${state.purchaseOrders.length} active orders`, icon: TrendingUp, tone: "text-amber-600 dark:text-amber-400", ring: "bg-amber-100 dark:bg-amber-950" },
    { label: "Invoiced / Spent", value: etb(spent), sub: "Paid + pending approval", icon: ArrowDownRight, tone: "text-sky-600 dark:text-sky-400", ring: "bg-sky-100 dark:bg-sky-950" },
    { label: "Remaining Variance", value: etb(variance), sub: variance > 0 ? "On track" : "Over budget", icon: ArrowUpRight, tone: variance > 0 ? "text-emerald-600" : "text-rose-600", ring: variance > 0 ? "bg-emerald-100 dark:bg-emerald-950" : "bg-rose-100 dark:bg-rose-950" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero project band */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="absolute inset-0 bg-[radial-gradient(1200px_300px_at_10%_-10%,rgba(245,158,11,0.16),transparent)]" />
        <div className="relative flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                ACTIVE PROJECT
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin size={12} /> {PROJECT.location}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar size={12} /> {PROJECT.started} → {PROJECT.targetDate}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{PROJECT.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Client: <span className="font-medium text-foreground">{PROJECT.client}</span>
              <span className="mx-2 text-border">|</span> Contract: {PROJECT.ref}
            </p>
          </div>
          <div className="flex items-center gap-4 lg:flex-col lg:items-end">
            <div className="text-right">
              <div className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                {PROJECT.progressPct}%
              </div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Physical progress</div>
            </div>
            <div className="h-2 w-40 rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${PROJECT.progressPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.ring}`}>
                <c.icon size={16} className={c.tone} strokeWidth={2} />
              </span>
            </div>
            <div className="mt-2 font-mono text-xl font-bold tracking-tight md:text-2xl">{c.value}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{c.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Stage pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Material Lifecycle Pipeline</h2>
          <span className="text-[11px] text-muted-foreground">Across {WORK_PACKAGES.length} work packages</span>
        </div>
        <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
          {STAGES.map((s, i) => {
            const active = i === 4;
            return (
              <div key={s} className="flex items-center">
                <div className={`flex shrink-0 flex-col items-center px-1`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${active ? "border-amber-500 bg-amber-500 text-slate-950" : "border-border bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <span className={`mt-1.5 whitespace-nowrap text-[10px] font-medium ${active ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>{s}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`mx-1 h-0.5 w-6 shrink-0 lg:w-12 ${i < 4 ? "bg-amber-400/60" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Alerts + breakdown + action row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Alerts */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <div className="flex items-center gap-2 text-sm font-bold">
            <TriangleAlert size={16} className="text-amber-500" /> Attention Required
          </div>
          <div className="mt-3 space-y-3">
            {warnItems.length > 0 && (
              <button className="flex w-full items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left dark:border-amber-800 dark:bg-amber-950/40">
                <Package size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    {warnItems.length} materials at / below reorder point
                  </div>
                  <div className="mt-0.5 text-[11px] text-amber-800/70 dark:text-amber-300/70">
                    Reorder recommended for {warnItems.slice(0, 3).map((i) => MATERIALS.find((m) => m.id === i.materialId)?.name.split(" ")[0]).join(", ")}...
                  </div>
                </div>
              </button>
            )}
            {pendingQc.length > 0 && (
              <button className="flex w-full items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-left dark:border-sky-800 dark:bg-sky-950/40">
                <FlaskConical size={16} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
                <div>
                  <div className="text-xs font-semibold text-sky-900 dark:text-sky-200">
                    {pendingQc.length} batch(es) pending lab inspection
                  </div>
                  <div className="mt-0.5 text-[11px] text-sky-800/70 dark:text-sky-300/70">
                    QC gate required before stock release
                  </div>
                </div>
              </button>
            )}
            {pendingMr.length > 0 && (
              <button className="flex w-full items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-left dark:border-rose-800 dark:bg-rose-950/40">
                <CircleCheckBig size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <div className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                    {pendingMr.length} requisition(s) awaiting approval
                  </div>
                  <div className="mt-0.5 text-[11px] text-rose-800/70 dark:text-rose-300/70">
                    Route through the approval matrix
                  </div>
                </div>
              </button>
            )}
            {warnItems.length === 0 && pendingQc.length === 0 && pendingMr.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CircleCheckBig size={28} className="text-emerald-500" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-xs text-muted-foreground">No outstanding operations flags.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Wastage mini-breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="flex items-center gap-2"><ArrowUpRight size={16} className="text-rose-500" /> Wastage vs BOQ Allowed</span>
            <span className="text-[11px] text-muted-foreground">{state.wastage.length} items</span>
          </div>
          <div className="mt-3 space-y-3">
            {state.wastage.map((w) => {
              const overrun = w.actualUsed - w.boqUsed;
              const overPct = Math.max(0, ((overrun / w.boqUsed) - w.allowancePct / 100) * 100);
              const loss = Math.max(0, overrun * w.unitPrice);
              return (
                <div key={w.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{w.materialName}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${overPct > 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                      {overPct > 0 ? `${overPct.toFixed(1)}% over` : "within "
                      }
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted">
                    <div className={`h-full rounded-full ${overPct > 0 ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (w.actualUsed / w.boqUsed) * 100)}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>BOQ {w.boqUsed} {w.unit} · Actual {w.actualUsed} {w.unit}</span>
                    {loss > 0 ? <span className="font-mono text-rose-600 dark:text-rose-400">{etb(loss)} loss</span> : <span className="text-emerald-600">OK</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick OD + role context */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <div className="text-sm font-bold">Your Desk · {role}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {role === "Project Manager" && "Executive budget variance control and final sign-off over ETB 100k."}
            {role === "Site Engineer" && "Create material requisitions, log daily issues and track site returns."}
            {role === "Storekeeper" && "Receive GRNs, manage bin locations and physical stock."}
            {role === "QA/QC Inspector" && "Run lab tests, batch quarantine and approve material release."}
            {role === "Procurement Officer" && "Review MRs, raise POs and track supplier delivery."}
            {role === "Finance Officer" && "PO vs GRN vs Invoice 3-way matching and payment authorizations."}
          </p>
          <div className="mt-4 rounded-lg bg-slate-900 p-4 text-white dark:bg-slate-800">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Quick stats</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div><div className="font-mono text-lg font-bold text-amber-400">{state.requisitions.length}</div><div className="text-[10px] text-slate-400">Requisitions</div></div>
              <div><div className="font-mono text-lg font-bold">{state.inventory.length}</div><div className="text-[10px] text-slate-400">Stock items</div></div>
              <div><div className="font-mono text-lg font-bold">{state.grns.length}</div><div className="text-[10px] text-slate-400">GRNs</div></div>
              <div><div className="font-mono text-lg font-bold text-emerald-400">{state.issues.length}</div><div className="text-[10px] text-slate-400">Issue vouchers</div></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}