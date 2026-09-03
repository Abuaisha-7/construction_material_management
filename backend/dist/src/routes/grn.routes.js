"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const grn_controller_1 = require("../controllers/grn.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// ======================================================
// GET ALL GRNs
// ======================================================
router.get("/", (0, permission_middleware_1.requirePermission)("grn:read"), grn_controller_1.getGrnsController);
// ======================================================
// GET GRN BY ID
// ======================================================
router.get("/:id", (0, permission_middleware_1.requirePermission)("grn:read"), grn_controller_1.getGrnByIdController);
// ======================================================
// CREATE GRN
// ======================================================
router.post("/", (0, permission_middleware_1.requirePermission)("grn:create"), grn_controller_1.createGrnController);
// ======================================================
// UPDATE GRN
// ======================================================
router.patch("/:id", (0, permission_middleware_1.requirePermission)("grn:create"), grn_controller_1.updateGrnController);
// ======================================================
// CONFIRM GRN
// ======================================================
router.post("/:id/confirm", (0, permission_middleware_1.requirePermission)("grn:create"), grn_controller_1.confirmGrnController);
// ======================================================
// REJECT GRN
// ======================================================
router.post("/:id/reject", (0, permission_middleware_1.requirePermission)("grn:create"), grn_controller_1.rejectGrnController);
exports.default = router;
