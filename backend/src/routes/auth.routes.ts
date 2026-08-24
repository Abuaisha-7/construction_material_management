import { Router } from "express";

import {
  login,
  register
} from "../controllers/auth.controller";

import {
  loginSchema,
  registerSchema
} from "../schemas/auth.schema";

import {
  validate
} from "../middleware/validation.middleware";

const router = Router();

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.post(
  "/register",
  validate(registerSchema),
  register
);

export default router;