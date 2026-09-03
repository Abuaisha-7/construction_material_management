"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectController = createProjectController;
exports.getProjectsController = getProjectsController;
exports.getProjectController = getProjectController;
exports.updateProjectController = updateProjectController;
exports.deleteProjectController = deleteProjectController;
const project_service_1 = require("../services/project.service");
async function createProjectController(req, res) {
    try {
        const project = await (0, project_service_1.createProject)(req.body);
        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: project
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message ===
                "PROJECT_CODE_ALREADY_EXISTS") {
            return res.status(409).json({
                success: false,
                message: "Project code already exists"
            });
        }
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create project"
        });
    }
}
async function getProjectsController(req, res) {
    try {
        const search = req.query.search
            ? String(req.query.search)
            : undefined;
        const status = req.query.status
            ? String(req.query.status)
            : undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const result = await (0, project_service_1.getProjects)({
            search,
            status,
            page,
            limit
        });
        return res.json({
            success: true,
            data: result.projects,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch projects"
        });
    }
}
async function getProjectController(req, res) {
    try {
        const project = await (0, project_service_1.getProjectById)(req.params.id);
        return res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message ===
                "PROJECT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch project"
        });
    }
}
async function updateProjectController(req, res) {
    try {
        const project = await (0, project_service_1.updateProject)(req.params.id, req.body);
        return res.json({
            success: true,
            message: "Project updated successfully",
            data: project
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message ===
                "PROJECT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update project"
        });
    }
}
async function deleteProjectController(req, res) {
    try {
        await (0, project_service_1.deactivateProject)(req.params.id);
        return res.json({
            success: true,
            message: "Project cancelled successfully"
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message ===
                "PROJECT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel project"
        });
    }
}
