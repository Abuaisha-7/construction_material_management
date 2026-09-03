"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyStockAdjustmentCreated = notifyStockAdjustmentCreated;
exports.notifyStockAdjustmentApproved = notifyStockAdjustmentApproved;
exports.notifyStockAdjustmentRejected = notifyStockAdjustmentRejected;
exports.notifyStockAdjustmentPosted = notifyStockAdjustmentPosted;
const client_1 = require("@prisma/client");
const notification_service_1 = require("./notification.service");
/**
 * STOCK ADJUSTMENT CREATED
 */
async function notifyStockAdjustmentCreated(adjustmentId, adjustmentNumber, db) {
    return (0, notification_service_1.notifyUsersByRoles)(["STORE_KEEPER"], {
        title: "Stock Adjustment Requires Approval",
        message: `Stock adjustment ${adjustmentNumber} has been created and requires your approval.`,
        notificationType: client_1.NotificationType.APPROVAL,
        referenceType: "STOCK_ADJUSTMENT",
        referenceId: adjustmentId,
    }, db);
}
/**
 * STOCK ADJUSTMENT APPROVED
 */
async function notifyStockAdjustmentApproved(requesterId, adjustmentId, adjustmentNumber, db) {
    return (0, notification_service_1.notifyUser)(requesterId, {
        title: "Stock Adjustment Approved",
        message: `Stock adjustment ${adjustmentNumber} has been approved.`,
        notificationType: client_1.NotificationType.SUCCESS,
        referenceType: "STOCK_ADJUSTMENT",
        referenceId: adjustmentId,
    }, db);
}
/**
 * STOCK ADJUSTMENT REJECTED
 */
async function notifyStockAdjustmentRejected(requesterId, adjustmentId, adjustmentNumber, db) {
    return (0, notification_service_1.notifyUser)(requesterId, {
        title: "Stock Adjustment Rejected",
        message: `Stock adjustment ${adjustmentNumber} has been rejected.`,
        notificationType: client_1.NotificationType.ERROR,
        referenceType: "STOCK_ADJUSTMENT",
        referenceId: adjustmentId,
    }, db);
}
/**
 * STOCK ADJUSTMENT POSTED
 */
async function notifyStockAdjustmentPosted(requesterId, adjustmentId, adjustmentNumber, db) {
    return (0, notification_service_1.notifyUser)(requesterId, {
        title: "Stock Adjustment Posted",
        message: `Stock adjustment ${adjustmentNumber} has been posted to inventory.`,
        notificationType: client_1.NotificationType.INVENTORY,
        referenceType: "STOCK_ADJUSTMENT",
        referenceId: adjustmentId,
    }, db);
}
