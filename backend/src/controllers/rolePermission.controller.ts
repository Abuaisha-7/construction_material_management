import { Request, Response } from "express";

import {
  assignPermissionToRole,
  getAllRolePermissions,
  getRolePermission as getOneRolePermission,
  removePermissionFromRole,
} from "../services/rolePermission.service";

export async function createRolePermission(
  req: Request,
  res: Response
) {
  try {
    const { roleId, permissionId } = req.body;

    const rolePermission = await assignPermissionToRole({
      roleId,
      permissionId,
    });

    return res.status(201).json({
      success: true,
      message: "Permission assigned to role successfully",
      data: rolePermission,
    });
  } catch (error) {
    console.error("Create role permission error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to assign permission";

    const statusCode =
      message === "Role not found" ||
      message === "Permission not found" ||
      message === "Role permission assignment not found"
        ? 404
        : message === "Permission is already assigned to this role"
          ? 409
          : 500;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function getRolePermissions(
  req: Request,
  res: Response
) {
  try {
    const rolePermissions = await getAllRolePermissions();

    return res.status(200).json({
      success: true,
      data: rolePermissions,
    });
  } catch (error) {
    console.error("Get role permissions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve role permissions",
    });
  }
}

export async function getRolePermission(
  req: Request,
  res: Response
) {
  try {
    const { roleId, permissionId } = (req as any).params;

    const rolePermission = await getOneRolePermission(
      roleId,
      permissionId
    );

    return res.status(200).json({
      success: true,
      data: rolePermission,
    });
  } catch (error) {
    console.error("Get role permission error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve role permission";

    const statusCode =
      message === "Role permission assignment not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function deleteRolePermission(
  req: Request,
  res: Response
) {
  try {
    const { roleId, permissionId } = (req as any).params;

    await removePermissionFromRole(roleId, permissionId);

    return res.status(200).json({
      success: true,
      message: "Permission removed from role successfully",
    });
  } catch (error) {
    console.error("Delete role permission error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove permission";

    const statusCode =
      message === "Role permission assignment not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}