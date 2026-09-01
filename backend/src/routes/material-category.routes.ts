import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/material-category.controller";

const router = Router();

router.post("/", authenticate, createCategory);

router.get("/", authenticate, getCategories);

router.get("/:id", authenticate, getCategoryById);

router.put("/:id", authenticate, updateCategory);

router.delete("/:id", authenticate, deleteCategory);

export default router;