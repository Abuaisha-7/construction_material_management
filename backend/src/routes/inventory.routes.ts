import { Router } from "express";

import {
  getInventoryBalancesController,
  getInventoryBalanceController,
  getInventoryTransactionsController,
  getInventoryTransactionController,
  createOpeningBalanceController,
  createInventoryAdjustmentController,
} from "../controllers/inventory.controller";
import { authenticate } from "../middleware/auth.middleware";

// Use your existing authentication middleware here.
// Example:
// import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// ============================================================
// INVENTORY BALANCES
// ============================================================

router.get(
  "/balances",
  getInventoryBalancesController
);

router.get(
  "/balances/:id",
  getInventoryBalanceController
);

// ============================================================
// INVENTORY TRANSACTIONS
// ============================================================

router.get(
  "/transactions",
  getInventoryTransactionsController
);

router.get(
  "/transactions/:id",
  getInventoryTransactionController
);

// ============================================================
// OPENING BALANCE
// ============================================================

router.post(
  "/opening-balance",
  authenticate,
  createOpeningBalanceController
);

// ============================================================
// INVENTORY ADJUSTMENT
// ============================================================

router.post(
  "/adjustment",
  authenticate,
  createInventoryAdjustmentController
);

export default router;
