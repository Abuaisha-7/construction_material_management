import { Router } from "express";

import {
  createMaterialConsumptionController,
  getMaterialConsumptionsController,
  getMaterialConsumptionByIdController,
  updateMaterialConsumptionController,
  deleteMaterialConsumptionController,
} from "../controllers/materialConsumption.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  createMaterialConsumptionController
);

router.get(
  "/",
  getMaterialConsumptionsController
);

router.get(
  "/:id",
  getMaterialConsumptionByIdController
);

router.patch(
  "/:id",
  updateMaterialConsumptionController
);

router.delete(
  "/:id",
  deleteMaterialConsumptionController
);

export default router;