"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupplierController = createSupplierController;
exports.getSuppliersController = getSuppliersController;
exports.getSupplierByIdController = getSupplierByIdController;
exports.updateSupplierController = updateSupplierController;
exports.deleteSupplierController = deleteSupplierController;
const supplier_service_1 = require("../services/supplier.service");
const supplier_schema_1 = require("../schemas/supplier.schema");
/**
 * POST /api/suppliers
 */
async function createSupplierController(req, res) {
    try {
        const result = supplier_schema_1.createSupplierSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }
        const supplier = await (0, supplier_service_1.createSupplier)(result.data);
        return res.status(201).json({
            success: true,
            message: "Supplier created successfully",
            data: supplier,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to create supplier";
        if (message === "Supplier code already exists") {
            return res.status(409).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to create supplier",
        });
    }
}
/**
 * GET /api/suppliers
 */
async function getSuppliersController(req, res) {
    try {
        const search = typeof req.query.search === "string"
            ? req.query.search
            : undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        let isActive;
        if (req.query.isActive === "true") {
            isActive = true;
        }
        if (req.query.isActive === "false") {
            isActive = false;
        }
        const result = await (0, supplier_service_1.getSuppliers)({
            search,
            page,
            limit,
            isActive,
        });
        return res.status(200).json({
            success: true,
            data: result.suppliers,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch suppliers",
        });
    }
}
/**
 * GET /api/suppliers/:id
 */
async function getSupplierByIdController(req, res) {
    try {
        const { id } = req.params;
        const supplier = await (0, supplier_service_1.getSupplierById)(id);
        return res.status(200).json({
            success: true,
            data: supplier,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to fetch supplier";
        if (message === "Supplier not found") {
            return res.status(404).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to fetch supplier",
        });
    }
}
/**
 * PATCH /api/suppliers/:id
 */
async function updateSupplierController(req, res) {
    try {
        const { id } = req.params;
        const result = supplier_schema_1.updateSupplierSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }
        const supplier = await (0, supplier_service_1.updateSupplier)(id, result.data);
        return res.status(200).json({
            success: true,
            message: "Supplier updated successfully",
            data: supplier,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to update supplier";
        if (message === "Supplier not found") {
            return res.status(404).json({
                success: false,
                message,
            });
        }
        if (message === "Supplier code already exists") {
            return res.status(409).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to update supplier",
        });
    }
}
/**
 * DELETE /api/suppliers/:id
 */
async function deleteSupplierController(req, res) {
    try {
        const { id } = req.params;
        await (0, supplier_service_1.deleteSupplier)(id);
        return res.status(200).json({
            success: true,
            message: "Supplier deleted successfully",
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to delete supplier";
        if (message === "Supplier not found") {
            return res.status(404).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to delete supplier",
        });
    }
}
