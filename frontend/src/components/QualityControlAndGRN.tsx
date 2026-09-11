import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Truck, FlaskConical, Check, X, ShieldCheck, PackageCheck, PackageX,
  Microscope, UserRound, FileText, RefreshCcw, CircleCheck, Eye,
  Plus, Loader2, ClipboardList, CalendarDays, ArrowRight,
} from "lucide-react";
import {
  type AppState,
  type UserRole,
  type GRN as GRNType,
  type GRNItem,
  type QCInspection,
  type InspectionStatus,
  type InspectionItemDetail,
  type Material,
  type Supplier,
  type PurchaseOrder,
} from "../types";
import { MATERIALS } from "../data/mockData";
import { grnService, type BackendGrn } from "../services/grn.service";
import { inspectionService } from "../services/inspection.service";
import { adaptInspection } from "../services/dataAdapters";
import { inventoryService, type BackendStorageLocation } from "../services/inventory.service";

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
  onCompleteInspectionBackend?: (
    id: string,
    result: "ACCEPTED" | "REJECTED" | "CONDITIONALLY_ACCEPTED" | "PARTIALLY_ACCEPTED" | "QUARANTINED",
    note?: string,
    correctiveAction?: string,
    storageLocations?: { grnItemId: string; storageLocationId: string }[]
  ) => Promise<boolean>;
  onCreateInspectionBackend?: (payload: {
    grnId: string;
    inspectionDate?: string;
    remarks?: string;
    correctiveAction?: string;
    items: {
      grnItemId: string;
      materialId?: string;
      quantityInspected?: number;
      quantityAccepted?: number;
      quantityConditionallyAccepted?: number;
      quantityQuarantined?: number;
      quantityRejected?: number;
      specification?: string;
      requiredStandard?: string;
      certificateNumber?: string;
      testRequired?: boolean;
      testResult?: string;
      remarks?: string;
    }[];
  }) => Promise<boolean>;
  onStartInspectionBackend?: (id: string) => Promise<boolean>;
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

