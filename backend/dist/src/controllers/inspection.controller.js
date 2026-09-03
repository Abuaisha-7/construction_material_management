"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInspectionController = createInspectionController;
exports.getInspectionsController = getInspectionsController;
exports.getInspectionByIdController = getInspectionByIdController;
exports.startInspectionController = startInspectionController;
exports.updateInspectionController = updateInspectionController;
exports.completeInspectionController = completeInspectionController;
const inspection_service_1 = require("../services/inspection.service");
const inspection_schema_1 = require("../schemas/inspection.schema");
/**
 * ============================================================
 * CREATE
 * POST /api/inspections
 * ============================================================
 */
async function createInspectionController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found",
            });
        }
        const data = inspection_schema_1.createInspectionSchema.parse(req.body);
        const inspection = await (0, inspection_service_1.createInspection)(data, userId);
        return res.status(201).json({
            success: true,
            message: "Material inspection created successfully",
            data: inspection,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create material inspection",
        });
    }
}
/**
 * ============================================================
 * GET ALL
 * GET /api/inspections
 * ============================================================
 */
async function getInspectionsController(req, res) {
    try {
        const result = await (0, inspection_service_1.getInspections)({
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 20,
            status: req.query.status,
            decision: req.query.decision,
            grnId: req.query.grnId,
            inspectorId: req.query.inspectorId,
        });
        return res.json({
            success: true,
            data: result.inspections,
            pagination: result.pagination,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to fetch inspections",
        });
    }
}
/**
 * ============================================================
 * GET BY ID
 * GET /api/inspections/:id
 * ============================================================
 */
async function getInspectionByIdController(req, res) {
    try {
        const inspection = await (0, inspection_service_1.getInspectionById)(req.params.id);
        return res.json({
            success: true,
            data: inspection,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Inspection not found",
        });
    }
}
/**
 * ============================================================
 * START
 * POST /api/inspections/:id/start
 * ============================================================
 */
async function startInspectionController(req, res) {
    try {
        const inspection = await (0, inspection_service_1.startInspection)(req.params.id);
        return res.json({
            success: true,
            message: "Material inspection started successfully",
            data: inspection,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to start inspection",
        });
    }
}
/**
 * ============================================================
 * UPDATE
 * PATCH /api/inspections/:id
 * ============================================================
 */
async function updateInspectionController(req, res) {
    try {
        const data = inspection_schema_1.updateInspectionSchema.parse(req.body);
        const inspection = await (0, inspection_service_1.updateInspection)(req.params.id, data);
        return res.json({
            success: true,
            message: "Material inspection updated successfully",
            data: inspection,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to update inspection",
        });
    }
}
/**
 * ============================================================
 * COMPLETE
 * POST /api/inspections/:id/complete
 * ============================================================
 */
async function completeInspectionController(req, res) {
    try {
        // ==================================================
        // 1. Get authenticated user
        // ==================================================
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found",
            });
        }
        // ==================================================
        // 2. Get inspection ID
        // ==================================================
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Inspection ID is required",
            });
        }
        // ==================================================
        // 3. Validate request body
        // ==================================================
        const data = inspection_schema_1.completeInspectionSchema.parse(req.body);
        // ==================================================
        // 4. Complete inspection
        // ==================================================
        const inspection = await (0, inspection_service_1.completeInspection)(id, userId, data);
        // ==================================================
        // 5. Return response
        // ==================================================
        return res.status(200).json({
            success: true,
            message: "Material inspection completed successfully",
            data: inspection,
        });
    }
    catch (error) {
        console.error("Complete material inspection error:", error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to complete material inspection",
        });
    }
}
