import {
    NotificationType,
    Prisma,
  } from "@prisma/client";
  
  import {
    notifyProjectManager,
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

  
  export async function notifyMaterialWastageCreated(
    projectId: string,
    wastageId: string,
    wastageNumber: string,
    db: DbClient
  ) {
    return notifyProjectManager(
      projectId,
      {
        title: "Material Wastage Reported",
        message: `Material wastage ${wastageNumber} has been reported and requires review.`,
        notificationType: NotificationType.MATERIAL,
        referenceType: "MATERIAL_WASTAGE",
        referenceId: wastageId,
      },
      db
    );
  }
  
  export async function notifyMaterialWastageApproved(
    reporterId: string,
    wastageId: string,
    wastageNumber: string,
    db: DbClient
  ) {
    return notifyUser(
      reporterId,
      {
        title: "Material Wastage Approved",
        message: `Material wastage ${wastageNumber} has been approved.`,
        notificationType: NotificationType.SUCCESS,
        referenceType: "MATERIAL_WASTAGE",
        referenceId: wastageId,
      },
      db
    );
  }
  
  export async function notifyMaterialWastageRejected(
    reporterId: string,
    wastageId: string,
    wastageNumber: string,
    db: DbClient
  ) {
    return notifyUser(
      reporterId,
      {
        title: "Material Wastage Rejected",
        message: `Material wastage ${wastageNumber} has been rejected.`,
        notificationType: NotificationType.ERROR,
        referenceType: "MATERIAL_WASTAGE",
        referenceId: wastageId,
      },
      db
    );
  }
  
  export async function notifyMaterialWastagePosted(
    reporterId: string,
    wastageId: string,
    wastageNumber: string,
    db: DbClient
  ) {
    return notifyUser(
      reporterId,
      {
        title: "Material Wastage Posted",
        message: `Material wastage ${wastageNumber} has been posted to inventory successfully.`,
        notificationType: NotificationType.INVENTORY,
        referenceType: "MATERIAL_WASTAGE",
        referenceId: wastageId,
      },
      db
    );
  }