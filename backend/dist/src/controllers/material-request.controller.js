"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialRequestController = createMaterialRequestController;
exports.getMaterialRequestsController = getMaterialRequestsController;
exports.getMaterialRequestController = getMaterialRequestController;
exports.updateMaterialRequestController = updateMaterialRequestController;
exports.submitMaterialRequestController = submitMaterialRequestController;
exports.startMaterialRequestReviewController = startMaterialRequestReviewController;
exports.approveMaterialRequestController = approveMaterialRequestController;
exports.rejectMaterialRequestController = rejectMaterialRequestController;
exports.cancelMaterialRequestController = cancelMaterialRequestController;
const material_request_service_1 = require("../services/material-request.service");
const material_request_schema_1 = require("../schemas/material-request.schema");
async function createMaterialRequestController(req, res) {
    try {
        const result = material_request_schema_1.createMaterialRequestSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten()
            });
        }
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const request = await (0, material_request_service_1.createMaterialRequest)(userId, result.data);
        return res.status(201).json({
            success: true,
            message: "Material request created successfully",
            data: request
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create material request"
        });
    }
}
async function getMaterialRequestsController(req, res) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const search = req.query.search;
        const status = req.query.status;
        const projectId = req.query.projectId;
        const result = await (0, material_request_service_1.getMaterialRequests)(page, limit, search, status, projectId);
        return res.json({
            success: true,
            data: result.requests,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch material requests"
        });
    }
}
async function getMaterialRequestController(req, res) {
    try {
        const request = await (0, material_request_service_1.getMaterialRequestById)(req.params.id);
        return res.json({
            success: true,
            data: request
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Material request not found"
        });
    }
}
async function updateMaterialRequestController(req, res) {
    try {
        const result = material_request_schema_1.updateMaterialRequestSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten()
            });
        }
        const request = await (0, material_request_service_1.updateMaterialRequest)(req.params.id, result.data);
        return res.json({
            success: true,
            message: "Material request updated successfully",
            data: request
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to update material request"
        });
    }
}
async function submitMaterialRequestController(req, res) {
    try {
        const request = await (0, material_request_service_1.submitMaterialRequest)(req.params.id);
        return res.json({
            success: true,
            message: "Material request submitted for approval",
            data: request
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to submit material request"
        });
    }
}
async function startMaterialRequestReviewController(req, res) {
    try {
        const request = await (0, material_request_service_1.startMaterialRequestReview)(req.params.id);
        return res.json({
            success: true,
            message: "Material request moved to UNDER_REVIEW",
            data: request
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to start review"
        });
    }
}
async function approveMaterialRequestController(req, res) {
    try {
        const { id } = req.params;
        const approverId = req.user?.id;
        if (!approverId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user ID is missing",
            });
        }
        const { comments } = req.body;
        const request = await (0, material_request_service_1.approveMaterialRequest)(id, approverId, comments);
        return res.status(200).json({
            success: true,
            message: "Material request approved successfully",
            data: request,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to approve material request",
        });
    }
}
async function rejectMaterialRequestController(req, res) {
    try {
        const result = material_request_schema_1.rejectMaterialRequestSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten()
            });
        }
        const request = await (0, material_request_service_1.rejectMaterialRequest)(req.params.id, result.data.reason);
        return res.json({
            success: true,
            message: "Material request rejected",
            data: request
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to reject material request"
        });
    }
}
async function cancelMaterialRequestController(req, res) {
    try {
        const request = await (0, material_request_service_1.cancelMaterialRequest)(req.params.id);
        return res.json({
            success: true,
            message: "Material request cancelled successfully",
            data: request
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to cancel material request"
        });
    }
}
