"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialWastageController = createMaterialWastageController;
exports.getMaterialWastagesController = getMaterialWastagesController;
exports.getMaterialWastageByIdController = getMaterialWastageByIdController;
exports.updateMaterialWastageController = updateMaterialWastageController;
exports.approveMaterialWastageController = approveMaterialWastageController;
exports.rejectMaterialWastageController = rejectMaterialWastageController;
exports.postMaterialWastageController = postMaterialWastageController;
const materialWastage_service_1 = require("../services/materialWastage.service");
async function createMaterialWastageController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const wastage = await (0, materialWastage_service_1.createMaterialWastage)(userId, req.body);
        return res.status(201).json({
            success: true,
            message: "Material wastage reported successfully",
            data: wastage,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create material wastage",
        });
    }
}
async function getMaterialWastagesController(req, res) {
    try {
        const { projectId, materialId, activityId, buildingId, status, } = req.query;
        const wastages = await (0, materialWastage_service_1.getMaterialWastages)({
            projectId: projectId,
            materialId: materialId,
            activityId: activityId,
            buildingId: buildingId,
            status: status,
        });
        return res.status(200).json({
            success: true,
            data: wastages,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to fetch material wastages",
        });
    }
}
async function getMaterialWastageByIdController(req, res) {
    try {
        const { id } = req.params;
        const wastage = await (0, materialWastage_service_1.getMaterialWastageById)(id);
        return res.status(200).json({
            success: true,
            data: wastage,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Material wastage not found",
        });
    }
}
async function updateMaterialWastageController(req, res) {
    try {
        const { id } = req.params;
        const wastage = await (0, materialWastage_service_1.updateMaterialWastage)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Material wastage updated successfully",
            data: wastage,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to update material wastage",
        });
    }
}
async function approveMaterialWastageController(req, res) {
    try {
        const { id } = req.params;
        const approverId = req.user?.id;
        if (!approverId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const wastage = await (0, materialWastage_service_1.approveMaterialWastage)(id, approverId);
        return res.status(200).json({
            success: true,
            message: "Material wastage approved successfully",
            data: wastage,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to approve material wastage",
        });
    }
}
async function rejectMaterialWastageController(req, res) {
    try {
        const { id } = req.params;
        const approverId = req.user?.id;
        if (!approverId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const wastage = await (0, materialWastage_service_1.rejectMaterialWastage)(id, approverId);
        return res.status(200).json({
            success: true,
            message: "Material wastage rejected successfully",
            data: wastage,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to reject material wastage",
        });
    }
}
async function postMaterialWastageController(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const wastage = await (0, materialWastage_service_1.postMaterialWastage)(id, userId);
        return res.status(200).json({
            success: true,
            message: "Material wastage posted and inventory updated successfully",
            data: wastage,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to post material wastage",
        });
    }
}
