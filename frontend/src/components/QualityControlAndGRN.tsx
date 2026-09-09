import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Truck, FlaskConical, Check, X, ShieldCheck, PackageCheck, PackageX,
  Microscope, UserRound, FileText, RefreshCcw, CircleCheck, Eye,
} from "lucide-react";
import {
  type AppState,
  type UserRole,
  type GRN as GRNType,
  type GRNItem,
  type QCInspection,
  type Material,
  type Supplier,
  type PurchaseOrder,
} from "../types";
import { MATERIALS } from "../data/mockData";

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  role: UserRole;
  focus: string | null;
  materials?: Material[];
  suppliers?: Supplier[];
  onConfirmGrnBackend?: (id: string) => Promise<boolean>;
  onRejectGrnBackend?: (id: string, reason: string) => Promise<boolean>;
  onCreateGrnBackend?: (payload: GrnCreatePayload) => Promise<boolean>;
  onCompleteInspectionBackend?: (id: string, result: "ACCEPTED" | "REJECTED" | "QUARANTINED", note?: string) => Promise<boolean>;
}

export type GrnCreatePayload = {
  projectId: string;
  supplierId: string;
  purchaseOrderId: string;
  deliveryDate: string;
  deliveryNoteNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  remarks?: string;
  items: {
    materialId: string;
    deliveredQuantity: number;
    damagedQuantity?: number;
    rejectedQuantity?: number;
    unitId: string;
    batchNumber?: string;
    remarks?: string;
  }[];
};

type Tab = "grn" | "qc";

