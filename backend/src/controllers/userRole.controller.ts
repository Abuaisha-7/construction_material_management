import { Request, Response } from "express";

import {
  assignRoleToUser,
  getAllUserRoles,
  getUserRolesByUser as getRolesByUser,
  getUserRole as getOneUserRole,
  removeRoleFromUser,
} from "../services/userRole.service";


// =====================================================
// ASSIGN ROLE
// POST /api/user-roles
// =====================================================
export async function createUserRole(
  req: Request,
  res: Response
) {
  try {
    const { userId, roleId } = req.body;

    const userRole = await assignRoleToUser({
      userId,
      roleId,
    });

    return res.status(201).json({
      success: true,
      message: "Role assigned successfully",
      data: userRole,
    });
  } catch (error) {
    console.error("Create user role error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to assign role";

    const statusCode =
      message === "User not found" ||
      message === "Role not found" ||
      message === "Role assignment not found"
        ? 404
        : message ===
            "Role is already assigned to this user"
          ? 409
          : 500;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}


// =====================================================
// GET ALL
// GET /api/user-roles
// =====================================================
export async function getUserRoles(
  req: Request,
  res: Response
) {
  try {
    const userRoles = await getAllUserRoles();

    return res.status(200).json({
      success: true,
      data: userRoles,
    });
  } catch (error) {
    console.error("Get user roles error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user roles",
    });
  }
}


// =====================================================
// GET USER'S ROLES
// GET /api/user-roles/user/:userId
// =====================================================
export async function getUserRolesForUser(
  req: Request,
  res: Response
) {
  try {
    const { userId } = (req as any).params;

    const result = await getRolesByUser(userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Get user roles by user error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve user roles";

    const statusCode =
      message === "User not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}


// =====================================================
// GET ONE ASSIGNMENT
// GET /api/user-roles/:userId/:roleId
// =====================================================
export async function getUserRole(
  req: Request,
  res: Response
) {
  try {
    const { userId, roleId } = (req as any).params;

    const userRole = await getOneUserRole(
      userId,
      roleId
    );

    return res.status(200).json({
      success: true,
      data: userRole,
    });
  } catch (error) {
    console.error(
      "Get user role error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve role assignment";

    const statusCode =
      message === "Role assignment not found"
        ? 404
        : 500;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}


// =====================================================
// REMOVE ROLE
// DELETE /api/user-roles/:userId/:roleId
// =====================================================
export async function deleteUserRole(
  req: Request,
  res: Response
) {
  try {
    const { userId, roleId } = (req as any).params;

    await removeRoleFromUser(
      userId,
      roleId
    );

    return res.status(200).json({
      success: true,
      message:
        "Role removed from user successfully",
    });
  } catch (error) {
    console.error(
      "Delete user role error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove role";

    const statusCode =
      message === "Role assignment not found"
        ? 404
        : 500;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}