const INS_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  IN_PROGRESS: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const DECISION_STYLE: Record<string, string> = {
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  CONDITIONALLY_ACCEPTED: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  PARTIALLY_ACCEPTED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  QUARANTINED: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
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

const statusLabel = (s: InspectionStatus) =>
  s === "PENDING" ? "Pending" : s === "IN_PROGRESS" ? "In Progress" : "Completed";

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

function NewInspectionModal({
  materials,
  onCancel,
  onSubmit,
}: {
  materials?: Material[];
  onCancel: () => void;
  onSubmit: (payload: {
    grnId: string;
    inspectionDate?: string;
    remarks?: string;
    items: {
      grnItemId: string;
      materialId?: string;
      quantityInspected?: number;
      quantityAccepted?: number;
      quantityQuarantined?: number;
      quantityRejected?: number;
      specification?: string;
      requiredStandard?: string;
      remarks?: string;
    }[];
  }) => Promise<boolean>;
}) {
  const [eligibleGrns, setEligibleGrns] = useState<BackendGrn[]>([]);
  const [loadingGrns, setLoadingGrns] = useState(true);
  const [selectedGrnId, setSelectedGrnId] = useState("");
  const [selectedGrn, setSelectedGrn] = useState<BackendGrn | null>(null);
  const [inspectionDate, setInspectionDate] = useState(today());
  const [remarks, setRemarks] = useState("");
  const [itemRows, setItemRows] = useState<
    {
      grnItemId: string;
      materialId: string;
      materialName: string;
      materialCode: string;
      unit: string;
      deliveredQty: number;
      quantityInspected: number;
      quantityAccepted: number;
      quantityQuarantined: number;
      quantityRejected: number;
      specification: string;
      requiredStandard: string;
      remarks: string;
    }[]
  >([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const grns = await grnService.getGrns();
        if (!cancelled) {
          setEligibleGrns(grns.filter((g) => g.status === "AWAITING_INSPECTION"));
        }
      } catch {
        if (!cancelled) setEligibleGrns([]);
      } finally {
        if (!cancelled) setLoadingGrns(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectGrn = (id: string) => {
    setSelectedGrnId(id);
    setError("");
    const grn = eligibleGrns.find((g) => g.id === id);
    setSelectedGrn(grn || null);
    if (!grn) {
      setItemRows([]);
      return;
    }
    setItemRows(
      (grn.items || []).map((item) => ({
        grnItemId: item.id,
        materialId: item.materialId,
        materialName: item.material?.name || "",
        materialCode: item.material?.materialCode || "",
        unit: item.unit?.symbol || item.unit?.code || item.unit?.name || "",
        deliveredQty: Number(item.deliveredQuantity || 0),
        quantityInspected: Number(item.deliveredQuantity || 0),
        quantityAccepted: Number(item.deliveredQuantity || 0),
        quantityQuarantined: 0,
        quantityRejected: 0,
        specification: "",
        requiredStandard: "",
        remarks: "",
      }))
    );
  };

  const updItem = (i: number, patch: Partial<typeof itemRows[number]>) =>
    setItemRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const resolveName = (materialId: string, name: string) =>
    name || (materials && materials.find((m) => m.id === materialId)?.name) || materialId;

  const submit = async () => {
    setError("");
    if (!selectedGrnId) {
      setError("Select a GRN with AWAITING_INSPECTION status.");
      return;
    }
    if (itemRows.length === 0) {
      setError("The selected GRN has no items to inspect.");
      return;
    }
    for (const row of itemRows) {
      if (row.quantityInspected <= 0) {
        setError(`Inspected quantity must be greater than zero for ${resolveName(row.materialId, row.materialName)}.`);
        return;
      }
      if (row.quantityInspected > row.deliveredQty) {
        setError(`Inspected quantity cannot exceed delivered quantity (${row.deliveredQty}) for ${resolveName(row.materialId, row.materialName)}.`);
        return;
      }
      if (row.quantityAccepted < 0 || row.quantityQuarantined < 0 || row.quantityRejected < 0) {
        setError(`Quantities cannot be negative for ${resolveName(row.materialId, row.materialName)}.`);
        return;
      }
      const total = row.quantityAccepted + row.quantityQuarantined + row.quantityRejected;
      if (total > row.quantityInspected) {
        setError(`Accepted + quarantined + rejected cannot exceed inspected quantity for ${resolveName(row.materialId, row.materialName)}.`);
        return;
      }
    }

    setSubmitting(true);
    const ok = await onSubmit({
      grnId: selectedGrnId,
      inspectionDate: inspectionDate || undefined,
      remarks: remarks.trim() || undefined,
      items: itemRows.map((r) => ({
        grnItemId: r.grnItemId,
        materialId: r.materialId || undefined,
        quantityInspected: r.quantityInspected,
        quantityAccepted: r.quantityAccepted,
        quantityQuarantined: r.quantityQuarantined,
        quantityRejected: r.quantityRejected,
        specification: r.specification.trim() || undefined,
        requiredStandard: r.requiredStandard.trim() || undefined,
        remarks: r.remarks.trim() || undefined,
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
      <div className="text-lg font-bold tracking-tight">New Material Inspection</div>
      <p className="text-xs text-muted-foreground">
        Create an inspection from a GRN awaiting QA/QC review.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">
            GRN <span className="text-rose-500">*</span>
          </label>
          {loadingGrns ? (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Loading GRNs…
            </div>
          ) : (
            <select value={selectedGrnId} onChange={(e) => selectGrn(e.target.value)} className={inputCls}>
              <option value="">Select a GRN (AWAITING_INSPECTION)…</option>
              {eligibleGrns.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.grnNumber} · {g.supplier?.companyName || "Vendor"} · {g.deliveryDate?.slice(0, 10)}
                </option>
              ))}
            </select>
          )}
          {eligibleGrns.length === 0 && !loadingGrns && (
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              No GRNs with AWAITING_INSPECTION status found. Confirm a GRN first.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Inspection Date</label>
          <input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)}
            className={inputCls} />
        </div>

        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">Remarks</label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2}
            className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none" />
        </div>
      </div>

      {selectedGrn && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">
            Inspection Items · from {selectedGrn.grnNumber}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Material</th>
                  <th className="px-3 py-2 text-center font-semibold">Unit</th>
                  <th className="px-3 py-2 text-right font-semibold">Delivered</th>
                  <th className="px-3 py-2 text-right font-semibold">Inspected</th>
                  <th className="px-3 py-2 text-right font-semibold">Accepted</th>
                  <th className="px-3 py-2 text-right font-semibold">Quarantined</th>
                  <th className="px-3 py-2 text-right font-semibold">Rejected</th>
                  <th className="px-3 py-2 text-left font-semibold">Standard</th>
                  <th className="px-3 py-2 text-left font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {itemRows.map((r, i) => (
                  <tr key={r.grnItemId} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{resolveName(r.materialId, r.materialName)}</div>
                      <div className="text-[10px] text-muted-foreground">{r.materialCode || r.materialId}</div>
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{r.unit}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtQty(r.deliveredQty)}</td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} max={r.deliveredQty} value={r.quantityInspected}
                        onChange={(e) => updItem(i, { quantityInspected: Math.max(0, Number(e.target.value)) })}
                        className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} value={r.quantityAccepted}
                        onChange={(e) => updItem(i, { quantityAccepted: Math.max(0, Number(e.target.value)) })}
                        className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} value={r.quantityQuarantined}
                        onChange={(e) => updItem(i, { quantityQuarantined: Math.max(0, Number(e.target.value)) })}
                        className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} value={r.quantityRejected}
                        onChange={(e) => updItem(i, { quantityRejected: Math.max(0, Number(e.target.value)) })}
                        className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={r.requiredStandard} placeholder="e.g. ASTM C33"
                        onChange={(e) => updItem(i, { requiredStandard: e.target.value })}
                        className="h-8 w-28 rounded-lg border border-input bg-background px-2 text-xs outline-none" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={r.remarks} placeholder="Notes"
                        onChange={(e) => updItem(i, { remarks: e.target.value })}
                        className="h-8 w-28 rounded-lg border border-input bg-background px-2 text-xs outline-none" />
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
          disabled={submitting || !selectedGrnId}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-500 dark:text-slate-950"
        >
          <ClipboardList size={15} /> {submitting ? "Creating…" : "Create Inspection"}
        </button>
      </div>
    </div>
  );
}

type CompleteDecision = "ACCEPTED" | "REJECTED" | "CONDITIONALLY_ACCEPTED" | "PARTIALLY_ACCEPTED" | "QUARANTINED";

function deriveDecision(items: InspectionItemDetail[]): CompleteDecision {
  const hasAccepted = items.some((i) => i.quantityAccepted > 0);
  const hasConditional = items.some((i) => i.quantityConditionallyAccepted > 0);
  const hasQuarantine = items.some((i) => i.quantityQuarantined > 0);
  const hasRejected = items.some((i) => i.quantityRejected > 0);
  const resultTypes = [hasAccepted, hasConditional, hasQuarantine, hasRejected].filter(Boolean).length;
  if (resultTypes > 1) return "PARTIALLY_ACCEPTED";
  if (hasAccepted) return "ACCEPTED";
  if (hasConditional) return "CONDITIONALLY_ACCEPTED";
  if (hasQuarantine) return "QUARANTINED";
  return "REJECTED";
}

function InspectionDetailModal({
  inspectionId,
  onClose,
  onStartBackend,
  onCompleteBackend,
  role,
}: {
  inspectionId: string;
  onClose: () => void;
  onStartBackend?: (id: string) => Promise<boolean>;
  onCompleteBackend?: (
    id: string,
    result: "ACCEPTED" | "REJECTED" | "CONDITIONALLY_ACCEPTED" | "PARTIALLY_ACCEPTED" | "QUARANTINED",
    note?: string,
    correctiveAction?: string,
    storageLocations?: { grnItemId: string; storageLocationId: string }[]
  ) => Promise<boolean>;
  role: UserRole;
}) {
  const [inspection, setInspection] = useState<QCInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completeRemarks, setCompleteRemarks] = useState("");
  const [completeAction, setCompleteAction] = useState("");
  const [storageLocations, setStorageLocations] = useState<BackendStorageLocation[]>([]);
  const [storageLocationsLoading, setStorageLocationsLoading] = useState(false);
  const [storageLocationsError, setStorageLocationsError] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<Record<string, string>>({});

  const fetchInspection = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inspectionService.getInspectionById(inspectionId);
      setInspection(adaptInspection(data));
    } catch (err) {
      toast.error("Failed to load inspection details.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [inspectionId, onClose]);

  useEffect(() => {
    void fetchInspection();
  }, [fetchInspection]);

  useEffect(() => {
    let active = true;
    setStorageLocationsLoading(true);
    setStorageLocationsError("");
    inventoryService
      .getStorageLocations({ limit: 100, isActive: true })
      .then((locs) => {
        if (!active) return;
        const activeLocs = (locs || []).filter((l) => l.id && (l.isActive ?? true));
        setStorageLocations(activeLocs);
        if (activeLocs.length === 0) {
          setStorageLocationsError(
            "No active storage locations found. Create one before completing an inspection with accepted materials."
          );
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load storage locations:", err);
        setStorageLocationsError(
          err?.message ||
          "Failed to load storage locations. Ensure your account can view storage locations."
        );
      })
      .finally(() => {
        if (active) setStorageLocationsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStart = async () => {
    if (!onStartBackend || !inspection) return;
    setActionBusy("start");
    const ok = await onStartBackend(inspection.id);
    setActionBusy(null);
    if (ok) {
      await fetchInspection();
    }
  };

  const handleComplete = async () => {
    if (!onCompleteBackend || !inspection) return;
    if (!storageReady) {
      toast.error("Select a storage location for every accepted material before completing.");
      return;
    }
    setActionBusy("complete");
    const items = inspection.inspectionItems || [];
    const storageLocations = acceptedItems
      .map((it) => {
        const storageLocationId = effectiveLocationId(it);
        return storageLocationId ? { grnItemId: it.grnItemId, storageLocationId } : null;
      })
      .filter((x): x is { grnItemId: string; storageLocationId: string } => x !== null);
    const ok = await onCompleteBackend(
      inspection.id,
      deriveDecision(items),
      completeRemarks.trim() || undefined,
      completeAction.trim() || undefined,
      storageLocations.length > 0 ? storageLocations : undefined
    );
    setActionBusy(null);
    if (ok) {
      setShowComplete(false);
      setCompleteRemarks("");
      setCompleteAction("");
      setSelectedLocations({});
      await fetchInspection();
    }
  };

  const canAct = role === "QA/QC Inspector" || role === "Project Manager";
  const statusRaw = inspection?.status === "In Progress" ? "IN_PROGRESS" : inspection?.status === "Pending Inspection" ? "PENDING" : "COMPLETED";

  const acceptedItems = (inspection?.inspectionItems || []).filter(
    (it) => Number(it.quantityAccepted || 0) > 0
  );
  const effectiveLocationId = (it: InspectionItemDetail) =>
    selectedLocations[it.grnItemId] || it.storageLocationId || "";
  const missingLocationItems = acceptedItems.filter((it) => !effectiveLocationId(it));
  const storageReady = acceptedItems.length === 0 || missingLocationItems.length === 0;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-bold tracking-tight">
            {loading ? <Loader2 size={18} className="animate-spin" /> : inspection?.ref || "Inspection"}
          </div>
          {!loading && inspection && (
            <p className="text-xs text-muted-foreground">
              GRN {inspection.grnRef}
              {inspection.supplier ? ` · ${inspection.supplier}` : ""}
              {inspection.poRef ? ` · PO ${inspection.poRef}` : ""}
            </p>
          )}
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div className="mt-8 flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 size={24} className="animate-spin" /> Loading inspection…
        </div>
      ) : !inspection ? null : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-[11px] font-bold uppercase text-muted-foreground">Inspection Details</div>
              <div className="mt-2 space-y-1.5 text-xs">
                <div><span className="text-muted-foreground">Number:</span> <span className="font-semibold font-mono">{inspection.ref}</span></div>
                <div><span className="text-muted-foreground">Date:</span> <span className="font-mono">{inspection.testDate}</span></div>
                <div className="flex items-center gap-1"><span className="text-muted-foreground">Inspector:</span> <UserRound size={11} /> <span className="font-semibold">{inspection.inspector}</span></div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-[11px] font-bold uppercase text-muted-foreground">Status</div>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${INS_STATUS_STYLE[statusRaw] || ""}`}>
                    {statusLabel(statusRaw as InspectionStatus)}
                  </span>
                </div>
                {inspection.decision && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Decision:</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${DECISION_STYLE[inspection.decision] || ""}`}>
                      {inspection.decision.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
                {inspection.supplier && (
                  <div><span className="text-muted-foreground">Supplier:</span> <span className="font-semibold">{inspection.supplier}</span></div>
                )}
              </div>
            </div>
          </div>

          {inspection.note && (
            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {inspection.note}
            </div>
          )}

          {inspection.inspectionItems && inspection.inspectionItems.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">
                Inspection Items ({inspection.inspectionItems.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Material</th>
                      <th className="px-3 py-2 text-right font-semibold">Delivered</th>
                      <th className="px-3 py-2 text-right font-semibold">Inspected</th>
                      <th className="px-3 py-2 text-right font-semibold">Accepted</th>
                      <th className="px-3 py-2 text-right font-semibold">Quarantined</th>
                      <th className="px-3 py-2 text-right font-semibold">Rejected</th>
                      <th className="px-3 py-2 text-left font-semibold">Unit</th>
                      <th className="px-3 py-2 text-left font-semibold">Standard</th>
                      <th className="px-3 py-2 text-left font-semibold">Remarks</th>
                      <th className="px-3 py-2 text-left font-semibold">Storage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspection.inspectionItems.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.materialName || item.materialId || "—"}</div>
                          <div className="text-[10px] text-muted-foreground">{item.materialCode || item.grnItemId}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{fmtQty(item.deliveredQuantity)}</td>
                        <td className="px-3 py-2 text-right font-mono">{fmtQty(item.quantityInspected)}</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600">{fmtQty(item.quantityAccepted)}</td>
                        <td className="px-3 py-2 text-right font-mono text-orange-600">{fmtQty(item.quantityQuarantined)}</td>
                        <td className="px-3 py-2 text-right font-mono text-rose-600">{fmtQty(item.quantityRejected)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.unit || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.requiredStandard || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.remarks || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {item.storageLocation
                            ? `${item.storageLocation.code} · ${item.storageLocation.name}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {canAct && statusRaw === "PENDING" && (
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                onClick={() => void handleStart()}
                disabled={actionBusy === "start"}
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
              >
                {actionBusy === "start" ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                {actionBusy === "start" ? "Starting…" : "Start Inspection"}
              </button>
            </div>
          )}

          {canAct && statusRaw === "IN_PROGRESS" && (
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
              {showComplete ? (
                <div className="w-full">
                  <div className="mb-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="text-xs font-semibold text-foreground mb-2">Complete Inspection</div>
                    <p className="mb-3 text-[11px] text-muted-foreground">
                      Decisions are determined from the inspection item quantities. Accepted materials require a
                      storage location before completing.
                    </p>
                    <div className="mb-3 rounded-lg border border-border bg-background p-3">
                      <div className="mb-2 text-[11px] font-semibold text-foreground">
                        Storage Location (required for accepted materials)
                      </div>
                      {storageLocationsLoading ? (
                        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                          <Loader2 size={13} className="animate-spin" /> Loading storage locations…
                        </div>
                      ) : storageLocationsError ? (
                        <div className="rounded-md bg-rose-500/10 px-2 py-2 text-xs text-rose-600 dark:text-rose-400">
                          {storageLocationsError}
                        </div>
                      ) : acceptedItems.length === 0 ? (
                        <div className="text-xs text-muted-foreground">
                          No accepted materials — no storage location required.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {acceptedItems.map((it) => {
                            const assigned = selectedLocations[it.grnItemId] || it.storageLocationId || "";
                            const hasAssigned = storageLocations.some((l) => l.id === assigned);
                            return (
                              <div
                                key={it.grnItemId}
                                className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="text-xs">
                                  <div className="font-medium">{it.materialName || it.materialId}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Accepted: {fmtQty(it.quantityAccepted)} {it.unit}
                                  </div>
                                </div>
                                <select
                                  value={hasAssigned ? assigned : ""}
                                  onChange={(e) =>
                                    setSelectedLocations((prev) => ({ ...prev, [it.grnItemId]: e.target.value }))
                                  }
                                  className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none sm:w-72"
                                >
                                  <option value="">Select storage location…</option>
                                  {storageLocations.map((l) => (
                                    <option key={l.id} value={l.id}>
                                      {l.code} · {l.name}
                                      {l.warehouse?.name ? ` (${l.warehouse.name})` : ""}
                                      {l.description ? ` — ${l.description}` : ""}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                          {!storageReady && (
                            <div className="rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                              Select a storage location for {missingLocationItems.length} accepted material
                              {missingLocationItems.length === 1 ? "" : "s"} before completing.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <textarea
                      value={completeRemarks}
                      onChange={(e) => setCompleteRemarks(e.target.value)}
                      rows={2}
                      placeholder="Optional remarks…"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
                    />
                    <textarea
                      value={completeAction}
                      onChange={(e) => setCompleteAction(e.target.value)}
                      rows={2}
                      placeholder="Optional corrective action…"
                      className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setShowComplete(false); setCompleteRemarks(""); setCompleteAction(""); setSelectedLocations({}); }}
                      className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleComplete()}
                      disabled={actionBusy === "complete" || !storageReady}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                    >
                      {actionBusy === "complete" ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                      {actionBusy === "complete" ? "Completing…" : "Confirm Complete"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowComplete(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  <Check size={15} /> Complete Inspection
                </button>
              )}
            </div>
          )}

          {statusRaw === "COMPLETED" && (
            <div className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Inspection completed.
              {inspection.decision ? ` Decision: ${inspection.decision.replace(/_/g, " ")}` : ""}
            </div>
          )}
        </>
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
  onCreateInspectionBackend,
  onStartInspectionBackend,
}: Props) {
  const [tab, setTab] = useState<Tab>(focus === "qc" ? "qc" : "grn");
  const [showNew, setShowNew] = useState(false);
  const [showNewInspection, setShowNewInspection] = useState(false);
  const [viewGRN, setViewGRN] = useState<GRNType | null>(null);
  const [viewInspectionId, setViewInspectionId] = useState<string | null>(null);
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

  const canActGrn = role === "Storekeeper" || role === "Procurement Officer" || role === "Project Manager";
  const canCreateInspection = role === "QA/QC Inspector" || role === "Project Manager";
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
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Microscope size={15} className="text-emerald-500" />
                Mandatory QC gate before stock release. Inspection items from GRN data.
              </div>
              {canCreateInspection && (
                <button onClick={() => setShowNewInspection((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950">
                  <Plus size={15} /> New Inspection
                </button>
              )}
            </div>

            {showNewInspection && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mb-4 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <NewInspectionModal
                  materials={materials}
                  onCancel={() => setShowNewInspection(false)}
                  onSubmit={(payload) => {
                    if (!onCreateInspectionBackend) return Promise.resolve(false);
                    setShowNewInspection(false);
                    return onCreateInspectionBackend(payload);
                  }}
                />
              </motion.div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              {state.inspections.map((q) => {
                const statusRaw = q.status === "In Progress" ? "IN_PROGRESS" : q.status === "Pending Inspection" ? "PENDING" : "COMPLETED";
                return (
                  <div key={q.id} className={`rounded-xl border bg-card p-4 cursor-pointer transition hover:shadow-md ${
                    statusRaw === "COMPLETED" && q.decision === "QUARANTINED" ? "border-orange-300 dark:border-orange-800" :
                    statusRaw === "COMPLETED" && q.decision === "REJECTED" ? "border-rose-300 dark:border-rose-800" :
                    "border-border"
                  }`}
                    onClick={() => setViewInspectionId(q.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          {q.ref} · {q.grnRef}
                          {q.supplier ? ` · ${q.supplier}` : ""}
                        </div>
                        <div className="font-bold">{q.materialName}</div>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${INS_STATUS_STYLE[statusRaw] || ""}`}>
                        {statusRaw === "COMPLETED" && q.decision === "ACCEPTED" ? <PackageCheck size={12} /> :
                         statusRaw === "COMPLETED" && (q.decision === "REJECTED" || q.decision === "QUARANTINED") ? <PackageX size={12} /> :
                         <ShieldCheck size={12} />}
                        {statusLabel(statusRaw as InspectionStatus)}
                      </span>
                    </div>

                    {statusRaw === "COMPLETED" && q.decision && (
                      <div className="mt-1">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${DECISION_STYLE[q.decision] || ""}`}>
                          {q.decision.replace(/_/g, " ")}
                        </span>
                      </div>
                    )}

                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      <span>{q.testDate}</span>
                      <span className="flex items-center gap-0.5"><UserRound size={11} /> {q.inspector}</span>
                      {q.poRef && <span>PO {q.poRef}</span>}
                    </div>

                    {q.inspectionItems && q.inspectionItems.length > 0 && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/40 text-muted-foreground">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-semibold">Material</th>
                              <th className="px-2 py-1.5 text-right font-semibold">Inspected</th>
                              <th className="px-2 py-1.5 text-right font-semibold">Accepted</th>
                              <th className="px-2 py-1.5 text-right font-semibold">Rejected</th>
                            </tr>
                          </thead>
                          <tbody>
                            {q.inspectionItems.slice(0, 3).map((item) => (
                              <tr key={item.id} className="border-t border-border">
                                <td className="px-2 py-1.5 font-medium">{item.materialName || item.materialId || "—"}</td>
                                <td className="px-2 py-1.5 text-right font-mono">{fmtQty(item.quantityInspected)}</td>
                                <td className="px-2 py-1.5 text-right font-mono">{fmtQty(item.quantityAccepted)}</td>
                                <td className="px-2 py-1.5 text-right font-mono">{fmtQty(item.quantityRejected)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {q.inspectionItems.length > 3 && (
                          <div className="border-t border-border px-2 py-1 text-[10px] text-muted-foreground text-center">
                            +{q.inspectionItems.length - 3} more items
                          </div>
                        )}
                      </div>
                    )}

                    {q.note && <div className="mt-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">{q.note}</div>}

                    <div className="mt-2 flex items-center justify-end text-[11px] text-muted-foreground">
                      <Eye size={12} className="mr-1" /> View details
                    </div>
                  </div>
                );
              })}
              {state.inspections.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <FlaskConical size={28} /> No inspections recorded. Create one from an AWAITING_INSPECTION GRN.
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

      <AnimatePresence>
        {viewInspectionId && (
          <motion.div
            key="inspection-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setViewInspectionId(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-border bg-card sm:rounded-2xl"
            >
              <InspectionDetailModal
                inspectionId={viewInspectionId}
                onClose={() => setViewInspectionId(null)}
                onStartBackend={onStartInspectionBackend}
                onCompleteBackend={onCompleteInspectionBackend}
                role={role}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