const QC_STYLE: Record<string, string> = {
  "Pending Inspection": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "Approved for Use": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Quarantined: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

const GRN_STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  AWAITING_INSPECTION: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PARTIALLY_ACCEPTED: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  POSTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const GRN_COND_STYLE: Record<string, string> = {
  Good: "text-emerald-600 dark:text-emerald-400",
  Damaged: "text-rose-600 dark:text-rose-400",
  Short: "text-amber-600 dark:text-amber-400",
};

const COND_STYLE: Record<string, string> = {
  Good: "text-emerald-600 dark:text-emerald-400",
  Damaged: "text-rose-600 dark:text-rose-400",
  Short: "text-amber-600 dark:text-amber-400",
};

const today = () => new Date().toISOString().slice(0, 10);

const fmtQty = (n?: number) => (n == null ? "—" : n.toLocaleString());

const etb2 = (n: number) =>
  "ETB " + n.toLocaleString(undefined, { maximumFractionDigits: 2 });

const condOf = (it: GRNItem): "Good" | "Damaged" | "Short" => {
  if ((it.rejectedQty ?? 0) > 0) return "Short";
  if ((it.damagedQty ?? 0) > 0) return "Damaged";
  return "Good";
};

function NewGRNModal({
  purchaseOrders,
  suppliers,
  onCancel,
  onSubmit,
}: {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  onCancel: () => void;
  onSubmit: (payload: GrnCreatePayload) => Promise<boolean>;
}) {
  const approvedPOs = purchaseOrders.filter(
    (p) => p.status === "APPROVED" || p.status === "PARTIALLY_RECEIVED"
  );

  const [poId, setPoId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(today());
  const [waybill, setWaybill] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [driver, setDriver] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<
    {
      materialId: string;
      name?: string;
      unit?: string;
      unitId: string;
      orderedQty: number;
      remaining: number;
      delivered: number;
      damaged: number;
      rejected: number;
      batchNumber: string;
      remarks: string;
    }[]
  >([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectPo = (id: string) => {
    setPoId(id);
    setError("");
    const po = approvedPOs.find((p) => p.id === id);
    if (!po) {
      setRows([]);
      setSupplierId("");
      return;
    }
    setSupplierId(po.supplierId || "");
    const nextRows = po.items
      .filter((it) => {
        const received = it.receivedQty ?? 0;
        return it.qty - received > 0 && !!it.unitId;
      })
      .map((it) => {
        const received = it.receivedQty ?? 0;
        const remaining = Math.max(0, it.qty - received);
        return {
          materialId: it.materialId,
          name: it.name,
          unit: it.unit,
          unitId: it.unitId!,
          orderedQty: it.qty,
          remaining,
          delivered: remaining,
          damaged: 0,
          rejected: 0,
          batchNumber: "",
          remarks: "",
        };
      });
    setRows(nextRows);
  };

  const upd = (
    i: number,
    patch: Partial<{
      delivered: number;
      damaged: number;
      rejected: number;
      batchNumber: string;
      remarks: string;
    }>
  ) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = async () => {
    setError("");
    const po = approvedPOs.find((p) => p.id === poId);
    if (!po) {
      setError("Select an APPROVED purchase order.");
      return;
    }
    if (!supplierId) {
      setError("Supplier is required.");
      return;
    }
    if (po.supplierId && supplierId && po.supplierId !== supplierId) {
      setError("Supplier must match the PO's supplier.");
      return;
    }
    if (!po.projectId) {
      setError("Selected PO has no project — cannot create a GRN.");
      return;
    }
    if (!deliveryDate) {
      setError("Delivery date is required.");
      return;
    }
    if (rows.length === 0) {
      setError("No deliverable items remaining on this PO.");
      return;
    }
    for (const r of rows) {
      if (r.delivered <= 0) {
        setError(`Delivered quantity must be greater than zero for ${r.name || r.materialId}.`);
        return;
      }
      if (r.delivered > r.remaining) {
        setError(`Delivered quantity exceeds remaining PO quantity for ${r.name || r.materialId}.`);
        return;
      }
      if (r.damaged < 0 || r.rejected < 0) {
        setError(`Quantities cannot be negative for ${r.name || r.materialId}.`);
        return;
      }
      if (r.damaged + r.rejected > r.delivered) {
        setError(`Damaged + rejected cannot exceed delivered for ${r.name || r.materialId}.`);
        return;
      }
    }

    setSubmitting(true);
    const ok = await onSubmit({
      projectId: po.projectId,
      supplierId,
      purchaseOrderId: po.id,
      deliveryDate,
      deliveryNoteNumber: waybill.trim() || undefined,
      vehicleNumber: vehicle.trim() || undefined,
      driverName: driver.trim() || undefined,
      remarks: remarks.trim() || undefined,
      items: rows.map((r) => ({
        materialId: r.materialId,
        deliveredQuantity: r.delivered,
        damagedQuantity: r.damaged,
        rejectedQuantity: r.rejected,
        unitId: r.unitId,
        batchNumber: (r.batchNumber || "").trim() || undefined,
        remarks: (r.remarks || "").trim() || undefined,
      })),
    });
    if (!ok) {
      setSubmitting(false);
    }
  };

  const inputCls =
    "mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none";

  return (
    <div className="p-6">
      <div className="text-lg font-bold tracking-tight">Receive Goods (GRN · DRAFT)</div>
      <p className="text-xs text-muted-foreground">
        Create a goods receipt note from an approved purchase order.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">Purchase Order (APPROVED)</label>
          <select
            value={poId}
            onChange={(e) => selectPo(e.target.value)}
            className={inputCls}
          >
            <option value="">Select an approved PO…</option>
            {approvedPOs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.ref} · {p.supplier} · {p.status.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {approvedPOs.length === 0 && (
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              No APPROVED purchase orders yet — create and approve a PO first.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Supplier</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={inputCls}
          >
            <option value="">Select supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.companyName}
              </option>
            ))}
          </select>
          {suppliers.length === 0 && (
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              No suppliers in the database yet — add one from the Purchase Orders workspace.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Delivery Date</label>
          <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
            className={inputCls} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Waybill / Delivery Note No.</label>
          <input value={waybill} onChange={(e) => setWaybill(e.target.value)} placeholder="WB-00000"
            className={inputCls} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Vehicle / Truck Plate</label>
          <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="AB 3-00000"
            className={inputCls} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Driver Name</label>
          <input value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="Driver name"
            className={inputCls} />
        </div>

        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">Remarks</label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2}
            className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none" />
        </div>
      </div>

      {poId && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">
            Received Items · delivered within remaining PO quantity
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Material</th>
                  <th className="px-3 py-2 text-center font-semibold">Remaining</th>
                  <th className="px-3 py-2 text-right font-semibold">Delivered</th>
                  <th className="px-3 py-2 text-right font-semibold">Damaged</th>
                  <th className="px-3 py-2 text-right font-semibold">Rejected</th>
                  <th className="px-3 py-2 text-left font-semibold">Batch</th>
                  <th className="px-3 py-2 text-left font-semibold">Item Remarks</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.materialId} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{r.name || r.materialId}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.unit || "unit"} · ordered {fmtQty(r.orderedQty)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center font-mono">{fmtQty(r.remaining)}</td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} max={r.remaining} value={r.delivered}
                        onChange={(e) => upd(i, { delivered: Math.max(0, Number(e.target.value)) })}
                        className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} value={r.damaged}
                        onChange={(e) => upd(i, { damaged: Math.max(0, Number(e.target.value)) })}
                        className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} value={r.rejected}
                        onChange={(e) => upd(i, { rejected: Math.max(0, Number(e.target.value)) })}
                        className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={r.batchNumber}
                        onChange={(e) => upd(i, { batchNumber: e.target.value })}
                        className="h-8 w-24 rounded-lg border border-input bg-background px-2 text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={r.remarks}
                        onChange={(e) => upd(i, { remarks: e.target.value })}
                        className="h-8 w-32 rounded-lg border border-input bg-background px-2 text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                        className="rounded p-1 text-muted-foreground hover:bg-accent"
                        title="Remove item from this GRN"
                      >
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
          Cancel
        </button>
        <button
          onClick={() => void submit()}
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950"
        >
          <Truck size={15} /> {submitting ? "Logging…" : "Log GRN (DRAFT)"}
        </button>
      </div>
    </div>
  );
}

function GRNDetailModal({
  g,
  canAct,
  busy,
  onClose,
  onConfirm,
  onReject,
}: {
  g: GRNType;
  canAct: boolean;
  busy: { id: string; action: string } | null;
  onClose: () => void;
  onConfirm: (g: GRNType) => void;
  onReject: (g: GRNType, reason: string) => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const priceOf = (materialId: string) =>
    g.poItems?.find((x) => x.materialId === materialId)?.unitPrice;

  const isBusy = (action: string) => busy?.id === g.id && busy.action === action;

  const submitReject = () => {
    if (!rejectReason.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    onReject(g, rejectReason.trim());
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">{g.ref}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${GRN_STATUS_STYLE[g.status]}`}>
              {g.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Goods receipt {g.poRef ? `· PO ${g.poRef}` : ""} · {g.date}
            {g.receivedBy ? ` · received by ${g.receivedBy}` : ""}
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[11px] font-bold uppercase text-muted-foreground">Supplier</div>
          <div className="mt-1 text-sm font-semibold">{g.supplier}</div>
          {g.poRef && (
            <div className="mt-1 text-xs text-muted-foreground">
              Purchase order <span className="font-mono">{g.poRef}</span>
            </div>
          )}
          {g.remarks && (
            <div className="mt-2 whitespace-pre-line rounded-md bg-background/60 p-2 text-[11px] text-muted-foreground">
              {g.remarks}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[11px] font-bold uppercase text-muted-foreground">Delivery</div>
          <div className="mt-1 text-sm">Delivery date: <span className="font-mono">{g.date}</span></div>
          {g.waybill && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              <FileText size={12} className="text-muted-foreground" /> {g.waybill}
            </div>
          )}
          {g.truckPlate && <div className="mt-1 text-xs text-muted-foreground">Truck {g.truckPlate}</div>}
          {g.driverName && <div className="mt-1 text-xs text-muted-foreground">Driver: {g.driverName}</div>}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Material</th>
                <th className="px-3 py-2 text-center">Unit</th>
                <th className="px-3 py-2 text-right">Ordered</th>
                <th className="px-3 py-2 text-right">Delivered</th>
                <th className="px-3 py-2 text-right">Damaged</th>
                <th className="px-3 py-2 text-right">Rejected</th>
                <th className="px-3 py-2 text-right">Accepted</th>
                <th className="px-3 py-2 text-right">Unit Price</th>
                <th className="px-3 py-2 text-right">Value</th>
                <th className="px-3 py-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {g.items.map((it, i) => {
                const price = priceOf(it.materialId);
                const cond = condOf(it);
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="font-medium">{it.name || it.materialId}</div>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                        <span className={`font-semibold ${GRN_COND_STYLE[cond]}`}>{cond}</span>
                        {it.batchNumber && <span className="rounded bg-muted px-1">{it.batchNumber}</span>}
                        {it.manufacturingDate && <span>MFG {it.manufacturingDate}</span>}
                        {it.expiryDate && <span>EXP {it.expiryDate}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{it.unit || "-"}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtQty(it.orderedQty)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtQty(it.deliveredQty)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtQty(it.damagedQty ?? 0)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtQty(it.rejectedQty ?? 0)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtQty(it.acceptedQty ?? 0)}</td>
                    <td className="px-3 py-2 text-right font-mono">{price != null ? etb2(price) : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {price != null ? etb2(price * it.deliveredQty) : "—"}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground">{it.remarks || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {canAct && g.status === "DRAFT" && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
          <button
            onClick={() => setRejectOpen((v) => !v)}
            disabled={isBusy("grn-reject")}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
          >
            Reject
          </button>
          <button
            onClick={() => onConfirm(g)}
            disabled={isBusy("grn-confirm")}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            <CircleCheck size={15} /> {isBusy("grn-confirm") ? "Confirming…" : "Confirm"}
          </button>
        </div>
      )}

      {rejectOpen && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <label className="text-xs font-semibold text-foreground">Rejection reason <span className="text-rose-500">*</span></label>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2}
            placeholder="Required — recorded on the GRN"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => { setRejectOpen(false); setRejectReason(""); }}
              className="rounded-lg border border-input px-3 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              Back
            </button>
            <button
              onClick={submitReject}
              disabled={isBusy("grn-reject")}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
            >
              {isBusy("grn-reject") ? "Rejecting…" : "Confirm rejection"}
            </button>
          </div>
        </div>
      )}

      {canAct && g.status === "AWAITING_INSPECTION" && (
        <div className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
          GRN confirmed — awaiting QA/QC inspection. No further GRN action available.
        </div>
      )}
      {canAct && g.status === "REJECTED" && (
        <div className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
          GRN rejected — no workflow action available.
        </div>
      )}
    </div>
  );
}

export default function QualityControlAndGRN({
  state,
  setState,
  role,
  focus,
  materials,
  suppliers = [],
  onConfirmGrnBackend,
  onRejectGrnBackend,
  onCreateGrnBackend,
  onCompleteInspectionBackend,
}: Props) {
  const [tab, setTab] = useState<Tab>(focus === "qc" ? "qc" : "grn");
  const [showNew, setShowNew] = useState(false);
  const [viewGRN, setViewGRN] = useState<GRNType | null>(null);
  const [busy, setBusy] = useState<{ id: string; action: string } | null>(null);

  const resolveName = (id: string, given?: string) =>
    given ||
    ((materials && materials.length > 0 ? materials : MATERIALS).find((m) => m.id === id)?.name) ||
    id;

  const doConfirmGRN = (g: GRNType) => {
    setBusy({ id: g.id, action: "grn-confirm" });
    void (onConfirmGrnBackend ? onConfirmGrnBackend(g.id) : Promise.resolve(false))
      .then((ok) => {
        if (ok) setViewGRN(null);
      })
      .finally(() => setBusy(null));
  };

  const doRejectGRN = (g: GRNType, reason: string) => {
    setBusy({ id: g.id, action: "grn-reject" });
    void (onRejectGrnBackend ? onRejectGrnBackend(g.id, reason) : Promise.resolve(false))
      .then((ok) => {
        if (ok) setViewGRN(null);
      })
      .finally(() => setBusy(null));
  };

  const setQcStatus = async (q: QCInspection, status: QCInspection["status"]) => {
    if (onCompleteInspectionBackend && (q.id.length > 10 || q.id.includes("-"))) {
      const backendResult =
        status === "Approved for Use"
          ? "ACCEPTED"
          : status === "Quarantined"
          ? "QUARANTINED"
          : "REJECTED";
      await onCompleteInspectionBackend(q.id, backendResult, q.note);
    }
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
  const canActGrn = role === "Storekeeper" || role === "Procurement Officer" || role === "Project Manager";
  const grnBusy = (id: string, action: string) => busy?.id === id && busy.action === action;

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
                Inbound gate deliveries created from approved purchase orders.
              </div>
              {canActGrn && (
                <button onClick={() => setShowNew((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
                  <Truck size={15} /> New GRN
                </button>
              )}
            </div>
            {showNew && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mb-4 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <NewGRNModal
                  purchaseOrders={state.purchaseOrders}
                  suppliers={suppliers}
                  onCancel={() => setShowNew(false)}
                  onSubmit={(payload) =>
                    onCreateGrnBackend ? onCreateGrnBackend(payload) : Promise.resolve(false)
                  }
                />
              </motion.div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5">Ref</th>
                    <th className="px-3 py-2.5">PO / Supplier</th>
                    <th className="px-3 py-2.5">Delivery</th>
                    <th className="px-3 py-2.5">Items</th>
                    <th className="px-3 py-2.5 text-center">Conditions</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.grns.map((g) => (
                    <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-3">
                        <div className="font-semibold">{g.ref}</div>
                        <div className="text-[11px] text-muted-foreground">{g.date}{g.receivedBy ? ` · ${g.receivedBy}` : ""}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs font-medium">{g.supplier}</div>
                        <div className="text-[11px] text-muted-foreground">{g.poRef || "No PO"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 text-xs"><FileText size={12} className="text-muted-foreground" /> {g.waybill || "—"}</div>
                        <div className="text-[11px] text-muted-foreground">Truck {g.truckPlate || "—"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs">{g.items.reduce((s, i) => s + (i.deliveredQty || 0), 0)} units</div>
                        {g.items.slice(0, 2).map((it, idx) => (
                          <div key={idx} className="text-[11px] text-muted-foreground">{resolveName(it.materialId, it.name)} × {fmtQty(it.deliveredQty)}</div>
                        ))}
                        {g.items.length > 2 && <div className="text-[11px] text-muted-foreground">+{g.items.length - 2} more</div>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-center gap-1">
                          {(["Good", "Damaged", "Short"] as const).map((c) => {
                            const count = g.items.filter((i) => condOf(i) === c).length;
                            if (count === 0) return null;
                            return <span key={c} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${COND_STYLE[c]}`}>{c} {count}</span>;
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${GRN_STATUS_STYLE[g.status]}`}>
                          {g.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setViewGRN(g)}
                            className="flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs font-semibold text-muted-foreground hover:bg-accent">
                            <Eye size={12} /> View
                          </button>
                          {canActGrn && g.status === "DRAFT" && (
                            <button onClick={() => doConfirmGRN(g)} disabled={grnBusy(g.id, "grn-confirm")}
                              className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                              <Check size={12} /> {grnBusy(g.id, "grn-confirm") ? "…" : "Confirm"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {state.grns.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">No GRNs received yet.</td></tr>
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

      <AnimatePresence>
        {viewGRN && (
          <motion.div
            key="grn-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setViewGRN(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-border bg-card sm:rounded-2xl"
            >
              <GRNDetailModal
                g={viewGRN}
                canAct={canActGrn}
                busy={busy}
                onClose={() => setViewGRN(null)}
                onConfirm={doConfirmGRN}
                onReject={doRejectGRN}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}