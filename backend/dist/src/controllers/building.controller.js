"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBuildingController = createBuildingController;
exports.getBuildingsController = getBuildingsController;
exports.getBuildingByIdController = getBuildingByIdController;
exports.updateBuildingController = updateBuildingController;
exports.deleteBuildingController = deleteBuildingController;
const building_service_1 = require("../services/building.service");
async function createBuildingController(req, res) {
    try {
        const building = await (0, building_service_1.createBuilding)(req.body);
        return res.status(201).json({
            success: true,
            message: "Building created successfully",
            data: building,
        });
    }
    catch (error) {
        console.error("Create building error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create building",
        });
    }
}
async function getBuildingsController(req, res) {
    try {
        const { projectId } = req.query;
        const buildings = await (0, building_service_1.getBuildings)(projectId ? String(projectId) : undefined);
        return res.status(200).json({
            success: true,
            data: buildings,
        });
    }
    catch (error) {
        console.error("Get buildings error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get buildings",
        });
    }
}
async function getBuildingByIdController(req, res) {
    try {
        const { id } = req.params;
        const building = await (0, building_service_1.getBuildingById)(id);
        return res.status(200).json({
            success: true,
            data: building,
        });
    }
    catch (error) {
        console.error("Get building error:", error);
        return res.status(404).json({
            success: false,
            message: error.message || "Building not found",
        });
    }
}
async function updateBuildingController(req, res) {
    try {
        const { id } = req.params;
        const building = await (0, building_service_1.updateBuilding)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Building updated successfully",
            data: building,
        });
    }
    catch (error) {
        console.error("Update building error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update building",
        });
    }
}
async function deleteBuildingController(req, res) {
    try {
        const { id } = req.params;
        await (0, building_service_1.deleteBuilding)(id);
        return res.status(200).json({
            success: true,
            message: "Building deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete building error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to delete building",
        });
    }
}
