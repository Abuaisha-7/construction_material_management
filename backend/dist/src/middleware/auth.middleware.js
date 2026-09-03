"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }
    const token = header.split(" ")[1];
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = {
            id: payload.userId,
            email: payload.email
        };
        next();
    }
    catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}
