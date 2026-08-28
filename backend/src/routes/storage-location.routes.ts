import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requirePermission,
} from "../middleware/permission.middleware";

import {
  createStorageLocationController,
  getStorageLocationsController,
  getStorageLocationByIdController,
  updateStorageLocationController,
  deactivateStorageLocationController,
  activateStorageLocationController,
} from "../controllers/storage-location.controller";

const router = Router();

router.use(authenticate);

/**
 * GET /api/storage-locations
 */
router.get(
  "/",
  requirePermission(
    "storage_locations:read"
  ),
  getStorageLocationsController
);

/**
 * GET /api/storage-locations/:id
 */
router.get(
  "/:id",
  requirePermission(
    "storage_locations:read"
  ),
  getStorageLocationByIdController
);

/**
 * POST /api/storage-locations
 */
router.post(
  "/",
  requirePermission(
    "storage_locations:create"
  ),
  createStorageLocationController
);

/**
 * PATCH /api/storage-locations/:id
 */
router.patch(
  "/:id",
  requirePermission(
    "storage_locations:update"
  ),
  updateStorageLocationController
);

/**
 * POST /api/storage-locations/:id/deactivate
 */
router.post(
  "/:id/deactivate",
  requirePermission(
    "storage_locations:update"
  ),
  deactivateStorageLocationController
);

/**
 * POST /api/storage-locations/:id/activate
 */
router.post(
  "/:id/activate",
  requirePermission(
    "storage_locations:update"
  ),
  activateStorageLocationController
);

export default router;