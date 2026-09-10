import { Router } from "express";

import {
  getUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
} from "../controllers/user.controller";

import {
  createUserSchema,
  updateUserSchema,
} from "../schemas/user.schema";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requirePermission,
} from "../middleware/permission.middleware";

import {
  validate,
} from "../middleware/validation.middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission("users:read"),
  getUsersController
);

router.get(
  "/:id",
  requirePermission("users:read"),
  getUserByIdController
);

router.post(
  "/",
  requirePermission("users:create"),
  validate(createUserSchema),
  createUserController
);

router.patch(
  "/:id",
  requirePermission("users:update"),
  validate(updateUserSchema),
  updateUserController
);

export default router;