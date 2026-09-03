"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPurchaseOrderController = createPurchaseOrderController;
exports.getPurchaseOrdersController = getPurchaseOrdersController;
exports.getPurchaseOrderController = getPurchaseOrderController;
exports.submitPurchaseOrderController = submitPurchaseOrderController;
exports.approvePurchaseOrderController = approvePurchaseOrderController;
exports.cancelPurchaseOrderController = cancelPurchaseOrderController;
exports.closePurchaseOrderController = closePurchaseOrderController;
const purchase_order_service_1 = require("../services/purchase-order.service");
const purchase_order_schema_1 = require("../schemas/purchase-order.schema");
async function createPurchaseOrderController(req, res) {
    try {
        const data = purchase_order_schema_1.createPurchaseOrderSchema.parse(req.body);
        const userId = req.user.id;
        const purchaseOrder = await (0, purchase_order_service_1.createPurchaseOrder)(data, userId);
        return res.status(201).json({
            success: true,
            message: "Purchase order created successfully",
            data: purchaseOrder
        });
    }
    catch (error) {
        console.error(error);
        if (error.name === "ZodError") {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.flatten()
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create purchase order"
        });
    }
}
async function getPurchaseOrdersController(req, res) {
    try {
        const query = purchase_order_schema_1.purchaseOrderQuerySchema.parse(req.query);
        const result = await (0, purchase_order_service_1.getPurchaseOrders)(query);
        return res.json({
            success: true,
            data: result.purchaseOrders,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }
        });
    }
    catch (error) {
        console.error(error);
        if (error.name === "ZodError") {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: error.flatten()
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to fetch purchase orders"
        });
    }
}
async function getPurchaseOrderController(req, res) {
    try {
        const purchaseOrder = await (0, purchase_order_service_1.getPurchaseOrderById)(req.params.id);
        return res.json({
            success: true,
            data: purchaseOrder
        });
    }
    catch (error) {
        console.error(error);
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Purchase order not found"
        });
    }
}
async function submitPurchaseOrderController(req, res) {
    try {
        const userId = req.user.id;
        const purchaseOrder = await (0, purchase_order_service_1.submitPurchaseOrder)(req.params.id, userId);
        return res.status(200).json({
            success: true,
            message: "Purchase order submitted for approval successfully",
            data: purchaseOrder,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to submit purchase order",
        });
    }
}
async function approvePurchaseOrderController(req, res) {
    try {
        const userId = req.user.id;
        const purchaseOrder = await (0, purchase_order_service_1.approvePurchaseOrder)(req.params.id, userId);
        return res.status(200).json({
            success: true,
            message: "Purchase order approved successfully",
            data: purchaseOrder,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to approve purchase order",
        });
    }
}
async function cancelPurchaseOrderController(req, res) {
    try {
        const userId = req.user.id;
        const { reason } = req.body;
        const purchaseOrder = await (0, purchase_order_service_1.cancelPurchaseOrder)(req.params.id, userId, reason);
        return res.status(200).json({
            success: true,
            message: "Purchase order cancelled successfully",
            data: purchaseOrder,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to cancel purchase order",
        });
    }
}
async function closePurchaseOrderController(req, res) {
    try {
        const userId = req.user.id;
        const purchaseOrder = await (0, purchase_order_service_1.closePurchaseOrder)(req.params.id, userId);
        return res.status(200).json({
            success: true,
            message: "Purchase order closed successfully",
            data: purchaseOrder,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to close purchase order",
        });
    }
}
