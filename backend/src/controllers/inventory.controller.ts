import { Request, Response } from "express";

import {
  getInventoryBalances,
  getInventoryBalanceById,
  getInventoryTransactions,
  getInventoryTransactionById,
  createOpeningBalance,
  createInventoryAdjustment,
} from "../services/inventory.service";

// ============================================================
// GET /api/inventory/balances
// ============================================================

export async function getInventoryBalancesController(
  req: Request,
  res: Response
) {
  try {
    const balances =
      await getInventoryBalances({
        projectId:
          req.query.projectId as string | undefined,

        materialId:
          req.query.materialId as string | undefined,

        warehouseId:
          req.query.warehouseId as string | undefined,

        storageLocationId:
          req.query.storageLocationId as
            | string
            | undefined,
      });

    return res.status(200).json({
      success: true,
      data: balances,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to retrieve inventory balances",
    });
  }
}

// ============================================================
// GET /api/inventory/balances/:id
// ============================================================

export async function getInventoryBalanceController(
  req: Request,
  res: Response
) {
  try {
    const balance =
      await getInventoryBalanceById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Inventory balance not found",
    });
  }
}

// ============================================================
// GET /api/inventory/transactions
// ============================================================

export async function getInventoryTransactionsController(
  req: Request,
  res: Response
) {
  try {
    const result =
      await getInventoryTransactions({
        projectId:
          req.query.projectId as string | undefined,

        materialId:
          req.query.materialId as string | undefined,

        warehouseId:
          req.query.warehouseId as string | undefined,

        storageLocationId:
          req.query.storageLocationId as
            | string
            | undefined,

        transactionType:
          req.query.transactionType as any,

        referenceType:
          req.query.referenceType as
            | string
            | undefined,

        referenceId:
          req.query.referenceId as
            | string
            | undefined,

        page:
          Number(req.query.page) || 1,

        limit:
          Number(req.query.limit) || 20,
      });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to retrieve inventory transactions",
    });
  }
}

// ============================================================
// GET /api/inventory/transactions/:id
// ============================================================

export async function getInventoryTransactionController(
  req: Request,
  res: Response
) {
  try {
    const transaction =
      await getInventoryTransactionById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Inventory transaction not found",
    });
  }
}

// ============================================================
// POST /api/inventory/opening-balance
// ============================================================

export async function createOpeningBalanceController(
  req: Request,
  res: Response
) {
  try {
    const userId =
      (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      projectId,
      materialId,
      warehouseId,
      storageLocationId,
      quantity,
      unitCost,
      reason,
    } = req.body;

    if (
      !projectId ||
      !materialId ||
      !warehouseId ||
      quantity === undefined ||
      unitCost === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "projectId, materialId, warehouseId, quantity and unitCost are required",
      });
    }

    const result =
      await createOpeningBalance(
        {
          projectId,
          materialId,
          warehouseId,
          storageLocationId,
          quantity,
          unitCost,
          reason,
        },
        userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Opening balance created successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create opening balance",
    });
  }
}

// ============================================================
// POST /api/inventory/adjustment
// ============================================================

export async function createInventoryAdjustmentController(
  req: Request,
  res: Response
) {
  try {
    const userId =
      (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      projectId,
      materialId,
      warehouseId,
      storageLocationId,
      quantity,
      type,
      reason,
    } = req.body;

    if (
      !projectId ||
      !materialId ||
      !warehouseId ||
      quantity === undefined ||
      !type ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "projectId, materialId, warehouseId, quantity, type and reason are required",
      });
    }

    const result =
      await createInventoryAdjustment(
        {
          projectId,
          materialId,
          warehouseId,
          storageLocationId,
          quantity,
          type,
          reason,
        },
        userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Inventory adjustment created successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create inventory adjustment",
    });
  }
}
