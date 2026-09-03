import { Request, Response } from "express";

import {
  createStockCount,
  getStockCountById,
  getStockCounts,
  updateStockCount,
  startStockCount,
  completeStockCount,
  approveStockCount,
} from "../services/stockCount.service";

import { StockCountStatus } from "@prisma/client";

export async function createStockCountController(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const count = await createStockCount(
      userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message:
        "Stock count created successfully",
      data: count,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create stock count",
    });
  }
}

export async function getStockCountsController(
  req: Request,
  res: Response
) {
  try {
    const {
      projectId,
      warehouseId,
      status,
    } = req.query;

    const counts =
      await getStockCounts({
        projectId:
          projectId as string | undefined,

        warehouseId:
          warehouseId as string | undefined,

        status:
          status as
            | StockCountStatus
            | undefined,
      });

    return res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch stock counts",
    });
  }
}

export async function getStockCountByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const count =
      await getStockCountById(id);

    return res.status(200).json({
      success: true,
      data: count,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Stock count not found",
    });
  }
}

export async function updateStockCountController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const count =
      await updateStockCount(
        id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Stock count updated successfully",
      data: count,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update stock count",
    });
  }
}

export async function startStockCountController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const count =
      await startStockCount(id);

    return res.status(200).json({
      success: true,
      message:
        "Stock count started successfully",
      data: count,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to start stock count",
    });
  }
}

export async function completeStockCountController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const count =
      await completeStockCount(id);

    return res.status(200).json({
      success: true,
      message:
        "Stock count completed successfully",
      data: count,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to complete stock count",
    });
  }
}

export async function approveStockCountController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const verifierId =
      (req as any).user?.id;

    if (!verifierId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const count =
      await approveStockCount(
        id,
        verifierId
      );

    return res.status(200).json({
      success: true,
      message:
        "Stock count approved successfully",
      data: count,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to approve stock count",
    });
  }
}
