"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
// Use your existing authentication middleware here.
// Example:
// import { authenticate } from "../middlewares/auth.middleware";
const router = (0, express_1.Router)();
// ============================================================
// INVENTORY BALANCES
// ============================================================
router.get("/balances", inventory_controller_1.getInventoryBalancesController);
router.get("/balances/:id", inventory_controller_1.getInventoryBalanceController);
// ============================================================
// INVENTORY TRANSACTIONS
// ============================================================
router.get("/transactions", inventory_controller_1.getInventoryTransactionsController);
router.get("/transactions/:id", inventory_controller_1.getInventoryTransactionController);
// ============================================================
// OPENING BALANCE
// ============================================================
router.post("/opening-balance", auth_middleware_1.authenticate, inventory_controller_1.createOpeningBalanceController);
// ============================================================
// INVENTORY ADJUSTMENT
// ============================================================
router.post("/adjustment", auth_middleware_1.authenticate, inventory_controller_1.createInventoryAdjustmentController);
exports.default = router;
