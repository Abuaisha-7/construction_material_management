import { Router } from "express";

import {
  createProjectController,
  getProjectsController,
  getProjectController,
  updateProjectController,
  deleteProjectController
} from "../controllers/project.controller";

import {
  authenticate
} from "../middleware/auth.middleware";

import {
  requirePermission
} from "../middleware/permission.middleware";

import {
  validate
} from "../middleware/validation.middleware";

import {
  createProjectSchema,
  updateProjectSchema
} from "../schemas/project.schema";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission("projects:read"),
  getProjectsController
);

router.get(
  "/:id",
  requirePermission("projects:read"),
  getProjectController
);

router.post(
  "/",
  requirePermission("projects:create"),
  validate(createProjectSchema),
  createProjectController
);

router.patch(
  "/:id",
  requirePermission("projects:update"),
  validate(updateProjectSchema),
  updateProjectController
);

router.delete(
  "/:id",
  requirePermission("projects:delete"),
  deleteProjectController
);

export default router;