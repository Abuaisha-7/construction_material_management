import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requirePermission,
} from "../middleware/permission.middleware";

import {
  createSupplierController,
  getSuppliersController,
  getSupplierByIdController,
  updateSupplierController,
  deleteSupplierController,
} from "../controllers/supplier.controller";

const router = Router();

// All supplier routes require authentication
router.use(authenticate);

/**
 * GET /api/suppliers
 * Get all suppliers
 */
router.get(
  "/",
  requirePermission("suppliers:read"),
  getSuppliersController
);

/**
 * POST /api/suppliers
 * Create supplier
 */
router.post(
  "/",
  requirePermission("suppliers:create"),
  createSupplierController
);

/**
 * GET /api/suppliers/:id
 * Get supplier by ID
 */
router.get(
  "/:id",
  requirePermission("suppliers:read"),
  getSupplierByIdController
);

/**
 * PATCH /api/suppliers/:id
 * Update supplier
 */
router.patch(
  "/:id",
  requirePermission("suppliers:update"),
  updateSupplierController
);

/**
 * DELETE /api/suppliers/:id
 * Delete supplier
 */
router.delete(
  "/:id",
  requirePermission("suppliers:delete"),
  deleteSupplierController
);

export default router;
