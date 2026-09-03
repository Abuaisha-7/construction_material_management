"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const warehouse_controller_1 = require("../controllers/warehouse.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
/**
 * GET /api/warehouses
 */
router.get("/", (0, permission_middleware_1.requirePermission)("warehouses:read"), warehouse_controller_1.getWarehousesController);
/**
 * GET /api/warehouses/:id
 */
router.get("/:id", (0, permission_middleware_1.requirePermission)("warehouses:read"), warehouse_controller_1.getWarehouseByIdController);
/**
 * POST /api/warehouses
 */
router.post("/", (0, permission_middleware_1.requirePermission)("warehouses:create"), warehouse_controller_1.createWarehouseController);
/**
 * PATCH /api/warehouses/:id
 */
router.patch("/:id", (0, permission_middleware_1.requirePermission)("warehouses:update"), warehouse_controller_1.updateWarehouseController);
/**
 * POST /api/warehouses/:id/deactivate
 */
router.post("/:id/deactivate", (0, permission_middleware_1.requirePermission)("warehouses:update"), warehouse_controller_1.deactivateWarehouseController);
/**
 * POST /api/warehouses/:id/activate
 */
router.post("/:id/activate", (0, permission_middleware_1.requirePermission)("warehouses:update"), warehouse_controller_1.activateWarehouseController);
exports.default = router;
