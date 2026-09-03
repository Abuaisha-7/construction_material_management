"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const materialWastage_controller_1 = require("../controllers/materialWastage.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Report wastage
router.post("/", materialWastage_controller_1.createMaterialWastageController);
// List wastage
router.get("/", materialWastage_controller_1.getMaterialWastagesController);
// Get wastage by ID
router.get("/:id", materialWastage_controller_1.getMaterialWastageByIdController);
// Update pending wastage
router.patch("/:id", materialWastage_controller_1.updateMaterialWastageController);
// Approve wastage
router.post("/:id/approve", materialWastage_controller_1.approveMaterialWastageController);
// Reject wastage
router.post("/:id/reject", materialWastage_controller_1.rejectMaterialWastageController);
// Post wastage to inventory
router.post("/:id/post", materialWastage_controller_1.postMaterialWastageController);
exports.default = router;
