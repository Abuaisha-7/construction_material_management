// src/routes/quarantine.routes.ts

import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requirePermission,
} from "../middleware/permission.middleware";

import {
  createQuarantineController,
  getQuarantinesController,
  getQuarantineByIdController,
  createDispositionController,
} from "../controllers/quarantine.controller";

const router = Router();

router.use(authenticate);

// ======================================================
// QUARANTINES
// ======================================================

router.get(
  "/",
  requirePermission("quarantines:read"),
  getQuarantinesController
);

router.post(
  "/",
  requirePermission("quarantines:create"),
  createQuarantineController
);

router.get(
  "/:id",
  requirePermission("quarantines:read"),
  getQuarantineByIdController
);

// ======================================================
// DISPOSITION
// ======================================================

router.post(
  "/:id/dispositions",
  requirePermission("quarantines:dispose"),
  createDispositionController
);

export default router;