import { Request, Response } from "express";
import {
  createBuilding,
  getBuildings,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
} from "../services/building.service";

export async function createBuildingController(
  req: Request,
  res: Response
) {
  try {
    const building = await createBuilding(req.body);

    return res.status(201).json({
      success: true,
      message: "Building created successfully",
      data: building,
    });
  } catch (error: any) {
    console.error("Create building error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create building",
    });
  }
}

export async function getBuildingsController(
  req: Request,
  res: Response
) {
  try {
    const { projectId } = req.query;

    const buildings = await getBuildings(
      projectId ? String(projectId) : undefined
    );

    return res.status(200).json({
      success: true,
      data: buildings,
    });
  } catch (error: any) {
    console.error("Get buildings error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get buildings",
    });
  }
}

export async function getBuildingByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const building = await getBuildingById(id);

    return res.status(200).json({
      success: true,
      data: building,
    });
  } catch (error: any) {
    console.error("Get building error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Building not found",
    });
  }
}

export async function updateBuildingController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const building = await updateBuilding(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Building updated successfully",
      data: building,
    });
  } catch (error: any) {
    console.error("Update building error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update building",
    });
  }
}

export async function deleteBuildingController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    await deleteBuilding(id);

    return res.status(200).json({
      success: true,
      message: "Building deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete building error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete building",
    });
  }
}