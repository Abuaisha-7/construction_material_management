"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const purchase_order_controller_1 = require("../controllers/purchase-order.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/purchase-orders
router.get("/", (0, permission_middleware_1.requirePermission)("purchase_orders:read"), purchase_order_controller_1.getPurchaseOrdersController);
// GET /api/purchase-orders/:id
router.get("/:id", (0, permission_middleware_1.requirePermission)("purchase_orders:read"), purchase_order_controller_1.getPurchaseOrderController);
// POST /api/purchase-orders
router.post("/", (0, permission_middleware_1.requirePermission)("purchase_orders:create"), purchase_order_controller_1.createPurchaseOrderController);
router.post("/:id/submit", (0, permission_middleware_1.requirePermission)("purchase_orders:create"), purchase_order_controller_1.submitPurchaseOrderController);
router.post("/:id/approve", (0, permission_middleware_1.requirePermission)("purchase_orders:approve"), purchase_order_controller_1.approvePurchaseOrderController);
router.post("/:id/cancel", (0, permission_middleware_1.requirePermission)("purchase_orders:create"), purchase_order_controller_1.cancelPurchaseOrderController);
router.post("/:id/close", (0, permission_middleware_1.requirePermission)("purchase_orders:create"), purchase_order_controller_1.closePurchaseOrderController);
exports.default = router;
