import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

import {
  createBuildingController,
  getBuildingsController,
  getBuildingByIdController,
  updateBuildingController,
  deleteBuildingController,
} from "../controllers/building.controller";

const router = Router();

router.post("/", authenticate, createBuildingController);

router.get("/", authenticate, getBuildingsController);

router.get("/:id", authenticate, getBuildingByIdController);

router.patch("/:id", authenticate, updateBuildingController);

router.delete("/:id", authenticate, deleteBuildingController);

export default router;