import { Router } from "express";

import {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial
} from "../controllers/material.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getMaterials);
router.get("/:id", getMaterialById);
router.post("/", createMaterial);
router.patch("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

export default router;