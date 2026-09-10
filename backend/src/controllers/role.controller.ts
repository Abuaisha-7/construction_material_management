import { Request, Response } from "express";

import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../services/role.service";

export async function getRolesController(
  req: Request,
  res: Response
) {
  try {
    const roles = await getRoles();

    return res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
    });
  }
}

export async function getRoleByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const role = await getRoleById(id);

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch role";

    if (message === "Role not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch role",
    });
  }
}

export async function createRoleController(
  req: Request,
  res: Response
) {
  try {
    const role = await createRole(req.body);

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create role";

    if (message === "Role with this name already exists") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create role",
    });
  }
}

export async function updateRoleController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const role = await updateRole(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update role";

    if (message === "Role not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message === "Role with this name already exists") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update role",
    });
  }
}

export async function deleteRoleController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    await deleteRole(id);

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete role";

    if (message === "Role not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete role",
    });
  }
}