import { Router } from "express";

import {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} from "../controllers/unit.controller";

const router = Router();

router.post("/", createUnit);

router.get("/", getUnits);

router.get("/:id", getUnitById);

router.put("/:id", updateUnit);

router.delete("/:id", deleteUnit);

export default router;