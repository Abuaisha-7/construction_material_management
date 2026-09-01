import { Router } from "express";

import {
  createMaterialIssueController,
  getMaterialIssuesController,
  getMaterialIssueController,
  submitMaterialIssueController,
  approveMaterialIssueController,
  issueMaterialController,
  cancelMaterialIssueController,
} from "../controllers/material-issue.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/*
 * Material Issue
 */

router.post(
  "/",
  authenticate,
  createMaterialIssueController
);

router.get(
  "/",
  authenticate,
  getMaterialIssuesController
);

router.get(
  "/:id",
  authenticate,
  getMaterialIssueController
);

/*
 * Workflow
 */

router.post(
  "/:id/submit",
  authenticate,
  submitMaterialIssueController
);

router.post(
  "/:id/approve",
  authenticate,
  approveMaterialIssueController
);

router.post(
  "/:id/issue",
  authenticate,
  issueMaterialController
);

router.post(
  "/:id/cancel",
  authenticate,
  cancelMaterialIssueController
);

export default router;