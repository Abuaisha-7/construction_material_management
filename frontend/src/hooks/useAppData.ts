import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppState, Material, ProjectMeta } from "../types";
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
} from "../services/dataAdapters";
import { authService } from "../services/auth.service";

export interface AppDataContext {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  materials: Material[];
  project: ProjectMeta;
  loading: boolean;
  error: string | null;
  activeProjectId: string | null;
  refreshAll: () => Promise<void>;
  createRequisition: (items: { materialId: string; qty: number }[], remarks?: string) => Promise<boolean>;
  approveRequisition: (id: string) => Promise<boolean>;
  rejectRequisition: (id: string, reason?: string) => Promise<boolean>;
  confirmGrn: (id: string) => Promise<boolean>;
  completeInspection: (id: string, result: "ACCEPTED" | "REJECTED" | "QUARANTINED", note?: string) => Promise<boolean>;
}

export function useAppData(): AppDataContext {
  const [state, setState] = useState<AppState>(() => buildSeedState());
  const [materials, setMaterials] = useState<Material[]>(STATIC_MATERIALS);
  const [project, setProject] = useState<ProjectMeta>(STATIC_PROJECT);
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
      const [reqsRes, posRes, grnsRes, inspRes, invRes, issuesRes] = await Promise.allSettled([
        requisitionService.getRequisitions({ limit: 50 }),
        purchaseOrderService.getPurchaseOrders({ limit: 50 }),
        grnService.getGrns({ limit: 50 }),
        inspectionService.getInspections({ limit: 50 }),
        inventoryService.getInventoryBalances({ limit: 100 }),
        inventoryService.getMaterialIssues({ limit: 50 }),
      ]);

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
            : prev.inspections.length > 0
            ? prev.inspections
            : baseline.inspections;

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
    items: { materialId: string; qty: number }[],
    remarks?: string
  ): Promise<boolean> => {
    if (!activeProjectId) {
      toast.error("No active project found in database to associate requisition with.");
      return false;
    }

    try {
      const payload = {
        projectId: activeProjectId,
        remarks: remarks || "Site material request",
        items: items.map((it) => {
          const mat = materials.find((m) => m.id === it.materialId);
          return {
            materialId: it.materialId,
            requestedQuantity: it.qty,
            estimatedUnitPrice: mat?.unitPrice || 0,
            remarks: mat?.name,
          };
        }),
      };

      await requisitionService.createRequisition(payload);
      toast.success("Requisition created in backend database!");
      await refreshAll();
      return true;
    } catch (err: any) {
      console.error("Failed to create requisition:", err);
      toast.error(err.message || "Failed to create requisition on backend");
      return false;
    }
  };

  const approveRequisition = async (id: string): Promise<boolean> => {
    try {
      await requisitionService.approveRequisition(id, "Approved by Project Manager");
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

  const completeInspection = async (
    id: string,
    result: "ACCEPTED" | "REJECTED" | "QUARANTINED",
    note?: string
  ): Promise<boolean> => {
    try {
      await inspectionService.completeInspection(id, {
        overallResult: result,
        remarks: note,
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

  return {
    state,
    setState,
    materials,
    project,
    loading,
    error,
    activeProjectId,
    refreshAll,
    createRequisition,
    approveRequisition,
    rejectRequisition,
    confirmGrn,
    completeInspection,
  };
}
