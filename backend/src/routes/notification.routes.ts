import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

import {
  createNotificationController,
  getNotificationsController,
  getNotificationByIdController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController
} from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

router.post("/", createNotificationController);

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
  "/:id",
  deleteNotificationController
);

export default router;