import { Request, Response } from "express";
import {
  createStockAdjustment,
  getStockAdjustments,
  getStockAdjustmentById,
  updateStockAdjustment,
  approveStockAdjustment,
  rejectStockAdjustment,
  postStockAdjustment,
} from "../services/stockAdjustment.service";

export async function create(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as any).user?.id;

    const adjustment = await createStockAdjustment(
      req.body,
      userId
    );

    return res.status(201).json({
      success: true,
      message: "Stock adjustment created successfully",
      data: adjustment,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getAll(
  req: Request,
  res: Response
) {
  try {
    const adjustments = await getStockAdjustments({
      projectId: req.query.projectId as string | undefined,
      warehouseId: req.query.warehouseId as string | undefined,
      status: req.query.status as any,
    });

    return res.status(200).json({
      success: true,
      data: adjustments,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getById(
  req: Request,
  res: Response
) {
  try {
    const adjustment =
      await getStockAdjustmentById((req as any).params.id);

    return res.status(200).json({
      success: true,
      data: adjustment,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

export async function update(
  req: Request,
  res: Response
) {
  try {
    const adjustment =
      await updateStockAdjustment(
        (req as any).params.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Stock adjustment updated successfully",
      data: adjustment,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function approve(
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

    const adjustment =
      await approveStockAdjustment(
        (req as any).params.id,
        userId
      );

    return res.status(200).json({
      success: true,
      message: "Stock adjustment approved successfully",
      data: adjustment,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function reject(
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

    const adjustment =
      await rejectStockAdjustment(
        (req as any).params.id,
        userId
      );

    return res.status(200).json({
      success: true,
      message: "Stock adjustment rejected successfully",
      data: adjustment,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function post(
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

    const adjustment =
      await postStockAdjustment(
        (req as any).params.id,
        userId
      );

    return res.status(200).json({
      success: true,
      message: "Stock adjustment posted successfully",
      data: adjustment,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}