"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const materialReturn_controller_1 = require("../controllers/materialReturn.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Create return
router.post("/", materialReturn_controller_1.createMaterialReturnController);
// List returns
router.get("/", materialReturn_controller_1.getMaterialReturnsController);
// Get one return
router.get("/:id", materialReturn_controller_1.getMaterialReturnByIdController);
// Update pending return
router.patch("/:id", materialReturn_controller_1.updateMaterialReturnController);
// Receive/post return to inventory
router.post("/:id/receive", materialReturn_controller_1.receiveMaterialReturnController);
exports.default = router;
