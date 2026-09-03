import {
    NotificationType,
    Prisma,
  } from "@prisma/client";
  
  import {
    notifyUser,
    notifyUsersByRoles,
  } from "./notification.service";
  
  type DbClient =
    | Prisma.TransactionClient
    | typeof import("../config/database").prisma;
  
  /**
   * STOCK ADJUSTMENT CREATED
   */
  export async function notifyStockAdjustmentCreated(
    adjustmentId: string,
    adjustmentNumber: string,
    db: DbClient
  ) {
    return notifyUsersByRoles(
      ["STORE_KEEPER"],
      {
        title: "Stock Adjustment Requires Approval",
        message: `Stock adjustment ${adjustmentNumber} has been created and requires your approval.`,
        notificationType: NotificationType.APPROVAL,
        referenceType: "STOCK_ADJUSTMENT",
        referenceId: adjustmentId,
      },
      db
    );
  }
  
  /**
   * STOCK ADJUSTMENT APPROVED
   */
  export async function notifyStockAdjustmentApproved(
    requesterId: string,
    adjustmentId: string,
    adjustmentNumber: string,
    db: DbClient
  ) {
    return notifyUser(
      requesterId,
      {
        title: "Stock Adjustment Approved",
        message: `Stock adjustment ${adjustmentNumber} has been approved.`,
        notificationType: NotificationType.SUCCESS,
        referenceType: "STOCK_ADJUSTMENT",
        referenceId: adjustmentId,
      },
      db
    );
  }
  
  /**
   * STOCK ADJUSTMENT REJECTED
   */
  export async function notifyStockAdjustmentRejected(
    requesterId: string,
    adjustmentId: string,
    adjustmentNumber: string,
    db: DbClient
  ) {
    return notifyUser(
      requesterId,
      {
        title: "Stock Adjustment Rejected",
        message: `Stock adjustment ${adjustmentNumber} has been rejected.`,
        notificationType: NotificationType.ERROR,
        referenceType: "STOCK_ADJUSTMENT",
        referenceId: adjustmentId,
      },
      db
    );
  }
  
  /**
   * STOCK ADJUSTMENT POSTED
   */
  export async function notifyStockAdjustmentPosted(
    requesterId: string,
    adjustmentId: string,
    adjustmentNumber: string,
    db: DbClient
  ) {
    return notifyUser(
      requesterId,
      {
        title: "Stock Adjustment Posted",
        message: `Stock adjustment ${adjustmentNumber} has been posted to inventory.`,
        notificationType: NotificationType.INVENTORY,
        referenceType: "STOCK_ADJUSTMENT",
        referenceId: adjustmentId,
      },
      db
    );
  }