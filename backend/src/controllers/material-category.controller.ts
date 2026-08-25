import { Request, Response } from "express";

import {
  createCategory as createCategoryService,
  getCategories as getCategoriesService,
  getCategoryById as getCategoryByIdService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
} from "../services/material-category.service";

export async function createCategory(
  req: Request,
  res: Response
) {
  try {
    const category = await createCategoryService(req.body);

    return res.status(201).json({
      success: true,
      message: "Material category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    if (
      error instanceof Error &&
      error.message === "CATEGORY_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
}

export async function getCategories(
  _req: Request,
  res: Response
) {
  try {
    const categories = await getCategoriesService();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
}

export async function getCategoryById(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const category = await getCategoryByIdService(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
}

export async function updateCategory(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const category = await updateCategoryService(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Material category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);

    if (
      error instanceof Error &&
      error.message === "CATEGORY_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (
      error instanceof Error &&
      error.message === "CATEGORY_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
}

export async function deleteCategory(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    await deleteCategoryService(id);

    return res.status(200).json({
      success: true,
      message: "Material category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    if (
      error instanceof Error &&
      error.message === "CATEGORY_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
}