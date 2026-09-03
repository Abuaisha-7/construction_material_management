import {
    Prisma,
    StockAdjustmentStatus,
    InventoryTransactionType,
  } from "@prisma/client";

  import {prisma} from "../config/database";

  import {
    notifyStockAdjustmentCreated,
    notifyStockAdjustmentApproved,
    notifyStockAdjustmentRejected,
    notifyStockAdjustmentPosted,
  } from "./notification.events";
  
  interface StockAdjustmentItemInput {
    materialId: string;
    storageLocationId?: string;
    systemQuantity: number;
    physicalQuantity: number;
    varianceQuantity: number;
    reason?: string;
  }
  
  interface CreateStockAdjustmentInput {
    projectId: string;
    warehouseId: string;
    stockCountId?: string;
    adjustmentDate: string;
    reason: string;
    items: StockAdjustmentItemInput[];
  }
  
  interface UpdateStockAdjustmentInput {
    adjustmentDate?: string;
    reason?: string;
    items?: StockAdjustmentItemInput[];
  }
  
  function generateAdjustmentNumber(): string {
    const date = new Date();
  
    const year = date.getFullYear();
  
    const random = Math.floor(100000 + Math.random() * 900000);
  
    return `SA-${year}-${random}`;
  }
  
  function toDecimal(value: number | string | Prisma.Decimal): Prisma.Decimal {
    return new Prisma.Decimal(value);
  }
  
  function calculateVariance(
    systemQuantity: Prisma.Decimal,
    physicalQuantity: Prisma.Decimal
  ): Prisma.Decimal {
    return physicalQuantity.minus(systemQuantity);
  }
  
  export async function createStockAdjustment(
    data: CreateStockAdjustmentInput,
    userId?: string
  ) {
    if (!data.items || data.items.length === 0) {
      throw new Error("At least one adjustment item is required");
    }
  
    const project = await prisma.project.findUnique({
      where: {
        id: data.projectId,
      },
    });
  
    if (!project) {
      throw new Error("Project not found");
    }
  
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: data.warehouseId,
        projectId: data.projectId,
      },
    });
  
    if (!warehouse) {
      throw new Error("Warehouse not found for this project");
    }
  
    if (data.stockCountId) {
      const stockCount = await prisma.stockCount.findFirst({
        where: {
          id: data.stockCountId,
          projectId: data.projectId,
        },
      });
  
      if (!stockCount) {
        throw new Error("Stock count not found for this project");
      }
  
      if (
        stockCount.status !== "COMPLETED" &&
        stockCount.status !== "APPROVED"
      ) {
        throw new Error(
          "Stock count must be COMPLETED or APPROVED before creating an adjustment"
        );
      }
  
      if (
        stockCount.warehouseId &&
        stockCount.warehouseId !== data.warehouseId
      ) {
        throw new Error("Stock count belongs to a different warehouse");
      }
    }
  
    const duplicateCheck = new Set<string>();
  
    for (const item of data.items) {
      const key = `${item.materialId}:${item.storageLocationId ?? "NULL"}`;
  
      if (duplicateCheck.has(key)) {
        throw new Error(
          `Duplicate material/location combination: ${item.materialId}`
        );
      }
  
      duplicateCheck.add(key);
  
      const material = await prisma.material.findUnique({
        where: {
          id: item.materialId,
        },
      });
  
      if (!material) {
        throw new Error(`Material not found: ${item.materialId}`);
      }
  
      if (item.storageLocationId) {
        const storageLocation = await prisma.storageLocation.findFirst({
          where: {
            id: item.storageLocationId,
            warehouseId: data.warehouseId,
          },
        });
  
        if (!storageLocation) {
          throw new Error(
            `Storage location ${item.storageLocationId} does not belong to this warehouse`
          );
        }
      }
  
      const systemQuantity = toDecimal(item.systemQuantity);
      const physicalQuantity = toDecimal(item.physicalQuantity);
      const varianceQuantity = toDecimal(item.varianceQuantity);
  
      const calculatedVariance = calculateVariance(
        systemQuantity,
        physicalQuantity
      );
  
      if (!calculatedVariance.equals(varianceQuantity)) {
        throw new Error(
          `Invalid variance for material ${item.materialId}. ` +
            `Expected ${calculatedVariance.toString()}, ` +
            `received ${varianceQuantity.toString()}`
        );
      }
  
      if (varianceQuantity.equals(0)) {
        throw new Error(
          `Variance cannot be zero for material ${item.materialId}`
        );
      }
  
      if (systemQuantity.lessThan(0) || physicalQuantity.lessThan(0)) {
        throw new Error(
          `Quantities cannot be negative for material ${item.materialId}`
        );
      }
    }
  
    let adjustmentNumber = generateAdjustmentNumber();
  
    while (
      await prisma.stockAdjustment.findUnique({
        where: {
          adjustmentNumber,
        },
      })
    ) {
      adjustmentNumber = generateAdjustmentNumber();
    }
  
  return prisma.$transaction(async (tx) => {
  const adjustment = await tx.stockAdjustment.create({
    data: {
      adjustmentNumber,
      projectId: data.projectId,
      warehouseId: data.warehouseId,
      stockCountId: data.stockCountId,
      requestedBy: userId,
      adjustmentDate: new Date(data.adjustmentDate),
      status: StockAdjustmentStatus.PENDING,
      reason: data.reason,
      items: {
        create: data.items.map((item) => ({
          materialId: item.materialId,
          storageLocationId: item.storageLocationId,
          systemQuantity: toDecimal(item.systemQuantity),
          physicalQuantity: toDecimal(item.physicalQuantity),
          varianceQuantity: toDecimal(item.varianceQuantity),
          reason: item.reason,
        })),
      },
    },
    include: {
      items: true,
      project: true,
      warehouse: true,
      requester: true,
    },
  });

  await notifyStockAdjustmentCreated(
    adjustment.id,
    adjustment.adjustmentNumber,
    tx
  );

  return adjustment;
});
  }

  export async function getStockAdjustments(filters?: {
    projectId?: string;
    warehouseId?: string;
    status?: StockAdjustmentStatus;
  }) {
    return prisma.stockAdjustment.findMany({
      where: {
        projectId: filters?.projectId,
        warehouseId: filters?.warehouseId,
        status: filters?.status,
      },
      include: {
        items: {
          include: {
            material: true,
          },
        },
        project: true,
        warehouse: true,
        requester: true,
        approver: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  export async function getStockAdjustmentById(id: string) {
    const adjustment = await prisma.stockAdjustment.findUnique({
      where: {
        id,
      },
      include: {
        items: {
          include: {
            material: true,
          },
        },
        project: true,
        warehouse: true,
        requester: true,
        approver: true,
      },
    });
  
    if (!adjustment) {
      throw new Error("Stock adjustment not found");
    }
  
    return adjustment;
  }

  export async function updateStockAdjustment(
  id: string,
  data: UpdateStockAdjustmentInput
) {
  const adjustment = await prisma.stockAdjustment.findUnique({
    where: {
      id,
    },
  });

  if (!adjustment) {
    throw new Error("Stock adjustment not found");
  }

  if (adjustment.status !== StockAdjustmentStatus.PENDING) {
    throw new Error(
      "Only PENDING stock adjustments can be updated"
    );
  }

  if (data.items) {
    if (data.items.length === 0) {
      throw new Error("At least one adjustment item is required");
    }

    const duplicateCheck = new Set<string>();

    for (const item of data.items) {
      const key = `${item.materialId}:${item.storageLocationId ?? "NULL"}`;

      if (duplicateCheck.has(key)) {
        throw new Error(
          `Duplicate material/location combination: ${item.materialId}`
        );
      }

      duplicateCheck.add(key);

      const calculatedVariance = new Prisma.Decimal(
        item.physicalQuantity
      ).minus(new Prisma.Decimal(item.systemQuantity));

      if (
        !calculatedVariance.equals(
          new Prisma.Decimal(item.varianceQuantity)
        )
      ) {
        throw new Error(
          `Invalid variance for material ${item.materialId}`
        );
      }

      if (calculatedVariance.equals(0)) {
        throw new Error(
          `Variance cannot be zero for material ${item.materialId}`
        );
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.stockAdjustmentItem.deleteMany({
        where: {
          adjustmentId: id,
        },
      });
    }

    return tx.stockAdjustment.update({
      where: {
        id,
      },

      data: {
        adjustmentDate: data.adjustmentDate
          ? new Date(data.adjustmentDate)
          : undefined,

        reason: data.reason,

        items: data.items
          ? {
              create: data.items.map((item) => ({
                materialId: item.materialId,
                storageLocationId: item.storageLocationId,
                systemQuantity: new Prisma.Decimal(
                  item.systemQuantity
                ),
                physicalQuantity: new Prisma.Decimal(
                  item.physicalQuantity
                ),
                varianceQuantity: new Prisma.Decimal(
                  item.varianceQuantity
                ),
                reason: item.reason,
              })),
            }
          : undefined,
      },

      include: {
        items: true,
      },
    });
  });
}

export async function approveStockAdjustment(
    id: string,
    userId: string
  ) {
    const adjustment = await prisma.stockAdjustment.findUnique({
      where: {
        id,
      },
    });
  
    if (!adjustment) {
      throw new Error("Stock adjustment not found");
    }
  
    if (adjustment.status !== StockAdjustmentStatus.PENDING) {
      throw new Error(
        "Only PENDING stock adjustments can be approved"
      );
    }
  
    if (adjustment.requestedBy === userId) {
      throw new Error(
        "The person who requested the adjustment cannot approve it"
      );
    }
  
    return prisma.$transaction(async (tx) => {
      const updatedAdjustment = await tx.stockAdjustment.update({
        where: {
          id,
        },
        data: {
          status: StockAdjustmentStatus.APPROVED,
          approvedBy: userId,
        },
        include: {
          items: true,
          approver: true,
          requester: true,
        },
      });
    
      if (updatedAdjustment.requestedBy) {
        await notifyStockAdjustmentApproved(
          updatedAdjustment.requestedBy,
          updatedAdjustment.id,
          updatedAdjustment.adjustmentNumber,
          tx
        );
      }
    
      return updatedAdjustment;
    });
  }

  export async function rejectStockAdjustment(
    id: string,
    userId: string
  ) {
    const adjustment = await prisma.stockAdjustment.findUnique({
      where: {
        id,
      },
    });
  
    if (!adjustment) {
      throw new Error("Stock adjustment not found");
    }
  
    if (adjustment.status !== StockAdjustmentStatus.PENDING) {
      throw new Error(
        "Only PENDING stock adjustments can be rejected"
      );
    }
  
    if (adjustment.requestedBy === userId) {
      throw new Error(
        "The person who requested the adjustment cannot reject it"
      );
    }
  
    return prisma.$transaction(async (tx) => {
      const updatedAdjustment = await tx.stockAdjustment.update({
        where: {
          id,
        },
        data: {
          status: StockAdjustmentStatus.REJECTED,
          approvedBy: userId,
        },
        include: {
          items: true,
          approver: true,
          requester: true,
        },
      });
    
      if (updatedAdjustment.requestedBy) {
        await notifyStockAdjustmentRejected(
          updatedAdjustment.requestedBy,
          updatedAdjustment.id,
          updatedAdjustment.adjustmentNumber,
          tx
        );
      }
    
      return updatedAdjustment;
    });
  }

  export async function postStockAdjustment(
    id: string,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.findUnique({
        where: {
          id,
        },
  
        include: {
          items: true,
        },
      });
  
      if (!adjustment) {
        throw new Error("Stock adjustment not found");
      }
  
      if (adjustment.status !== StockAdjustmentStatus.APPROVED) {
        throw new Error(
          "Only APPROVED stock adjustments can be posted"
        );
      }
  
      if (adjustment.items.length === 0) {
        throw new Error(
          "Cannot post an adjustment without items"
        );
      }
  
      for (const item of adjustment.items) {
        const variance = new Prisma.Decimal(item.varianceQuantity);
  
        if (variance.equals(0)) {
          continue;
        }
  
        const inventory = await tx.inventoryBalance.findFirst({
          where: {
            projectId: adjustment.projectId,
            warehouseId: adjustment.warehouseId,
            materialId: item.materialId,
            storageLocationId: item.storageLocationId ?? null,
          },
        });
  
        if (!inventory) {
          throw new Error(
            `Inventory balance not found for material ${item.materialId}`
          );
        }
  
        const currentQuantity = new Prisma.Decimal(
          inventory.physicalQuantity
        );
  
        const newQuantity = currentQuantity.plus(variance);
  
        if (newQuantity.lessThan(0)) {
          throw new Error(
            `Adjustment would result in negative stock for material ${item.materialId}`
          );
        }
  
        const unitCost = new Prisma.Decimal(
          inventory.averageUnitCost
        );
  
        const newStockValue = newQuantity.mul(unitCost);
  
        await tx.inventoryBalance.update({
          where: {
            id: inventory.id,
          },
  
          data: {
            physicalQuantity: newQuantity,
            stockValue: newStockValue,
          },
        });
  
        const transactionType =
          variance.greaterThan(0)
            ? InventoryTransactionType.ADJUSTMENT_IN
            : InventoryTransactionType.ADJUSTMENT_OUT;
  
        const transactionQuantity = variance.abs();
  
        const transactionNumber =
          `IT-${Date.now()}-${Math.floor(
            1000 + Math.random() * 9000
          )}`;
  
        await tx.inventoryTransaction.create({
          data: {
            transactionNumber,
            projectId: adjustment.projectId,
            materialId: item.materialId,
            warehouseId: adjustment.warehouseId,
            storageLocationId: item.storageLocationId,
            transactionType,
            quantity: transactionQuantity,
            unitCost,
            totalValue: transactionQuantity.mul(unitCost),
            referenceType: "STOCK_ADJUSTMENT",
            referenceId: adjustment.id,
            transactionDate: new Date(),
            performedBy: userId,
            reason:
              item.reason ??
              adjustment.reason,
          },
        });
      }
  
      const postedAdjustment = await tx.stockAdjustment.update({
        where: {
          id,
        },
        data: {
          status: StockAdjustmentStatus.POSTED,
        },
        include: {
          items: true,
          requester: true,
          approver: true,
        },
      });
      
      if (postedAdjustment.requestedBy) {
        await notifyStockAdjustmentPosted(
          postedAdjustment.requestedBy,
          postedAdjustment.id,
          postedAdjustment.adjustmentNumber,
          tx
        );
      }
      
      return postedAdjustment;
    });
  }