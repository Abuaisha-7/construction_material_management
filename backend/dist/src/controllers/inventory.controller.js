"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryBalancesController = getInventoryBalancesController;
exports.getInventoryBalanceController = getInventoryBalanceController;
exports.getInventoryTransactionsController = getInventoryTransactionsController;
exports.getInventoryTransactionController = getInventoryTransactionController;
exports.createOpeningBalanceController = createOpeningBalanceController;
exports.createInventoryAdjustmentController = createInventoryAdjustmentController;
const inventory_service_1 = require("../services/inventory.service");
// ============================================================
// GET /api/inventory/balances
// ============================================================
async function getInventoryBalancesController(req, res) {
    try {
        const balances = await (0, inventory_service_1.getInventoryBalances)({
            projectId: req.query.projectId,
            materialId: req.query.materialId,
            warehouseId: req.query.warehouseId,
            storageLocationId: req.query.storageLocationId,
        });
        return res.status(200).json({
            success: true,
            data: balances,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to retrieve inventory balances",
        });
    }
}
// ============================================================
// GET /api/inventory/balances/:id
// ============================================================
async function getInventoryBalanceController(req, res) {
    try {
        const balance = await (0, inventory_service_1.getInventoryBalanceById)(req.params.id);
        return res.status(200).json({
            success: true,
            data: balance,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Inventory balance not found",
        });
    }
}
// ============================================================
// GET /api/inventory/transactions
// ============================================================
async function getInventoryTransactionsController(req, res) {
    try {
        const result = await (0, inventory_service_1.getInventoryTransactions)({
            projectId: req.query.projectId,
            materialId: req.query.materialId,
            warehouseId: req.query.warehouseId,
            storageLocationId: req.query.storageLocationId,
            transactionType: req.query.transactionType,
            referenceType: req.query.referenceType,
            referenceId: req.query.referenceId,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
        });
        return res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to retrieve inventory transactions",
        });
    }
}
// ============================================================
// GET /api/inventory/transactions/:id
// ============================================================
async function getInventoryTransactionController(req, res) {
    try {
        const transaction = await (0, inventory_service_1.getInventoryTransactionById)(req.params.id);
        return res.status(200).json({
            success: true,
            data: transaction,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Inventory transaction not found",
        });
    }
}
// ============================================================
// POST /api/inventory/opening-balance
// ============================================================
async function createOpeningBalanceController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const { projectId, materialId, warehouseId, storageLocationId, quantity, unitCost, reason, } = req.body;
        if (!projectId ||
            !materialId ||
            !warehouseId ||
            quantity === undefined ||
            unitCost === undefined) {
            return res.status(400).json({
                success: false,
                message: "projectId, materialId, warehouseId, quantity and unitCost are required",
            });
        }
        const result = await (0, inventory_service_1.createOpeningBalance)({
            projectId,
            materialId,
            warehouseId,
            storageLocationId,
            quantity,
            unitCost,
            reason,
        }, userId);
        return res.status(201).json({
            success: true,
            message: "Opening balance created successfully",
            data: result,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create opening balance",
        });
    }
}
// ============================================================
// POST /api/inventory/adjustment
// ============================================================
async function createInventoryAdjustmentController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const { projectId, materialId, warehouseId, storageLocationId, quantity, type, reason, } = req.body;
        if (!projectId ||
            !materialId ||
            !warehouseId ||
            quantity === undefined ||
            !type ||
            !reason) {
            return res.status(400).json({
                success: false,
                message: "projectId, materialId, warehouseId, quantity, type and reason are required",
            });
        }
        const result = await (0, inventory_service_1.createInventoryAdjustment)({
            projectId,
            materialId,
            warehouseId,
            storageLocationId,
            quantity,
            type,
            reason,
        }, userId);
        return res.status(201).json({
            success: true,
            message: "Inventory adjustment created successfully",
            data: result,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create inventory adjustment",
        });
    }
}
