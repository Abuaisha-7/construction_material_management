"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRolePermission = createRolePermission;
exports.getRolePermissions = getRolePermissions;
exports.getRolePermission = getRolePermission;
exports.deleteRolePermission = deleteRolePermission;
const rolePermission_service_1 = require("../services/rolePermission.service");
async function createRolePermission(req, res) {
    try {
        const { roleId, permissionId } = req.body;
        const rolePermission = await (0, rolePermission_service_1.assignPermissionToRole)({
            roleId,
            permissionId,
        });
        return res.status(201).json({
            success: true,
            message: "Permission assigned to role successfully",
            data: rolePermission,
        });
    }
    catch (error) {
        console.error("Create role permission error:", error);
        const message = error instanceof Error
            ? error.message
            : "Failed to assign permission";
        const statusCode = message === "Role not found" ||
            message === "Permission not found" ||
            message === "Role permission assignment not found"
            ? 404
            : message === "Permission is already assigned to this role"
                ? 409
                : 500;
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}
async function getRolePermissions(req, res) {
    try {
        const rolePermissions = await (0, rolePermission_service_1.getAllRolePermissions)();
        return res.status(200).json({
            success: true,
            data: rolePermissions,
        });
    }
    catch (error) {
        console.error("Get role permissions error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve role permissions",
        });
    }
}
async function getRolePermission(req, res) {
    try {
        const { roleId, permissionId } = req.params;
        const rolePermission = await (0, rolePermission_service_1.getRolePermission)(roleId, permissionId);
        return res.status(200).json({
            success: true,
            data: rolePermission,
        });
    }
    catch (error) {
        console.error("Get role permission error:", error);
        const message = error instanceof Error
            ? error.message
            : "Failed to retrieve role permission";
        const statusCode = message === "Role permission assignment not found" ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}
async function deleteRolePermission(req, res) {
    try {
        const { roleId, permissionId } = req.params;
        await (0, rolePermission_service_1.removePermissionFromRole)(roleId, permissionId);
        return res.status(200).json({
            success: true,
            message: "Permission removed from role successfully",
        });
    }
    catch (error) {
        console.error("Delete role permission error:", error);
        const message = error instanceof Error
            ? error.message
            : "Failed to remove permission";
        const statusCode = message === "Role permission assignment not found" ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}
