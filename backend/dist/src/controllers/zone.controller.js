"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZoneController = createZoneController;
exports.getZonesController = getZonesController;
exports.getZoneByIdController = getZoneByIdController;
exports.updateZoneController = updateZoneController;
exports.deleteZoneController = deleteZoneController;
const zone_service_1 = require("../services/zone.service");
async function createZoneController(req, res) {
    try {
        const zone = await (0, zone_service_1.createZone)(req.body);
        return res.status(201).json({
            success: true,
            message: "Zone created successfully",
            data: zone,
        });
    }
    catch (error) {
        console.error("Create zone error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create zone",
        });
    }
}
async function getZonesController(req, res) {
    try {
        const projectId = req.query.projectId
            ? String(req.query.projectId)
            : undefined;
        const buildingId = req.query.buildingId
            ? String(req.query.buildingId)
            : undefined;
        const zones = await (0, zone_service_1.getZones)(projectId, buildingId);
        return res.status(200).json({
            success: true,
            data: zones,
        });
    }
    catch (error) {
        console.error("Get zones error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get zones",
        });
    }
}
async function getZoneByIdController(req, res) {
    try {
        const { id } = req.params;
        const zone = await (0, zone_service_1.getZoneById)(id);
        return res.status(200).json({
            success: true,
            data: zone,
        });
    }
    catch (error) {
        console.error("Get zone error:", error);
        return res.status(404).json({
            success: false,
            message: error.message || "Zone not found",
        });
    }
}
async function updateZoneController(req, res) {
    try {
        const { id } = req.params;
        const zone = await (0, zone_service_1.updateZone)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Zone updated successfully",
            data: zone,
        });
    }
    catch (error) {
        console.error("Update zone error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update zone",
        });
    }
}
async function deleteZoneController(req, res) {
    try {
        const { id } = req.params;
        await (0, zone_service_1.deleteZone)(id);
        return res.status(200).json({
            success: true,
            message: "Zone deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete zone error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to delete zone",
        });
    }
}
