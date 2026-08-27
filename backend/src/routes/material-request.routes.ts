import { Router } from "express";

import {
  authenticate
} from "../middleware/auth.middleware";

import {
  requirePermission
} from "../middleware/permission.middleware";

import {
  createMaterialRequestController,
  getMaterialRequestsController,
  getMaterialRequestController,
  updateMaterialRequestController,
  submitMaterialRequestController,
  startMaterialRequestReviewController,
  approveMaterialRequestController,
  rejectMaterialRequestController,
  cancelMaterialRequestController
} from "../controllers/material-request.controller";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);

// GET /api/material-requests
router.get(
  "/",
  requirePermission("material_requests:read"),
  getMaterialRequestsController
);

// GET /api/material-requests/:id
router.get(
  "/:id",
  requirePermission("material_requests:read"),
  getMaterialRequestController
);

// POST /api/material-requests
router.post(
  "/",
  requirePermission("material_requests:create"),
  createMaterialRequestController
);

// PUT /api/material-requests/:id
router.put(
  "/:id",
  requirePermission("material_requests:create"),
  updateMaterialRequestController
);

router.post(
  "/:id/submit",
  requirePermission("material_requests:create"),
  submitMaterialRequestController
);

router.post(
  "/:id/review",
  requirePermission(
    "material_requests:approve"
  ),
  requireRole(
    "PROJECT_MANAGER",
    "PROCUREMENT_MANAGER",
    "ADMIN"
  ),
  startMaterialRequestReviewController
);

router.post(
  "/:id/approve",
  requirePermission(
    "material_requests:approve"
  ),
  requireRole(
    "PROJECT_MANAGER",
    "PROCUREMENT_MANAGER",
    "ADMIN"
  ),
  approveMaterialRequestController
);

router.post(
  "/:id/reject",
  requirePermission(
    "material_requests:reject"
  ),
  requireRole(
    "PROJECT_MANAGER",
    "PROCUREMENT_MANAGER",
    "ADMIN"
  ),
  rejectMaterialRequestController
);

router.post(
  "/:id/cancel",
  requirePermission("material_requests:create"),
  cancelMaterialRequestController
);

export default router;