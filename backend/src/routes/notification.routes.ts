// src/routes/notification.routes.ts

import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";

import {
  getNotificationsController,
  getNotificationByIdController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController,
  clearAllNotificationsController,
} from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", getNotificationsController);

router.get("/:id", getNotificationByIdController);

router.patch(
  "/:id/read",
  markNotificationAsReadController
);

router.patch(
  "/read-all",
  markAllNotificationsAsReadController
);

router.delete(
  "/clear-all",
  clearAllNotificationsController
);

router.delete(
  "/",
  clearAllNotificationsController
);

router.delete(
  "/:id",
  deleteNotificationController
);

export default router;