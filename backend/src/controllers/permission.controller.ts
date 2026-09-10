import { Request, Response } from "express";

import {
  getPermissions,
  createPermission,
} from "../services/permission.service";

export async function getPermissionsController(
  req: Request,
  res: Response
) {
  try {
    const permissions = await getPermissions();

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch permissions",
    });
  }
}

export async function createPermissionController(
  req: Request,
  res: Response
) {
  try {
    const permission = await createPermission(req.body);

    return res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: permission,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create permission";

    if (message === "Permission with this name already exists") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create permission",
    });
  }
}