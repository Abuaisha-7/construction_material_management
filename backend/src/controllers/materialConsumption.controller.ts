import { Response } from "express";
import {
  AuthRequest,
} from "../middleware/auth.middleware";

import {
  createMaterialConsumption,
  getMaterialConsumptionById,
  getMaterialConsumptions,
  updateMaterialConsumption,
  deleteMaterialConsumption,
} from "../services/materialConsumption.service";

export async function createMaterialConsumptionController(
  req: AuthRequest,
  res: Response
) {
  try {
    const consumption =
      await createMaterialConsumption(req.body);

    return res.status(201).json({
      success: true,
      message:
        "Material consumption recorded successfully",
      data: consumption,
    });
  } catch (error: any) {
    console.error(
      "Create material consumption error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create material consumption",
    });
  }
}

export async function getMaterialConsumptionsController(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      projectId,
      materialId,
      issueId,
      activityId,
      buildingId,
      zoneId,
      startDate,
      endDate,
    } = req.query;

    const consumptions =
      await getMaterialConsumptions({
        projectId: projectId as string,
        materialId: materialId as string,
        issueId: issueId as string,
        activityId: activityId as string,
        buildingId: buildingId as string,
        zoneId: zoneId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

    return res.status(200).json({
      success: true,
      count: consumptions.length,
      data: consumptions,
    });
  } catch (error: any) {
    console.error(
      "Get material consumptions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to retrieve material consumptions",
    });
  }
}

export async function getMaterialConsumptionByIdController(
  req: AuthRequest,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const consumption =
      await getMaterialConsumptionById(id);

    return res.status(200).json({
      success: true,
      data: consumption,
    });
  } catch (error: any) {
    console.error(
      "Get material consumption error:",
      error
    );

    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Material consumption not found",
    });
  }
}

export async function updateMaterialConsumptionController(
  req: AuthRequest,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const consumption =
      await updateMaterialConsumption(
        id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Material consumption updated successfully",
      data: consumption,
    });
  } catch (error: any) {
    console.error(
      "Update material consumption error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update material consumption",
    });
  }
}

export async function deleteMaterialConsumptionController(
  req: AuthRequest,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    await deleteMaterialConsumption(id);

    return res.status(200).json({
      success: true,
      message:
        "Material consumption deleted successfully",
    });
  } catch (error: any) {
    console.error(
      "Delete material consumption error:",
      error
    );

    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Failed to delete material consumption",
    });
  }
}