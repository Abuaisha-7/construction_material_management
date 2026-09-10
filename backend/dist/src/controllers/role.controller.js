"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolesController = getRolesController;
exports.getRoleByIdController = getRoleByIdController;
exports.createRoleController = createRoleController;
exports.updateRoleController = updateRoleController;
exports.deleteRoleController = deleteRoleController;
const role_service_1 = require("../services/role.service");
async function getRolesController(req, res) {
    try {
        const roles = await (0, role_service_1.getRoles)();
        return res.status(200).json({
            success: true,
            data: roles,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch roles",
        });
    }
}
async function getRoleByIdController(req, res) {
    try {
        const { id } = req.params;
        const role = await (0, role_service_1.getRoleById)(id);
        return res.status(200).json({
            success: true,
            data: role,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to fetch role";
        if (message === "Role not found") {
            return res.status(404).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to fetch role",
        });
    }
}
async function createRoleController(req, res) {
    try {
        const role = await (0, role_service_1.createRole)(req.body);
        return res.status(201).json({
            success: true,
            message: "Role created successfully",
            data: role,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to create role";
        if (message === "Role with this name already exists") {
            return res.status(409).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to create role",
        });
    }
}
async function updateRoleController(req, res) {
    try {
        const { id } = req.params;
        const role = await (0, role_service_1.updateRole)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: role,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to update role";
        if (message === "Role not found") {
            return res.status(404).json({
                success: false,
                message,
            });
        }
        if (message === "Role with this name already exists") {
            return res.status(409).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to update role",
        });
    }
}
async function deleteRoleController(req, res) {
    try {
        const { id } = req.params;
        await (0, role_service_1.deleteRole)(id);
        return res.status(200).json({
            success: true,
            message: "Role deleted successfully",
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to delete role";
        if (message === "Role not found") {
            return res.status(404).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to delete role",
        });
    }
}
