"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStockCountController = createStockCountController;
exports.getStockCountsController = getStockCountsController;
exports.getStockCountByIdController = getStockCountByIdController;
exports.updateStockCountController = updateStockCountController;
exports.startStockCountController = startStockCountController;
exports.completeStockCountController = completeStockCountController;
exports.approveStockCountController = approveStockCountController;
const stockCount_service_1 = require("../services/stockCount.service");
async function createStockCountController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const count = await (0, stockCount_service_1.createStockCount)(userId, req.body);
        return res.status(201).json({
            success: true,
            message: "Stock count created successfully",
            data: count,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create stock count",
        });
    }
}
async function getStockCountsController(req, res) {
    try {
        const { projectId, warehouseId, status, } = req.query;
        const counts = await (0, stockCount_service_1.getStockCounts)({
            projectId: projectId,
            warehouseId: warehouseId,
            status: status,
        });
        return res.status(200).json({
            success: true,
            data: counts,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to fetch stock counts",
        });
    }
}
async function getStockCountByIdController(req, res) {
    try {
        const { id } = req.params;
        const count = await (0, stockCount_service_1.getStockCountById)(id);
        return res.status(200).json({
            success: true,
            data: count,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Stock count not found",
        });
    }
}
async function updateStockCountController(req, res) {
    try {
        const { id } = req.params;
        const count = await (0, stockCount_service_1.updateStockCount)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Stock count updated successfully",
            data: count,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to update stock count",
        });
    }
}
async function startStockCountController(req, res) {
    try {
        const { id } = req.params;
        const count = await (0, stockCount_service_1.startStockCount)(id);
        return res.status(200).json({
            success: true,
            message: "Stock count started successfully",
            data: count,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to start stock count",
        });
    }
}
async function completeStockCountController(req, res) {
    try {
        const { id } = req.params;
        const count = await (0, stockCount_service_1.completeStockCount)(id);
        return res.status(200).json({
            success: true,
            message: "Stock count completed successfully",
            data: count,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to complete stock count",
        });
    }
}
async function approveStockCountController(req, res) {
    try {
        const { id } = req.params;
        const verifierId = req.user?.id;
        if (!verifierId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const count = await (0, stockCount_service_1.approveStockCount)(id, verifierId);
        return res.status(200).json({
            success: true,
            message: "Stock count approved successfully",
            data: count,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to approve stock count",
        });
    }
}
