"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const storage_location_controller_1 = require("../controllers/storage-location.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
/**
 * GET /api/storage-locations
 */
router.get("/", (0, permission_middleware_1.requirePermission)("storage_locations:read"), storage_location_controller_1.getStorageLocationsController);
/**
 * GET /api/storage-locations/:id
 */
router.get("/:id", (0, permission_middleware_1.requirePermission)("storage_locations:read"), storage_location_controller_1.getStorageLocationByIdController);
/**
 * POST /api/storage-locations
 */
router.post("/", (0, permission_middleware_1.requirePermission)("storage_locations:create"), storage_location_controller_1.createStorageLocationController);
/**
 * PATCH /api/storage-locations/:id
 */
router.patch("/:id", (0, permission_middleware_1.requirePermission)("storage_locations:update"), storage_location_controller_1.updateStorageLocationController);
/**
 * POST /api/storage-locations/:id/deactivate
 */
router.post("/:id/deactivate", (0, permission_middleware_1.requirePermission)("storage_locations:update"), storage_location_controller_1.deactivateStorageLocationController);
/**
 * POST /api/storage-locations/:id/activate
 */
router.post("/:id/activate", (0, permission_middleware_1.requirePermission)("storage_locations:update"), storage_location_controller_1.activateStorageLocationController);
exports.default = router;
