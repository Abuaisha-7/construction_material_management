"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const material_request_controller_1 = require("../controllers/material-request.controller");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/material-requests
router.get("/", (0, permission_middleware_1.requirePermission)("material_requests:read"), material_request_controller_1.getMaterialRequestsController);
// GET /api/material-requests/:id
router.get("/:id", (0, permission_middleware_1.requirePermission)("material_requests:read"), material_request_controller_1.getMaterialRequestController);
// POST /api/material-requests
router.post("/", (0, permission_middleware_1.requirePermission)("material_requests:create"), material_request_controller_1.createMaterialRequestController);
// PUT /api/material-requests/:id
router.put("/:id", (0, permission_middleware_1.requirePermission)("material_requests:create"), material_request_controller_1.updateMaterialRequestController);
router.post("/:id/submit", (0, permission_middleware_1.requirePermission)("material_requests:create"), material_request_controller_1.submitMaterialRequestController);
router.post("/:id/review", (0, permission_middleware_1.requirePermission)("material_requests:approve"), (0, role_middleware_1.requireRole)("PROJECT_MANAGER", "PROCUREMENT_MANAGER", "ADMIN"), material_request_controller_1.startMaterialRequestReviewController);
router.post("/:id/approve", (0, permission_middleware_1.requirePermission)("material_requests:approve"), (0, role_middleware_1.requireRole)("PROJECT_MANAGER", "PROCUREMENT_MANAGER", "ADMIN"), material_request_controller_1.approveMaterialRequestController);
router.post("/:id/reject", (0, permission_middleware_1.requirePermission)("material_requests:reject"), (0, role_middleware_1.requireRole)("PROJECT_MANAGER", "PROCUREMENT_MANAGER", "ADMIN"), material_request_controller_1.rejectMaterialRequestController);
router.post("/:id/cancel", (0, permission_middleware_1.requirePermission)("material_requests:create"), material_request_controller_1.cancelMaterialRequestController);
exports.default = router;
