import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requirePermission,
} from "../middleware/permission.middleware";

import {
  createGrnController,
  getGrnsController,
  getGrnByIdController,
  updateGrnController,
  confirmGrnController,
  rejectGrnController,
} from "../controllers/grn.controller";

const router = Router();

router.use(authenticate);

// ======================================================
// GET ALL GRNs
// ======================================================

router.get(
  "/",
  requirePermission("grn:read"),
  getGrnsController
);

// ======================================================
// GET GRN BY ID
// ======================================================

router.get(
  "/:id",
  requirePermission("grn:read"),
  getGrnByIdController
);

// ======================================================
// CREATE GRN
// ======================================================

router.post(
  "/",
  requirePermission("grn:create"),
  createGrnController
);

// ======================================================
// UPDATE GRN
// ======================================================

router.patch(
  "/:id",
  requirePermission("grn:update"),
  updateGrnController
);

// ======================================================
// CONFIRM GRN
// ======================================================

router.post(
  "/:id/confirm",
  requirePermission("grn:confirm"),
  confirmGrnController
);

// ======================================================
// REJECT GRN
// ======================================================

router.post(
  "/:id/reject",
  requirePermission("grn:reject"),
  rejectGrnController
);

export default router;