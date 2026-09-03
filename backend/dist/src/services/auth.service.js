"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
const database_1 = require("../config/database");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
async function authenticateUser(email, password) {
    const user = await database_1.prisma.user.findUnique({
        where: {
            email
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
        throw new Error("INVALID_CREDENTIALS");
    }
    if (user.status !== "ACTIVE") {
        throw new Error("ACCOUNT_INACTIVE");
    }
    const passwordValid = await (0, password_1.comparePassword)(password, user.passwordHash);
    if (!passwordValid) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const roles = user.roles.map(userRole => userRole.role.name);
    const permissions = [
        ...new Set(user.roles.flatMap(userRole => userRole.role.permissions.map(rolePermission => rolePermission.permission.name)))
    ];
    const token = (0, jwt_1.generateToken)({
        userId: user.id,
        email: user.email
    });
    return {
        token,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            roles,
            permissions
        }
    };
}
