"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const supplier_controller_1 = require("../controllers/supplier.controller");
const router = (0, express_1.Router)();
// All supplier routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * GET /api/suppliers
 * Get all suppliers
 */
router.get("/", (0, permission_middleware_1.requirePermission)("suppliers:read"), supplier_controller_1.getSuppliersController);
/**
 * POST /api/suppliers
 * Create supplier
 */
router.post("/", (0, permission_middleware_1.requirePermission)("suppliers:create"), supplier_controller_1.createSupplierController);
/**
 * GET /api/suppliers/:id
 * Get supplier by ID
 */
router.get("/:id", (0, permission_middleware_1.requirePermission)("suppliers:read"), supplier_controller_1.getSupplierByIdController);
/**
 * PATCH /api/suppliers/:id
 * Update supplier
 */
router.patch("/:id", (0, permission_middleware_1.requirePermission)("suppliers:update"), supplier_controller_1.updateSupplierController);
/**
 * DELETE /api/suppliers/:id
 * Delete supplier
 */
router.delete("/:id", (0, permission_middleware_1.requirePermission)("suppliers:delete"), supplier_controller_1.deleteSupplierController);
exports.default = router;
