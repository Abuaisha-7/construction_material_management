import { Router } from "express";

import {
  createRolePermission,
  getRolePermissions,
  getRolePermission,
  deleteRolePermission,
} from "../controllers/rolePermission.controller";

import {
  createRolePermissionSchema,
} from "../schemas/rolePermission.schema";

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

router.post(
  "/",
  validate(createRolePermissionSchema),
  createRolePermission
);

router.get(
  "/",
  getRolePermissions
);

router.get(
  "/:roleId/:permissionId",
  getRolePermission
);

router.delete(
  "/:roleId/:permissionId",
  deleteRolePermission
);

export default router;