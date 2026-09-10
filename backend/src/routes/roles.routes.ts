import { Router } from "express";

import {
  getRolesController,
  getRoleByIdController,
  createRoleController,
  updateRoleController,
  deleteRoleController,
} from "../controllers/role.controller";

import {
  createRoleSchema,
  updateRoleSchema,
} from "../schemas/role.schema";

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
  getRolesController
);

router.get(
  "/:id",
  getRoleByIdController
);

router.post(
  "/",
  validate(createRoleSchema),
  createRoleController
);

router.patch(
  "/:id",
  validate(updateRoleSchema),
  updateRoleController
);

router.delete(
  "/:id",
  deleteRoleController
);

export default router;