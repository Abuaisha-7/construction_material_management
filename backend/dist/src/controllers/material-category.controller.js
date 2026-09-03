"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = createCategory;
exports.getCategories = getCategories;
exports.getCategoryById = getCategoryById;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const material_category_service_1 = require("../services/material-category.service");
async function createCategory(req, res) {
    try {
        const category = await (0, material_category_service_1.createCategory)(req.body);
        return res.status(201).json({
            success: true,
            message: "Material category created successfully",
            data: category,
        });
    }
    catch (error) {
        console.error("Create category error:", error);
        if (error instanceof Error &&
            error.message === "CATEGORY_ALREADY_EXISTS") {
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
async function getCategories(_req, res) {
    try {
        const categories = await (0, material_category_service_1.getCategories)();
        return res.status(200).json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        console.error("Get categories error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
        });
    }
}
async function getCategoryById(req, res) {
    try {
        const { id } = req.params;
        const category = await (0, material_category_service_1.getCategoryById)(id);
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
    }
    catch (error) {
        console.error("Get category error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch category",
        });
    }
}
async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const category = await (0, material_category_service_1.updateCategory)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Material category updated successfully",
            data: category,
        });
    }
    catch (error) {
        console.error("Update category error:", error);
        if (error instanceof Error &&
            error.message === "CATEGORY_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        if (error instanceof Error &&
            error.message === "CATEGORY_ALREADY_EXISTS") {
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
async function deleteCategory(req, res) {
    try {
        const { id } = req.params;
        await (0, material_category_service_1.deleteCategory)(id);
        return res.status(200).json({
            success: true,
            message: "Material category deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete category error:", error);
        if (error instanceof Error &&
            error.message === "CATEGORY_NOT_FOUND") {
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
