import { Request, Response } from "express";
import {
  createMaterialReturn,
  getMaterialReturnById,
  getMaterialReturns,
  updateMaterialReturn,
  receiveMaterialReturn,
} from "../services/materialReturn.service";
import { MaterialReturnStatus } from "@prisma/client";

export async function createMaterialReturnController(
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

    const materialReturn = await createMaterialReturn(
      userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Material return created successfully",
      data: materialReturn,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create material return",
    });
  }
}

export async function getMaterialReturnsController(
  req: Request,
  res: Response
) {
  try {
    const {
      projectId,
      status,
      originalIssueId,
    } = req.query;

    const materialReturns = await getMaterialReturns({
      projectId: projectId as string | undefined,
      status: status as MaterialReturnStatus | undefined,
      originalIssueId:
        originalIssueId as string | undefined,
    });

    return res.status(200).json({
      success: true,
      data: materialReturns,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to fetch material returns",
    });
  }
}

export async function getMaterialReturnByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const materialReturn =
      await getMaterialReturnById(id);

    return res.status(200).json({
      success: true,
      data: materialReturn,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message:
        error.message || "Material return not found",
    });
  }
}

export async function updateMaterialReturnController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const materialReturn =
      await updateMaterialReturn(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Material return updated successfully",
      data: materialReturn,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to update material return",
    });
  }
}

export async function receiveMaterialReturnController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const receiverId = (req as any).user?.id;

    if (!receiverId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const materialReturn =
      await receiveMaterialReturn(
        id,
        receiverId
      );

    return res.status(200).json({
      success: true,
      message:
        "Material return received and inventory updated successfully",
      data: materialReturn,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to receive material return",
    });
  }
}
