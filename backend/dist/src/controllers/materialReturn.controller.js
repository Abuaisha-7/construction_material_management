"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialReturnController = createMaterialReturnController;
exports.getMaterialReturnsController = getMaterialReturnsController;
exports.getMaterialReturnByIdController = getMaterialReturnByIdController;
exports.updateMaterialReturnController = updateMaterialReturnController;
exports.receiveMaterialReturnController = receiveMaterialReturnController;
const materialReturn_service_1 = require("../services/materialReturn.service");
async function createMaterialReturnController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const materialReturn = await (0, materialReturn_service_1.createMaterialReturn)(userId, req.body);
        return res.status(201).json({
            success: true,
            message: "Material return created successfully",
            data: materialReturn,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create material return",
        });
    }
}
async function getMaterialReturnsController(req, res) {
    try {
        const { projectId, status, originalIssueId, } = req.query;
        const materialReturns = await (0, materialReturn_service_1.getMaterialReturns)({
            projectId: projectId,
            status: status,
            originalIssueId: originalIssueId,
        });
        return res.status(200).json({
            success: true,
            data: materialReturns,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to fetch material returns",
        });
    }
}
async function getMaterialReturnByIdController(req, res) {
    try {
        const { id } = req.params;
        const materialReturn = await (0, materialReturn_service_1.getMaterialReturnById)(id);
        return res.status(200).json({
            success: true,
            data: materialReturn,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message || "Material return not found",
        });
    }
}
async function updateMaterialReturnController(req, res) {
    try {
        const { id } = req.params;
        const materialReturn = await (0, materialReturn_service_1.updateMaterialReturn)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Material return updated successfully",
            data: materialReturn,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update material return",
        });
    }
}
async function receiveMaterialReturnController(req, res) {
    try {
        const { id } = req.params;
        const receiverId = req.user?.id;
        if (!receiverId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const materialReturn = await (0, materialReturn_service_1.receiveMaterialReturn)(id, receiverId);
        return res.status(200).json({
            success: true,
            message: "Material return received and inventory updated successfully",
            data: materialReturn,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to receive material return",
        });
    }
}
