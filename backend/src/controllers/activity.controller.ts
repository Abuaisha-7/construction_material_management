import { Request, Response } from "express";

import {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} from "../services/activity.service";

export async function createActivityController(
  req: Request,
  res: Response
) {
  try {
    const activity = await createActivity(req.body);

    return res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: activity,
    });
  } catch (error: any) {
    console.error("Create activity error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to create activity",
    });
  }
}

export async function getActivitiesController(
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

    const zoneId = req.query.zoneId
      ? String(req.query.zoneId)
      : undefined;

    const status = req.query.status
      ? String(req.query.status)
      : undefined;

    const activities = await getActivities(
      projectId,
      buildingId,
      zoneId,
      status as any
    );

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error: any) {
    console.error("Get activities error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to get activities",
    });
  }
}

export async function getActivityByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const activity = await getActivityById(id);

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    console.error("Get activity error:", error);

    return res.status(404).json({
      success: false,
      message:
        error.message || "Activity not found",
    });
  }
}

export async function updateActivityController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const activity = await updateActivity(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: activity,
    });
  } catch (error: any) {
    console.error("Update activity error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to update activity",
    });
  }
}

export async function deleteActivityController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    await deleteActivity(id);

    return res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete activity error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to delete activity",
    });
  }
}