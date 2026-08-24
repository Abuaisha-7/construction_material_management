import { Router } from "express";

import {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial
} from "../controllers/material.controller";

import {
  authenticate
} from "../middleware/auth.middleware";

import {
  requirePermission
} from "../middleware/permission.middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission("materials:read"),
  getMaterials
);

router.get(
  "/:id",
  requirePermission("materials:read"),
  getMaterialById
);

router.post(
  "/",
  requirePermission("materials:create"),
  createMaterial
);

router.patch(
  "/:id",
  requirePermission("materials:update"),
  updateMaterial
);

router.delete(
  "/:id",
  requirePermission("materials:delete"),
  deleteMaterial
);

export default router;