import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppState, Material, ProjectMeta, PurchaseOrder, Requisition, Supplier } from "../types";
import { PROJECT as STATIC_PROJECT } from "../types";
import { buildSeedState, MATERIALS as STATIC_MATERIALS } from "../data/mockData";
import { materialService, type BackendMaterial } from "../services/material.service";
import { projectService, type BackendProject } from "../services/project.service";
import { requisitionService } from "../services/requisition.service";
import { purchaseOrderService } from "../services/purchaseOrder.service";
import { grnService } from "../services/grn.service";
import { inspectionService } from "../services/inspection.service";
import { inventoryService } from "../services/inventory.service";
import {
  adaptGrn,
  adaptInspection,
  adaptInventoryBalance,
  adaptMaterial,
  adaptMaterialIssue,
  adaptProject,
  adaptPurchaseOrder,
  adaptRequisition,
  adaptSupplier,
} from "../services/dataAdapters";
import { authService } from "../services/auth.service";

export type RequisitionDraftItem = { materialId: string; qty: number; unitPrice?: number; name?: string; remarks?: string };

export type MaterialRequestPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface CreateRequisitionOpts {
  requiredDate?: string;
  priority?: MaterialRequestPriority;
  purpose?: string;
  remarks?: string;
}

export interface AppDataContext {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  materials: Material[];
  project: ProjectMeta;
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  activeProjectId: string | null;
  refreshAll: () => Promise<void>;
  createRequisition: (items: RequisitionDraftItem[], opts?: CreateRequisitionOpts) => Promise<Requisition | null>;
  submitRequisition: (id: string) => Promise<boolean>;
  startRequisitionReview: (id: string) => Promise<boolean>;
  approveRequisition: (id: string, comments?: string) => Promise<boolean>;
  rejectRequisition: (id: string, reason?: string) => Promise<boolean>;
  cancelRequisition: (id: string) => Promise<boolean>;
  createPurchaseOrder: (
    reqId: string,
    opts: {
      supplierId: string;
      expectedDeliveryDate?: string;
      remarks?: string;
      items: { materialId: string; orderedQuantity: number; unitPrice: number }[];
    }
  ) => Promise<PurchaseOrder | null>;
  submitPurchaseOrder: (id: string) => Promise<boolean>;
  approvePurchaseOrder: (id: string) => Promise<boolean>;
  cancelPurchaseOrder: (id: string, reason: string) => Promise<boolean>;
  closePurchaseOrder: (id: string) => Promise<boolean>;
  createSupplier: (data: {
    supplierCode: string;
    companyName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) => Promise<Supplier | null>;
  confirmGrn: (id: string) => Promise<boolean>;
  rejectGrn: (id: string, reason: string) => Promise<boolean>;
  createGrn: (payload: {
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
  }) => Promise<boolean>;
  completeInspection: (
    id: string,
    result: "ACCEPTED" | "REJECTED" | "CONDITIONALLY_ACCEPTED" | "PARTIALLY_ACCEPTED" | "QUARANTINED",
    note?: string,
    correctiveAction?: string,
    storageLocations?: { grnItemId: string; storageLocationId: string }[]
  ) => Promise<boolean>;
  createInspection: (payload: {
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
  startInspection: (id: string) => Promise<boolean>;
}

export function useAppData(): AppDataContext {
  const [state, setState] = useState<AppState>(() => buildSeedState());
  const [materials, setMaterials] = useState<Material[]>(STATIC_MATERIALS);
  const [project, setProject] = useState<ProjectMeta>(STATIC_PROJECT);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch materials and projects concurrently
      const [backendMaterials, backendProjects] = await Promise.allSettled([
        materialService.getMaterials({ limit: 100 }),
        projectService.getProjects({ limit: 10 }),
      ]);

      let currentProjectId: string | null = null;
      let adaptedMats = STATIC_MATERIALS;

      if (backendMaterials.status === "fulfilled" && backendMaterials.value?.length > 0) {
        adaptedMats = backendMaterials.value.map(adaptMaterial);
        setMaterials(adaptedMats);
      }

      if (backendProjects.status === "fulfilled" && backendProjects.value?.length > 0) {
        const firstPrj = backendProjects.value[0];
        currentProjectId = firstPrj.id;
        setActiveProjectId(firstPrj.id);
        setProject(adaptProject(firstPrj));
      }

      // 2. Fetch operational data
      const [reqsRes, posRes, grnsRes, inspRes, invRes, issuesRes, suppliersRes] = await Promise.allSettled([
        requisitionService.getRequisitions({ limit: 50 }),
        purchaseOrderService.getPurchaseOrders({ limit: 50 }),
        grnService.getGrns(),
        inspectionService.getInspections({ limit: 50 }),
        inventoryService.getInventoryBalances({ limit: 100 }),
        inventoryService.getMaterialIssues({ limit: 50 }),
        purchaseOrderService.getSuppliers(),
      ]);

      if (suppliersRes.status === "fulfilled" && suppliersRes.value?.length > 0) {
        setSuppliers(suppliersRes.value.map(adaptSupplier));
      }

      setState((prev) => {
        const baseline = buildSeedState();

        const adaptedReqs =
          reqsRes.status === "fulfilled" && reqsRes.value?.length > 0
            ? reqsRes.value.map(adaptRequisition)
            : prev.requisitions.length > 0
            ? prev.requisitions
            : baseline.requisitions;

        const adaptedPos =
          posRes.status === "fulfilled" && posRes.value?.length > 0
            ? posRes.value.map(adaptPurchaseOrder)
            : prev.purchaseOrders.length > 0
            ? prev.purchaseOrders
            : baseline.purchaseOrders;

        const adaptedGrns =
          grnsRes.status === "fulfilled" && grnsRes.value?.length > 0
            ? grnsRes.value.map(adaptGrn)
            : prev.grns.length > 0
            ? prev.grns
            : baseline.grns;

        const adaptedInspections =
          inspRes.status === "fulfilled" && inspRes.value?.length > 0
            ? inspRes.value.map(adaptInspection)
            : [];

        const adaptedInventory =
          invRes.status === "fulfilled" && invRes.value?.length > 0
            ? invRes.value.map(adaptInventoryBalance)
            : prev.inventory.length > 0
            ? prev.inventory
            : baseline.inventory;

        const adaptedIssues =
          issuesRes.status === "fulfilled" && issuesRes.value?.length > 0
            ? issuesRes.value.map(adaptMaterialIssue)
            : prev.issues.length > 0
            ? prev.issues
            : baseline.issues;

        return {
          ...prev,
          requisitions: adaptedReqs,
          purchaseOrders: adaptedPos,
          grns: adaptedGrns,
          inspections: adaptedInspections,
          inventory: adaptedInventory,
          issues: adaptedIssues,
        };
      });
    } catch (err: any) {
      console.error("Failed to load backend data:", err);
      setError(err.message || "Failed to load live data from backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();

    const handleAuthChange = () => {
      refreshAll();
    };

    window.addEventListener("cmms:auth_changed", handleAuthChange);
    return () => {
      window.removeEventListener("cmms:auth_changed", handleAuthChange);
    };
  }, [refreshAll]);

  const createRequisition = async (
    items: RequisitionDraftItem[],
    opts?: CreateRequisitionOpts
  ): Promise<Requisition | null> => {
    if (!activeProjectId) {
      toast.error("No active project found in database to associate requisition with.");
      return null;
    }

    try {
      const payload = {
        projectId: activeProjectId,
        ...(opts?.requiredDate ? { requiredDate: opts.requiredDate } : {}),
        ...(opts?.priority ? { priority: opts.priority } : {}),
        ...(opts?.purpose ? { purpose: opts.purpose } : {}),
        ...(opts?.remarks ? { remarks: opts.remarks } : {}),
        items: items.map((it) => ({
          materialId: it.materialId,
          requestedQuantity: it.qty,
          ...(it.unitPrice !== undefined ? { estimatedUnitPrice: it.unitPrice } : {}),
          ...(it.remarks ? { remarks: it.remarks } : {}),
        })),
      };

      const createdReq = await requisitionService.createRequisition(payload);
      const adaptedReq = adaptRequisition(createdReq);
      toast.success("Requisition created in backend database!");
      await refreshAll();
      return adaptedReq;
    } catch (err: any) {
      console.error("Failed to create requisition:", err);
      toast.error(err.message || "Failed to create requisition on backend");
      return null;
    }
  };

  const submitRequisition = async (id: string): Promise<boolean> => {
    try {
      await requisitionService.submitRequisition(id);
      toast.success("Requisition submitted for approval!");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to submit requisition:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit requisition");
      return false;
    }
  };

  const startRequisitionReview = async (id: string): Promise<boolean> => {
    try {
      await requisitionService.startRequisitionReview(id);
      toast.success("Requisition moved to UNDER_REVIEW!");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to start review:", err);
      toast.error(err instanceof Error ? err.message : "Failed to start review");
      return false;
    }
  };

  const approveRequisition = async (id: string, comments?: string): Promise<boolean> => {
    try {
      await requisitionService.approveRequisition(id, comments);
      toast.success("Requisition approved on backend!");
      await refreshAll();
      return true;
    } catch (err: any) {
      console.error("Failed to approve requisition:", err);
      toast.error(err.message || "Failed to approve requisition");
      return false;
    }
  };

  const rejectRequisition = async (id: string, reason?: string): Promise<boolean> => {
    try {
      await requisitionService.rejectRequisition(id, reason || "Rejected by Project Manager");
      toast.info("Requisition rejected on backend.");
      await refreshAll();
      return true;
    } catch (err: any) {
      console.error("Failed to reject requisition:", err);
      toast.error(err.message || "Failed to reject requisition");
      return false;
    }
  };

  const cancelRequisition = async (id: string): Promise<boolean> => {
    try {
      await requisitionService.cancelRequisition(id);
      toast.success("Requisition cancelled!");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to cancel requisition:", err);
      toast.error(err instanceof Error ? err.message : "Failed to cancel requisition");
      return false;
    }
  };

  const createPurchaseOrder = async (
    reqId: string,
    opts: {
      supplierId: string;
      expectedDeliveryDate?: string;
      remarks?: string;
      items: { materialId: string; orderedQuantity: number; unitPrice: number }[];
    }
  ): Promise<PurchaseOrder | null> => {
    if (!activeProjectId) {
      toast.error("No active project found in database to associate the purchase order with.");
      return null;
    }

    if (!opts.supplierId) {
      toast.error("Please select a supplier for the purchase order.");
      return null;
    }

    if (!opts.items || opts.items.length === 0) {
      toast.error("Purchase order must contain at least one item.");
      return null;
    }

    try {
      const payload = {
        projectId: activeProjectId,
        supplierId: opts.supplierId,
        materialRequestId: reqId,
        ...(opts.expectedDeliveryDate ? { expectedDeliveryDate: opts.expectedDeliveryDate } : {}),
        ...(opts.remarks ? { remarks: opts.remarks } : {}),
        items: opts.items,
      };

      const created = await purchaseOrderService.createPurchaseOrder(payload);
      const adapted = adaptPurchaseOrder(created);
      toast.success("Purchase order created as DRAFT on backend!");
      await refreshAll();
      return adapted;
    } catch (err: unknown) {
      console.error("Failed to create purchase order:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create purchase order on backend");
      return null;
    }
  };

  const submitPurchaseOrder = async (id: string): Promise<boolean> => {
    try {
      await purchaseOrderService.submitPurchaseOrder(id);
      toast.success("Purchase order submitted for approval!");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to submit purchase order:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit purchase order");
      return false;
    }
  };

  const approvePurchaseOrder = async (id: string): Promise<boolean> => {
    try {
      await purchaseOrderService.approvePurchaseOrder(id);
      toast.success("Purchase order approved on backend!");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to approve purchase order:", err);
      toast.error(err instanceof Error ? err.message : "Failed to approve purchase order");
      return false;
    }
  };

  const cancelPurchaseOrder = async (id: string, reason: string): Promise<boolean> => {
    try {
      await purchaseOrderService.cancelPurchaseOrder(id, reason);
      toast.info("Purchase order cancelled on backend.");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to cancel purchase order:", err);
      toast.error(err instanceof Error ? err.message : "Failed to cancel purchase order");
      return false;
    }
  };

  const closePurchaseOrder = async (id: string): Promise<boolean> => {
    try {
      await purchaseOrderService.closePurchaseOrder(id);
      toast.success("Purchase order closed on backend!");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to close purchase order:", err);
      toast.error(err instanceof Error ? err.message : "Failed to close purchase order");
      return false;
    }
  };

  const createSupplier = async (data: {
    supplierCode: string;
    companyName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<Supplier | null> => {
    try {
      const created = await purchaseOrderService.createSupplier(data);
      const adapted = adaptSupplier(created);
      setSuppliers((prev) => (prev.some((s) => s.id === adapted.id) ? prev : [adapted, ...prev]));
      toast.success("Supplier created on backend database!");
      return adapted;
    } catch (err: unknown) {
      console.error("Failed to create supplier:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create supplier on backend");
      return null;
    }
  };

  const confirmGrn = async (id: string): Promise<boolean> => {
    try {
      await grnService.confirmGrn(id);
      toast.success("GRN confirmed & posted on backend!");
      await refreshAll();
      return true;
    } catch (err: any) {
      console.error("Failed to confirm GRN:", err);
      toast.error(err.message || "Failed to confirm GRN");
      return false;
    }
  };

  const createGrn = async (payload: {
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
  }): Promise<boolean> => {
    try {
      await grnService.createGrn(payload);
      toast.success("GRN logged as DRAFT on backend!");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to create GRN:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create GRN on backend");
      return false;
    }
  };

  const rejectGrn = async (id: string, reason: string): Promise<boolean> => {
    try {
      await grnService.rejectGrn(id, reason);
      toast.success("GRN rejected on backend.");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to reject GRN:", err);
      toast.error(err instanceof Error ? err.message : "Failed to reject GRN");
      return false;
    }
  };

  const completeInspection = async (
    id: string,
    result: "ACCEPTED" | "REJECTED" | "CONDITIONALLY_ACCEPTED" | "PARTIALLY_ACCEPTED" | "QUARANTINED",
    note?: string,
    correctiveAction?: string,
    storageLocations?: { grnItemId: string; storageLocationId: string }[]
  ): Promise<boolean> => {
    try {
      await inspectionService.completeInspection(id, {
        decision: result,
        remarks: note,
        correctiveAction,
        storageLocations,
      });
      toast.success(`Inspection completed as ${result}!`);
      await refreshAll();
      return true;
    } catch (err: any) {
      console.error("Failed to complete inspection:", err);
      toast.error(err.message || "Failed to complete inspection");
      return false;
    }
  };

  const createInspection = async (payload: {
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
  }): Promise<boolean> => {
    try {
      await inspectionService.createInspection(payload);
      toast.success("Inspection created on backend!");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to create inspection:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create inspection on backend");
      return false;
    }
  };

  const startInspection = async (id: string): Promise<boolean> => {
    try {
      await inspectionService.startInspection(id);
      toast.success("Inspection started!");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      console.error("Failed to start inspection:", err);
      toast.error(err instanceof Error ? err.message : "Failed to start inspection");
      return false;
    }
  };

  return {
    state,
    setState,
    materials,
    project,
    suppliers,
    loading,
    error,
    activeProjectId,
    refreshAll,
    createRequisition,
    submitRequisition,
    startRequisitionReview,
    approveRequisition,
    rejectRequisition,
    cancelRequisition,
    createPurchaseOrder,
    submitPurchaseOrder,
    approvePurchaseOrder,
    cancelPurchaseOrder,
    closePurchaseOrder,
    createSupplier,
    confirmGrn,
    rejectGrn,
    createGrn,
    completeInspection,
    createInspection,
    startInspection,
  };
}
