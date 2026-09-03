import { Request, Response } from "express";

import {
  createUnit as createUnitService,
  getUnits as getUnitsService,
  getUnitById as getUnitByIdService,
  updateUnit as updateUnitService,
  deleteUnit as deleteUnitService,
} from "../services/unit.service";

/**
 * Create unit
 */
export async function createUnit(
  req: Request,
  res: Response
) {
  try {
    const unit = await createUnitService(req.body);

    return res.status(201).json({
      success: true,
      message: "Unit created successfully",
      data: unit,
    });
  } catch (error) {
    console.error("Create unit error:", error);

    if (
      error instanceof Error &&
      error.message === "UNIT_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "Unit code or name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create unit",
    });
  }
}

/**
 * Get all units
 */
export async function getUnits(
  _req: Request,
  res: Response
) {
  try {
    const units = await getUnitsService();

    return res.status(200).json({
      success: true,
      data: units,
    });
  } catch (error) {
    console.error("Get units error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch units",
    });
  }
}

/**
 * Get unit by ID
 */
export async function getUnitById(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const unit = await getUnitByIdService(id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    console.error("Get unit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unit",
    });
  }
}

/**
 * Update unit
 */
export async function updateUnit(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const unit = await updateUnitService(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Unit updated successfully",
      data: unit,
    });
  } catch (error) {
    console.error("Update unit error:", error);

    if (
      error instanceof Error &&
      error.message === "UNIT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    if (
      error instanceof Error &&
      error.message === "UNIT_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "Unit code or name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update unit",
    });
  }
}

/**
 * Delete unit
 */
export async function deleteUnit(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    await deleteUnitService(id);

    return res.status(200).json({
      success: true,
      message: "Unit deleted successfully",
    });
  } catch (error) {
    console.error("Delete unit error:", error);

    if (
      error instanceof Error &&
      error.message === "UNIT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete unit",
    });
  }
}