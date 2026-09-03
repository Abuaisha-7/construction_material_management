import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

import {
  createMaterialReturnController,
  getMaterialReturnsController,
  getMaterialReturnByIdController,
  updateMaterialReturnController,
  receiveMaterialReturnController,
} from "../controllers/materialReturn.controller";

const router = Router();

router.use(authenticate);

// Create return
router.post(
  "/",
  createMaterialReturnController
);

// List returns
router.get(
  "/",
  getMaterialReturnsController
);

// Get one return
router.get(
  "/:id",
  getMaterialReturnByIdController
);

// Update pending return
router.patch(
  "/:id",
  updateMaterialReturnController
);

// Receive/post return to inventory
router.post(
  "/:id/receive",
  receiveMaterialReturnController
);

export default router;
