import { Request, Response } from "express";

import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../services/supplier.service";

import {
  createSupplierSchema,
  updateSupplierSchema,
} from "../schemas/supplier.schema";

/**
 * POST /api/suppliers
 */
export async function createSupplierController(
  req: Request,
  res: Response
) {
  try {
    const result =
      createSupplierSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten(),
      });
    }

    const supplier =
      await createSupplier(result.data);

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create supplier";

    if (
      message === "Supplier code already exists"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create supplier",
    });
  }
}

/**
 * GET /api/suppliers
 */
export async function getSuppliersController(
  req: Request,
  res: Response
) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    let isActive: boolean | undefined;

    if (req.query.isActive === "true") {
      isActive = true;
    }

    if (req.query.isActive === "false") {
      isActive = false;
    }

    const result = await getSuppliers({
      search,
      page,
      limit,
      isActive,
    });

    return res.status(200).json({
      success: true,
      data: result.suppliers,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers",
    });
  }
}

/**
 * GET /api/suppliers/:id
 */
export async function getSupplierByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const supplier =
      await getSupplierById(id);

    return res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch supplier";

    if (message === "Supplier not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch supplier",
    });
  }
}

/**
 * PATCH /api/suppliers/:id
 */
export async function updateSupplierController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const result =
      updateSupplierSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten(),
      });
    }

    const supplier =
      await updateSupplier(id, result.data);

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update supplier";

    if (
      message === "Supplier not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message === "Supplier code already exists"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update supplier",
    });
  }
}

/**
 * DELETE /api/suppliers/:id
 */
export async function deleteSupplierController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    await deleteSupplier(id);

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete supplier";

    if (
      message === "Supplier not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete supplier",
    });
  }
}
