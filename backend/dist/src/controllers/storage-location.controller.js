"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStorageLocationController = createStorageLocationController;
exports.getStorageLocationsController = getStorageLocationsController;
exports.getStorageLocationByIdController = getStorageLocationByIdController;
exports.updateStorageLocationController = updateStorageLocationController;
exports.deactivateStorageLocationController = deactivateStorageLocationController;
exports.activateStorageLocationController = activateStorageLocationController;
const storage_location_service_1 = require("../services/storage-location.service");
const storage_location_schema_1 = require("../schemas/storage-location.schema");
/**
 * POST /api/storage-locations
 */
async function createStorageLocationController(req, res) {
    try {
        const data = storage_location_schema_1.createStorageLocationSchema.parse(req.body);
        const storageLocation = await (0, storage_location_service_1.createStorageLocation)(data);
        return res.status(201).json({
            success: true,
            message: "Storage location created successfully",
            data: storageLocation,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create storage location",
        });
    }
}
/**
 * GET /api/storage-locations
 */
async function getStorageLocationsController(req, res) {
    try {
        const query = storage_location_schema_1.storageLocationListSchema.parse(req.query);
        const result = await (0, storage_location_service_1.getStorageLocations)(query);
        return res.status(200).json({
            success: true,
            message: "Storage locations retrieved successfully",
            data: result.storageLocations,
            pagination: result.pagination,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to retrieve storage locations",
        });
    }
}
/**
 * GET /api/storage-locations/:id
 */
async function getStorageLocationByIdController(req, res) {
    try {
        const storageLocation = await (0, storage_location_service_1.getStorageLocationById)(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Storage location retrieved successfully",
            data: storageLocation,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Storage location not found",
        });
    }
}
/**
 * PATCH /api/storage-locations/:id
 */
async function updateStorageLocationController(req, res) {
    try {
        const data = storage_location_schema_1.updateStorageLocationSchema.parse(req.body);
        const storageLocation = await (0, storage_location_service_1.updateStorageLocation)(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Storage location updated successfully",
            data: storageLocation,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to update storage location",
        });
    }
}
/**
 * POST /api/storage-locations/:id/deactivate
 */
async function deactivateStorageLocationController(req, res) {
    try {
        const storageLocation = await (0, storage_location_service_1.deactivateStorageLocation)(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Storage location deactivated successfully",
            data: storageLocation,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to deactivate storage location",
        });
    }
}
/**
 * POST /api/storage-locations/:id/activate
 */
async function activateStorageLocationController(req, res) {
    try {
        const storageLocation = await (0, storage_location_service_1.activateStorageLocation)(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Storage location activated successfully",
            data: storageLocation,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to activate storage location",
        });
    }
}
