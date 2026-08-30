import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requirePermission,
} from "../middleware/permission.middleware";

import {
  createInspectionController,
  getInspectionsController,
  getInspectionByIdController,
  startInspectionController,
  updateInspectionController,
  completeInspectionController,
} from "../controllers/inspection.controller";


const router = Router();


/**
 * ============================================================
 * Authentication
 * ============================================================
 */

router.use(authenticate);


/**
 * ============================================================
 * GET /api/inspections
 * ============================================================
 */

router.get(
  "/",
  requirePermission("inspections:read"),
  getInspectionsController
);


/**
 * ============================================================
 * GET /api/inspections/:id
 * ============================================================
 */

router.get(
  "/:id",
  requirePermission("inspections:read"),
  getInspectionByIdController
);


/**
 * ============================================================
 * POST /api/inspections
 * ============================================================
 */

router.post(
  "/",
  requirePermission("inspections:create"),
  createInspectionController
);


/**
 * ============================================================
 * PATCH /api/inspections/:id
 * ============================================================
 */

router.patch(
  "/:id",
  requirePermission("inspections:update"),
  updateInspectionController
);


/**
 * ============================================================
 * POST /api/inspections/:id/start
 * ============================================================
 */

router.post(
  "/:id/start",
  requirePermission("inspections:update"),
  startInspectionController
);


/**
 * ============================================================
 * POST /api/inspections/:id/complete
 * ============================================================
 */

router.post(
  "/:id/complete",
  requirePermission("inspections:update"),
  completeInspectionController
);


export default router;
