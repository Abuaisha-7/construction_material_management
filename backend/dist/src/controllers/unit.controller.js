"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnit = createUnit;
exports.getUnits = getUnits;
exports.getUnitById = getUnitById;
exports.updateUnit = updateUnit;
exports.deleteUnit = deleteUnit;
const unit_service_1 = require("../services/unit.service");
/**
 * Create unit
 */
async function createUnit(req, res) {
    try {
        const unit = await (0, unit_service_1.createUnit)(req.body);
        return res.status(201).json({
            success: true,
            message: "Unit created successfully",
            data: unit,
        });
    }
    catch (error) {
        console.error("Create unit error:", error);
        if (error instanceof Error &&
            error.message === "UNIT_ALREADY_EXISTS") {
            return res.status(409).json({
                success: false,
                message: "Unit code or name already exists",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to create unit",
        });
    }
}
/**
 * Get all units
 */
async function getUnits(_req, res) {
    try {
        const units = await (0, unit_service_1.getUnits)();
        return res.status(200).json({
            success: true,
            data: units,
        });
    }
    catch (error) {
        console.error("Get units error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch units",
        });
    }
}
/**
 * Get unit by ID
 */
async function getUnitById(req, res) {
    try {
        const { id } = req.params;
        const unit = await (0, unit_service_1.getUnitById)(id);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: "Unit not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: unit,
        });
    }
    catch (error) {
        console.error("Get unit error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch unit",
        });
    }
}
/**
 * Update unit
 */
async function updateUnit(req, res) {
    try {
        const { id } = req.params;
        const unit = await (0, unit_service_1.updateUnit)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Unit updated successfully",
            data: unit,
        });
    }
    catch (error) {
        console.error("Update unit error:", error);
        if (error instanceof Error &&
            error.message === "UNIT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Unit not found",
            });
        }
        if (error instanceof Error &&
            error.message === "UNIT_ALREADY_EXISTS") {
            return res.status(409).json({
                success: false,
                message: "Unit code or name already exists",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to update unit",
        });
    }
}
/**
 * Delete unit
 */
async function deleteUnit(req, res) {
    try {
        const { id } = req.params;
        await (0, unit_service_1.deleteUnit)(id);
        return res.status(200).json({
            success: true,
            message: "Unit deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete unit error:", error);
        if (error instanceof Error &&
            error.message === "UNIT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Unit not found",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to delete unit",
        });
    }
}
