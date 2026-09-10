"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionsController = getPermissionsController;
exports.createPermissionController = createPermissionController;
const permission_service_1 = require("../services/permission.service");
async function getPermissionsController(req, res) {
    try {
        const permissions = await (0, permission_service_1.getPermissions)();
        return res.status(200).json({
            success: true,
            data: permissions,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch permissions",
        });
    }
}
async function createPermissionController(req, res) {
    try {
        const permission = await (0, permission_service_1.createPermission)(req.body);
        return res.status(201).json({
            success: true,
            message: "Permission created successfully",
            data: permission,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to create permission";
        if (message === "Permission with this name already exists") {
            return res.status(409).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to create permission",
        });
    }
}
