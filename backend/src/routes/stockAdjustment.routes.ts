import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

import {
  create,
  getAll,
  getById,
  update,
  approve,
  reject,
  post,
} from "../controllers/stockAdjustment.controller";

const router = Router();

router.use(authenticate);

router.post("/", create);

router.get("/", getAll);

router.get("/:id", getById);

router.patch("/:id", update);

router.post("/:id/approve", approve);

router.post("/:id/reject", reject);

router.post("/:id/post", post);

export default router;