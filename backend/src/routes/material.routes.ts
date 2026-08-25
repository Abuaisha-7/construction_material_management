import { Router } from "express";

import {
  createMaterialController,
  getMaterialsController,
  getMaterialController
} from "../controllers/material.controller";

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
  createMaterialSchema
} from "../schemas/material.schema";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission("materials:read"),
  getMaterialsController
);

router.get(
  "/:id",
  requirePermission("materials:read"),
  getMaterialController
);

router.post(
  "/",
  requirePermission("materials:create"),
  validate(createMaterialSchema),
  createMaterialController
);

export default router;