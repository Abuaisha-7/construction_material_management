import { Router } from "express";

import {
  createUserRole,
  getUserRoles,
  getUserRolesForUser,
  getUserRole,
  deleteUserRole,
} from "../controllers/userRole.controller";

import { createUserRoleSchema } from "../schemas/userRole.schema";

import { validate } from "../middleware/validation.middleware";

const router = Router();

router.post(
  "/",
  validate(createUserRoleSchema),
  createUserRole
);

router.get(
  "/",
  getUserRoles
);

router.get(
  "/user/:userId",
  getUserRolesForUser
);

router.get(
  "/:userId/:roleId",
  getUserRole
);

router.delete(
  "/:userId/:roleId",
  deleteUserRole
);

export default router;