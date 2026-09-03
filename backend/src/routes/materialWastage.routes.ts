import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";

import {
  createMaterialWastageController,
  getMaterialWastagesController,
  getMaterialWastageByIdController,
  updateMaterialWastageController,
  approveMaterialWastageController,
  rejectMaterialWastageController,
  postMaterialWastageController,
} from "../controllers/materialWastage.controller";

const router = Router();

router.use(authenticate);

// Report wastage
router.post(
  "/",
  createMaterialWastageController
);

// List wastage
router.get(
  "/",
  getMaterialWastagesController
);

// Get wastage by ID
router.get(
  "/:id",
  getMaterialWastageByIdController
);

// Update pending wastage
router.patch(
  "/:id",
  updateMaterialWastageController
);

// Approve wastage
router.post(
  "/:id/approve",
  approveMaterialWastageController
);

// Reject wastage
router.post(
  "/:id/reject",
  rejectMaterialWastageController
);

// Post wastage to inventory
router.post(
  "/:id/post",
  postMaterialWastageController
);

export default router;
