import { Request, Response } from "express";

import {
  createZone,
  getZones,
  getZoneById,
  updateZone,
  deleteZone,
} from "../services/zone.service";

export async function createZoneController(
  req: Request,
  res: Response
) {
  try {
    const zone = await createZone(req.body);

    return res.status(201).json({
      success: true,
      message: "Zone created successfully",
      data: zone,
    });
  } catch (error: any) {
    console.error("Create zone error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create zone",
    });
  }
}

export async function getZonesController(
  req: Request,
  res: Response
) {
  try {
    const projectId = req.query.projectId
      ? String(req.query.projectId)
      : undefined;

    const buildingId = req.query.buildingId
      ? String(req.query.buildingId)
      : undefined;

    const zones = await getZones(
      projectId,
      buildingId
    );

    return res.status(200).json({
      success: true,
      data: zones,
    });
  } catch (error: any) {
    console.error("Get zones error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get zones",
    });
  }
}

export async function getZoneByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const zone = await getZoneById(id);

    return res.status(200).json({
      success: true,
      data: zone,
    });
  } catch (error: any) {
    console.error("Get zone error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Zone not found",
    });
  }
}

export async function updateZoneController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const zone = await updateZone(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Zone updated successfully",
      data: zone,
    });
  } catch (error: any) {
    console.error("Update zone error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update zone",
    });
  }
}

export async function deleteZoneController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    await deleteZone(id);

    return res.status(200).json({
      success: true,
      message: "Zone deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete zone error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete zone",
    });
  }
}