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
  requirePermission("grn:create"),
  updateGrnController
);

// ======================================================
// CONFIRM GRN
// ======================================================

router.post(
  "/:id/confirm",
  requirePermission("grn:create"),
  confirmGrnController
);

// ======================================================
// REJECT GRN
// ======================================================

router.post(
  "/:id/reject",
  requirePermission("grn:create"),
  rejectGrnController
);

export default router;