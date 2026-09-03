"use strict";
// src/routes/notification.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/", notification_controller_1.getNotificationsController);
router.get("/:id", notification_controller_1.getNotificationByIdController);
router.patch("/:id/read", notification_controller_1.markNotificationAsReadController);
router.patch("/read-all", notification_controller_1.markAllNotificationsAsReadController);
router.delete("/:id", notification_controller_1.deleteNotificationController);
exports.default = router;
