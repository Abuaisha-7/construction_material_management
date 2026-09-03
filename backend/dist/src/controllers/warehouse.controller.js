"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWarehouseController = createWarehouseController;
exports.getWarehousesController = getWarehousesController;
exports.getWarehouseByIdController = getWarehouseByIdController;
exports.updateWarehouseController = updateWarehouseController;
exports.deactivateWarehouseController = deactivateWarehouseController;
exports.activateWarehouseController = activateWarehouseController;
const warehouse_service_1 = require("../services/warehouse.service");
const warehouse_schema_1 = require("../schemas/warehouse.schema");
/**
 * POST /api/warehouses
 */
async function createWarehouseController(req, res) {
    try {
        const data = warehouse_schema_1.createWarehouseSchema.parse(req.body);
        const warehouse = await (0, warehouse_service_1.createWarehouse)(data);
        return res.status(201).json({
            success: true,
            message: "Warehouse created successfully",
            data: warehouse,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create warehouse",
        });
    }
}
/**
 * GET /api/warehouses
 */
async function getWarehousesController(req, res) {
    try {
        const query = warehouse_schema_1.warehouseListSchema.parse(req.query);
        const result = await (0, warehouse_service_1.getWarehouses)(query);
        return res.status(200).json({
            success: true,
            message: "Warehouses retrieved successfully",
            data: result.warehouses,
            pagination: result.pagination,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to retrieve warehouses",
        });
    }
}
/**
 * GET /api/warehouses/:id
 */
async function getWarehouseByIdController(req, res) {
    try {
        const warehouse = await (0, warehouse_service_1.getWarehouseById)(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Warehouse retrieved successfully",
            data: warehouse,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Warehouse not found",
        });
    }
}
/**
 * PATCH /api/warehouses/:id
 */
async function updateWarehouseController(req, res) {
    try {
        const data = warehouse_schema_1.updateWarehouseSchema.parse(req.body);
        const warehouse = await (0, warehouse_service_1.updateWarehouse)(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Warehouse updated successfully",
            data: warehouse,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to update warehouse",
        });
    }
}
/**
 * POST /api/warehouses/:id/deactivate
 */
async function deactivateWarehouseController(req, res) {
    try {
        const warehouse = await (0, warehouse_service_1.deactivateWarehouse)(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Warehouse deactivated successfully",
            data: warehouse,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to deactivate warehouse",
        });
    }
}
/**
 * POST /api/warehouses/:id/activate
 */
async function activateWarehouseController(req, res) {
    try {
        const warehouse = await (0, warehouse_service_1.activateWarehouse)(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Warehouse activated successfully",
            data: warehouse,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to activate warehouse",
        });
    }
}
