"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const database_1 = require("../config/database");
function requirePermission(permissionName) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }
            const user = await database_1.prisma.user.findUnique({
                where: {
                    id: req.user.id
                },
                include: {
                    roles: {
                        include: {
                            role: {
                                include: {
                                    permissions: {
                                        include: {
                                            permission: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }
            const permissions = user.roles.flatMap(userRole => userRole.role.permissions.map(item => item.permission.name));
            if (!permissions.includes(permissionName)) {
                return res.status(403).json({
                    success: false,
                    message: `Missing permission: ${permissionName}`
                });
            }
            next();
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Permission check failed"
            });
        }
    };
}
