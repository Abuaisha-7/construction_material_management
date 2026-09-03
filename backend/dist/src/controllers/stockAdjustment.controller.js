"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.getAll = getAll;
exports.getById = getById;
exports.update = update;
exports.approve = approve;
exports.reject = reject;
exports.post = post;
const stockAdjustment_service_1 = require("../services/stockAdjustment.service");
async function create(req, res) {
    try {
        const userId = req.user?.id;
        const adjustment = await (0, stockAdjustment_service_1.createStockAdjustment)(req.body, userId);
        return res.status(201).json({
            success: true,
            message: "Stock adjustment created successfully",
            data: adjustment,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}
async function getAll(req, res) {
    try {
        const adjustments = await (0, stockAdjustment_service_1.getStockAdjustments)({
            projectId: req.query.projectId,
            warehouseId: req.query.warehouseId,
            status: req.query.status,
        });
        return res.status(200).json({
            success: true,
            data: adjustments,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
async function getById(req, res) {
    try {
        const adjustment = await (0, stockAdjustment_service_1.getStockAdjustmentById)(req.params.id);
        return res.status(200).json({
            success: true,
            data: adjustment,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
}
async function update(req, res) {
    try {
        const adjustment = await (0, stockAdjustment_service_1.updateStockAdjustment)(req.params.id, req.body);
        return res.status(200).json({
            success: true,
            message: "Stock adjustment updated successfully",
            data: adjustment,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}
async function approve(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const adjustment = await (0, stockAdjustment_service_1.approveStockAdjustment)(req.params.id, userId);
        return res.status(200).json({
            success: true,
            message: "Stock adjustment approved successfully",
            data: adjustment,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}
async function reject(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const adjustment = await (0, stockAdjustment_service_1.rejectStockAdjustment)(req.params.id, userId);
        return res.status(200).json({
            success: true,
            message: "Stock adjustment rejected successfully",
            data: adjustment,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}
async function post(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const adjustment = await (0, stockAdjustment_service_1.postStockAdjustment)(req.params.id, userId);
        return res.status(200).json({
            success: true,
            message: "Stock adjustment posted successfully",
            data: adjustment,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}
