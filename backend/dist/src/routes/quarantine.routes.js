"use strict";
// src/routes/quarantine.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const quarantine_controller_1 = require("../controllers/quarantine.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// ======================================================
// QUARANTINES
// ======================================================
router.get("/", (0, permission_middleware_1.requirePermission)("quarantines:read"), quarantine_controller_1.getQuarantinesController);
router.post("/", (0, permission_middleware_1.requirePermission)("quarantines:create"), quarantine_controller_1.createQuarantineController);
router.get("/:id", (0, permission_middleware_1.requirePermission)("quarantines:read"), quarantine_controller_1.getQuarantineByIdController);
// ======================================================
// DISPOSITION
// ======================================================
router.post("/:id/dispositions", (0, permission_middleware_1.requirePermission)("quarantines:dispose"), quarantine_controller_1.createDispositionController);
exports.default = router;
