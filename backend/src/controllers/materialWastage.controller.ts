import { Request, Response } from "express";

import {
  createMaterialWastage,
  getMaterialWastageById,
  getMaterialWastages,
  updateMaterialWastage,
  approveMaterialWastage,
  rejectMaterialWastage,
  postMaterialWastage,
} from "../services/materialWastage.service";

import { StockAdjustmentStatus } from "@prisma/client";

export async function createMaterialWastageController(
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

    const wastage =
      await createMaterialWastage(
        userId,
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        "Material wastage reported successfully",
      data: wastage,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create material wastage",
    });
  }
}

export async function getMaterialWastagesController(
  req: Request,
  res: Response
) {
  try {
    const {
      projectId,
      materialId,
      activityId,
      buildingId,
      status,
    } = req.query;

    const wastages =
      await getMaterialWastages({
        projectId: projectId as string | undefined,
        materialId:
          materialId as string | undefined,
        activityId:
          activityId as string | undefined,
        buildingId:
          buildingId as string | undefined,
        status:
          status as
            | StockAdjustmentStatus
            | undefined,
      });

    return res.status(200).json({
      success: true,
      data: wastages,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch material wastages",
    });
  }
}

export async function getMaterialWastageByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const wastage =
      await getMaterialWastageById(id);

    return res.status(200).json({
      success: true,
      data: wastage,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Material wastage not found",
    });
  }
}

export async function updateMaterialWastageController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const wastage =
      await updateMaterialWastage(
        id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Material wastage updated successfully",
      data: wastage,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update material wastage",
    });
  }
}

export async function approveMaterialWastageController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const approverId =
      (req as any).user?.id;

    if (!approverId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const wastage =
      await approveMaterialWastage(
        id,
        approverId
      );

    return res.status(200).json({
      success: true,
      message:
        "Material wastage approved successfully",
      data: wastage,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to approve material wastage",
    });
  }
}

export async function rejectMaterialWastageController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const approverId =
      (req as any).user?.id;

    if (!approverId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const wastage =
      await rejectMaterialWastage(
        id,
        approverId
      );

    return res.status(200).json({
      success: true,
      message:
        "Material wastage rejected successfully",
      data: wastage,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to reject material wastage",
    });
  }
}

export async function postMaterialWastageController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const userId =
      (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const wastage =
      await postMaterialWastage(
        id,
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Material wastage posted and inventory updated successfully",
      data: wastage,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to post material wastage",
    });
  }
}

