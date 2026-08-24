import { prisma } from "../config/database";

interface InventoryTransactionInput {
  projectId: string;
  materialId: string;
  warehouseId: string;
  storageLocationId?: string;
  transactionType:
    | "RECEIPT"
    | "ISSUE"
    | "RETURN"
    | "DAMAGE"
    | "LOSS"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT";
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  performedBy?: string;
  reason?: string;
}

export async function createInventoryTransaction(
  data: InventoryTransactionInput
) {
  return prisma.inventoryTransaction.create({
    data: {
      transactionNumber: `INV-${Date.now()}`,
      projectId: data.projectId,
      materialId: data.materialId,
      warehouseId: data.warehouseId,
      storageLocationId: data.storageLocationId,
      transactionType: data.transactionType,
      quantity: data.quantity,
      unitCost: data.unitCost,
      totalValue: data.unitCost
        ? data.quantity * data.unitCost
        : undefined,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      performedBy: data.performedBy,
      reason: data.reason
    }
  });
}