import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";

import {
  createActivityController,
  getActivitiesController,
  getActivityByIdController,
  updateActivityController,
  deleteActivityController,
} from "../controllers/activity.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  createActivityController
);

router.get(
  "/",
  authenticate,
  getActivitiesController
);

router.get(
  "/:id",
  authenticate,
  getActivityByIdController
);

router.patch(
  "/:id",
  authenticate,
  updateActivityController
);

router.delete(
  "/:id",
  authenticate,
  deleteActivityController
);

export default router;