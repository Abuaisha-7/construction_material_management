"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const stockCount_controller_1 = require("../controllers/stockCount.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Create
router.post("/", stockCount_controller_1.createStockCountController);
// List
router.get("/", stockCount_controller_1.getStockCountsController);
// Get by ID
router.get("/:id", stockCount_controller_1.getStockCountByIdController);
// Update DRAFT
router.patch("/:id", stockCount_controller_1.updateStockCountController);
// Start
router.post("/:id/start", stockCount_controller_1.startStockCountController);
// Complete
router.post("/:id/complete", stockCount_controller_1.completeStockCountController);
// Approve
router.post("/:id/approve", stockCount_controller_1.approveStockCountController);
exports.default = router;
