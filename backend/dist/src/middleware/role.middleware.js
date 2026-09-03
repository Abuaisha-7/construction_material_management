"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const database_1 = require("../config/database");
function requireRole(...allowedRoles) {
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
                            role: true
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
            const userRoles = user.roles.map(item => item.role.name);
            const authorized = userRoles.some(role => allowedRoles.includes(role));
            if (!authorized) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to perform this action"
                });
            }
            next();
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Authorization failed"
            });
        }
    };
}
