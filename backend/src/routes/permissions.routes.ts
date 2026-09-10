import { Router } from "express";

import {
  getPermissionsController,
  createPermissionController,
} from "../controllers/permission.controller";

import {
  createPermissionSchema,
} from "../schemas/permission.schema";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requireRole,
} from "../middleware/role.middleware";

import {
  validate,
} from "../middleware/validation.middleware";

const router = Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get(
  "/",
  getPermissionsController
);

router.post(
  "/",
  validate(createPermissionSchema),
  createPermissionController
);

export default router;