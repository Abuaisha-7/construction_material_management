import { Request, Response } from "express";

import {
  createStorageLocation,
  getStorageLocations,
  getStorageLocationById,
  updateStorageLocation,
  deactivateStorageLocation,
  activateStorageLocation,
} from "../services/storage-location.service";

import {
  createStorageLocationSchema,
  updateStorageLocationSchema,
  storageLocationListSchema,
} from "../schemas/storage-location.schema";

/**
 * POST /api/storage-locations
 */
export async function createStorageLocationController(
  req: Request,
  res: Response
) {
  try {
    const data =
      createStorageLocationSchema.parse(
        req.body
      );

    const storageLocation =
      await createStorageLocation(data);

    return res.status(201).json({
      success: true,
      message:
        "Storage location created successfully",
      data: storageLocation,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create storage location",
    });
  }
}

/**
 * GET /api/storage-locations
 */
export async function getStorageLocationsController(
  req: Request,
  res: Response
) {
  try {
    const query =
      storageLocationListSchema.parse(
        req.query
      );

    const result =
      await getStorageLocations(query);

    return res.status(200).json({
      success: true,
      message:
        "Storage locations retrieved successfully",
      data: result.storageLocations,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to retrieve storage locations",
    });
  }
}

/**
 * GET /api/storage-locations/:id
 */
export async function getStorageLocationByIdController(
  req: Request,
  res: Response
) {
  try {
    const storageLocation =
      await getStorageLocationById(
        (req as any).params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Storage location retrieved successfully",
      data: storageLocation,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Storage location not found",
    });
  }
}

/**
 * PATCH /api/storage-locations/:id
 */
export async function updateStorageLocationController(
  req: Request,
  res: Response
) {
  try {
    const data =
      updateStorageLocationSchema.parse(
        req.body
      );

    const storageLocation =
      await updateStorageLocation(
        (req as any).params.id,
        data
      );

    return res.status(200).json({
      success: true,
      message:
        "Storage location updated successfully",
      data: storageLocation,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update storage location",
    });
  }
}

/**
 * POST /api/storage-locations/:id/deactivate
 */
export async function deactivateStorageLocationController(
  req: Request,
  res: Response
) {
  try {
    const storageLocation =
      await deactivateStorageLocation(
        (req as any).params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Storage location deactivated successfully",
      data: storageLocation,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to deactivate storage location",
    });
  }
}

/**
 * POST /api/storage-locations/:id/activate
 */
export async function activateStorageLocationController(
  req: Request,
  res: Response
) {
  try {
    const storageLocation =
      await activateStorageLocation(
        (req as any).params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Storage location activated successfully",
      data: storageLocation,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to activate storage location",
    });
  }
}