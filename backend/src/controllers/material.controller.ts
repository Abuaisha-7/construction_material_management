import {
  Request,
  Response
} from "express";

import {
  createMaterial,
  getMaterials,
  getMaterialById
} from "../services/material.service";

import {
  createMaterialSchema,
} from "../schemas/material.schema";


export async function createMaterialController(
  req: Request,
  res: Response
) {
  try {
    const result =
      createMaterialSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten(),
      });
    }

    const material =
      await createMaterial(result.data);

    return res.status(201).json({
      success: true,
      message: "Material created successfully",
      data: material,
    });
  } catch (error: any) {
    console.error(error);

    if (
      error.message ===
      "Material code already exists"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      "Material category not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      "Unit of measurement not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create material",
    });
  }
}

export async function getMaterialsController(
  req: Request,
  res: Response
) {
  try {

    const search =
      req.query.search
        ? String(req.query.search)
        : undefined;

    const categoryId =
      req.query.categoryId
        ? String(req.query.categoryId)
        : undefined;

    const unitId =
      req.query.unitId
        ? String(req.query.unitId)
        : undefined;

    const isActive =
      req.query.isActive !== undefined
        ? String(
            req.query.isActive
          ) === "true"
        : undefined;

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 20;

    const result =
      await getMaterials({
        search,
        categoryId,
        unitId,
        isActive,
        page,
        limit
      });

    return res.json({
      success: true,
      data: result.materials,
      pagination:
        result.pagination
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch materials"
    });
  }
}

export async function getMaterialController(
  req: Request,
  res: Response
) {
  try {

    const material =
      await getMaterialById(
        req.params.id
      );

    return res.json({
      success: true,
      data: material
    });

  } catch (error) {

    if (
      error instanceof Error &&
      error.message ===
        "MATERIAL_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Material not found"
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch material"
    });
  }
}