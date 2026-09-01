import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} from "../controllers/unit.controller";

const router = Router();

router.post("/", authenticate, createUnit);

router.get("/", authenticate, getUnits);

router.get("/:id", authenticate, getUnitById);

router.put("/:id", authenticate, updateUnit);

router.delete("/:id", authenticate, deleteUnit);

export default router;