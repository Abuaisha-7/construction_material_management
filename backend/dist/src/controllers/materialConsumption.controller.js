"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialConsumptionController = createMaterialConsumptionController;
exports.getMaterialConsumptionsController = getMaterialConsumptionsController;
exports.getMaterialConsumptionByIdController = getMaterialConsumptionByIdController;
exports.updateMaterialConsumptionController = updateMaterialConsumptionController;
exports.deleteMaterialConsumptionController = deleteMaterialConsumptionController;
const materialConsumption_service_1 = require("../services/materialConsumption.service");
async function createMaterialConsumptionController(req, res) {
    try {
        const consumption = await (0, materialConsumption_service_1.createMaterialConsumption)(req.body);
        return res.status(201).json({
            success: true,
            message: "Material consumption recorded successfully",
            data: consumption,
        });
    }
    catch (error) {
        console.error("Create material consumption error:", error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create material consumption",
        });
    }
}
async function getMaterialConsumptionsController(req, res) {
    try {
        const { projectId, materialId, issueId, activityId, buildingId, zoneId, startDate, endDate, } = req.query;
        const consumptions = await (0, materialConsumption_service_1.getMaterialConsumptions)({
            projectId: projectId,
            materialId: materialId,
            issueId: issueId,
            activityId: activityId,
            buildingId: buildingId,
            zoneId: zoneId,
            startDate: startDate,
            endDate: endDate,
        });
        return res.status(200).json({
            success: true,
            count: consumptions.length,
            data: consumptions,
        });
    }
    catch (error) {
        console.error("Get material consumptions error:", error);
        return res.status(500).json({
            success: false,
            message: error.message ||
                "Failed to retrieve material consumptions",
        });
    }
}
async function getMaterialConsumptionByIdController(req, res) {
    try {
        const { id } = req.params;
        const consumption = await (0, materialConsumption_service_1.getMaterialConsumptionById)(id);
        return res.status(200).json({
            success: true,
            data: consumption,
        });
    }
    catch (error) {
        console.error("Get material consumption error:", error);
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Material consumption not found",
        });
    }
}
async function updateMaterialConsumptionController(req, res) {
    try {
        const { id } = req.params;
        const consumption = await (0, materialConsumption_service_1.updateMaterialConsumption)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Material consumption updated successfully",
            data: consumption,
        });
    }
    catch (error) {
        console.error("Update material consumption error:", error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to update material consumption",
        });
    }
}
async function deleteMaterialConsumptionController(req, res) {
    try {
        const { id } = req.params;
        await (0, materialConsumption_service_1.deleteMaterialConsumption)(id);
        return res.status(200).json({
            success: true,
            message: "Material consumption deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete material consumption error:", error);
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Failed to delete material consumption",
        });
    }
}
