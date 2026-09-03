import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";

import {
  createStockCountController,
  getStockCountsController,
  getStockCountByIdController,
  updateStockCountController,
  startStockCountController,
  completeStockCountController,
  approveStockCountController,
} from "../controllers/stockCount.controller";

const router = Router();

router.use(authenticate);

// Create
router.post(
  "/",
  createStockCountController
);

// List
router.get(
  "/",
  getStockCountsController
);

// Get by ID
router.get(
  "/:id",
  getStockCountByIdController
);

// Update DRAFT
router.patch(
  "/:id",
  updateStockCountController
);

// Start
router.post(
  "/:id/start",
  startStockCountController
);

// Complete
router.post(
  "/:id/complete",
  completeStockCountController
);

// Approve
router.post(
  "/:id/approve",
  approveStockCountController
);

export default router;
