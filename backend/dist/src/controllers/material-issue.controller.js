"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialIssueController = createMaterialIssueController;
exports.getMaterialIssuesController = getMaterialIssuesController;
exports.getMaterialIssueController = getMaterialIssueController;
exports.submitMaterialIssueController = submitMaterialIssueController;
exports.approveMaterialIssueController = approveMaterialIssueController;
exports.issueMaterialController = issueMaterialController;
exports.cancelMaterialIssueController = cancelMaterialIssueController;
const material_issue_service_1 = require("../services/material-issue.service");
async function createMaterialIssueController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const issue = await (0, material_issue_service_1.createMaterialIssue)(req.body, userId);
        return res.status(201).json({
            success: true,
            message: "Material issue created successfully",
            data: issue,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create material issue",
        });
    }
}
async function getMaterialIssuesController(req, res) {
    try {
        const result = await (0, material_issue_service_1.getMaterialIssues)({
            projectId: req.query.projectId,
            warehouseId: req.query.warehouseId,
            status: req.query.status,
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 20,
        });
        return res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to get material issues",
        });
    }
}
async function getMaterialIssueController(req, res) {
    try {
        const issue = await (0, material_issue_service_1.getMaterialIssueById)(req.params.id);
        return res.json({
            success: true,
            data: issue,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Material issue not found",
        });
    }
}
async function submitMaterialIssueController(req, res) {
    try {
        const issue = await (0, material_issue_service_1.submitMaterialIssue)(req.params.id);
        return res.json({
            success: true,
            message: "Material issue submitted for approval",
            data: issue,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to submit material issue",
        });
    }
}
async function approveMaterialIssueController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const issue = await (0, material_issue_service_1.approveMaterialIssue)(req.params.id, userId);
        return res.json({
            success: true,
            message: "Material issue approved successfully",
            data: issue,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to approve material issue",
        });
    }
}
async function issueMaterialController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const issue = await (0, material_issue_service_1.issueMaterial)(req.params.id, userId);
        return res.json({
            success: true,
            message: "Material issued successfully",
            data: issue,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to issue material",
        });
    }
}
async function cancelMaterialIssueController(req, res) {
    try {
        const issue = await (0, material_issue_service_1.cancelMaterialIssue)(req.params.id);
        return res.json({
            success: true,
            message: "Material issue cancelled successfully",
            data: issue,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to cancel material issue",
        });
    }
}
