import { Router } from "express";

import {
  authenticate
} from "../middleware/auth.middleware";

import {
  requirePermission
} from "../middleware/permission.middleware";

import {
  createPurchaseOrderController,
  getPurchaseOrdersController,
  getPurchaseOrderController
} from "../controllers/purchase-order.controller";

const router = Router();

router.use(authenticate);

// GET /api/purchase-orders
router.get(
  "/",
  requirePermission("purchase_orders:read"),
  getPurchaseOrdersController
);

// GET /api/purchase-orders/:id
router.get(
  "/:id",
  requirePermission("purchase_orders:read"),
  getPurchaseOrderController
);

// POST /api/purchase-orders
router.post(
  "/",
  requirePermission("purchase_orders:create"),
  createPurchaseOrderController
);

export default router;