import { Request, Response } from "express";

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
} from "../services/user.service";

export async function getUsersController(
  req: Request,
  res: Response
) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const status =
      typeof req.query.status === "string" &&
      ["ACTIVE", "INACTIVE", "SUSPENDED"].includes(req.query.status)
        ? (req.query.status as "ACTIVE" | "INACTIVE" | "SUSPENDED")
        : undefined;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await getUsers({
      search,
      status,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.users,
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
      message: "Failed to fetch users",
    });
  }
}

export async function getUserByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const user = await getUserById(id);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch user";

    if (message === "User not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
}

export async function createUserController(
  req: Request,
  res: Response
) {
  try {
    const user = await createUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create user";

    if (message === "User with this email already exists") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
}

export async function updateUserController(
  req: Request,
  res: Response
) {
  try {
    const { id } = (req as any).params;

    const user = await updateUser(id, req.body);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update user";

    if (message === "User not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message === "User with this email already exists") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
}