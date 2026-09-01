import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";

import {
  createZoneController,
  getZonesController,
  getZoneByIdController,
  updateZoneController,
  deleteZoneController,
} from "../controllers/zone.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  createZoneController
);

router.get(
  "/",
  authenticate,
  getZonesController
);

router.get(
  "/:id",
  authenticate,
  getZoneByIdController
);

router.patch(
  "/:id",
  authenticate,
  updateZoneController
);

router.delete(
  "/:id",
  authenticate,
  deleteZoneController
);

export default router;