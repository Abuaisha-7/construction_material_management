"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const material_issue_controller_1 = require("../controllers/material-issue.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/*
 * Material Issue
 */
router.post("/", auth_middleware_1.authenticate, material_issue_controller_1.createMaterialIssueController);
router.get("/", auth_middleware_1.authenticate, material_issue_controller_1.getMaterialIssuesController);
router.get("/:id", auth_middleware_1.authenticate, material_issue_controller_1.getMaterialIssueController);
/*
 * Workflow
 */
router.post("/:id/submit", auth_middleware_1.authenticate, material_issue_controller_1.submitMaterialIssueController);
router.post("/:id/approve", auth_middleware_1.authenticate, material_issue_controller_1.approveMaterialIssueController);
router.post("/:id/issue", auth_middleware_1.authenticate, material_issue_controller_1.issueMaterialController);
router.post("/:id/cancel", auth_middleware_1.authenticate, material_issue_controller_1.cancelMaterialIssueController);
exports.default = router;
