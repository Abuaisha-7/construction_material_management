import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requirePermission,
} from "../middleware/permission.middleware";

import {
  createWarehouseController,
  getWarehousesController,
  getWarehouseByIdController,
  updateWarehouseController,
  deactivateWarehouseController,
  activateWarehouseController,
} from "../controllers/warehouse.controller";

const router = Router();

router.use(authenticate);

/**
 * GET /api/warehouses
 */
router.get(
  "/",
  requirePermission(
    "warehouses:read"
  ),
  getWarehousesController
);

/**
 * GET /api/warehouses/:id
 */
router.get(
  "/:id",
  requirePermission(
    "warehouses:read"
  ),
  getWarehouseByIdController
);

/**
 * POST /api/warehouses
 */
router.post(
  "/",
  requirePermission(
    "warehouses:create"
  ),
  createWarehouseController
);

/**
 * PATCH /api/warehouses/:id
 */
router.patch(
  "/:id",
  requirePermission(
    "warehouses:update"
  ),
  updateWarehouseController
);

/**
 * POST /api/warehouses/:id/deactivate
 */
router.post(
  "/:id/deactivate",
  requirePermission(
    "warehouses:update"
  ),
  deactivateWarehouseController
);

/**
 * POST /api/warehouses/:id/activate
 */
router.post(
  "/:id/activate",
  requirePermission(
    "warehouses:update"
  ),
  activateWarehouseController
);

export default router;