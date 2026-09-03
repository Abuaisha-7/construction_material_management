"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const inspection_controller_1 = require("../controllers/inspection.controller");
const router = (0, express_1.Router)();
/**
 * ============================================================
 * Authentication
 * ============================================================
 */
router.use(auth_middleware_1.authenticate);
/**
 * ============================================================
 * GET /api/inspections
 * ============================================================
 */
router.get("/", (0, permission_middleware_1.requirePermission)("inspections:read"), inspection_controller_1.getInspectionsController);
/**
 * ============================================================
 * GET /api/inspections/:id
 * ============================================================
 */
router.get("/:id", (0, permission_middleware_1.requirePermission)("inspections:read"), inspection_controller_1.getInspectionByIdController);
/**
 * ============================================================
 * POST /api/inspections
 * ============================================================
 */
router.post("/", (0, permission_middleware_1.requirePermission)("inspections:create"), inspection_controller_1.createInspectionController);
/**
 * ============================================================
 * PATCH /api/inspections/:id
 * ============================================================
 */
router.patch("/:id", (0, permission_middleware_1.requirePermission)("inspections:update"), inspection_controller_1.updateInspectionController);
/**
 * ============================================================
 * POST /api/inspections/:id/start
 * ============================================================
 */
router.post("/:id/start", (0, permission_middleware_1.requirePermission)("inspections:update"), inspection_controller_1.startInspectionController);
/**
 * ============================================================
 * POST /api/inspections/:id/complete
 * ============================================================
 */
router.post("/:id/complete", (0, permission_middleware_1.requirePermission)("inspections:update"), inspection_controller_1.completeInspectionController);
exports.default = router;
