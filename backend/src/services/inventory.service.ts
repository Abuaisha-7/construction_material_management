import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// TYPES
// ============================================================

export interface InventoryBalanceFilters {
  projectId?: string;
  materialId?: string;
  warehouseId?: string;
  storageLocationId?: string;
}

export interface InventoryTransactionFilters {
  projectId?: string;
  materialId?: string;
  warehouseId?: string;
  storageLocationId?: string;
  transactionType?: Prisma.InventoryTransactionType;
  referenceType?: string;
  referenceId?: string;
  page?: number;
  limit?: number;
}

export interface CreateOpeningBalanceInput {
  projectId: string;
  materialId: string;
  warehouseId: string;
  storageLocationId?: string;
  quantity: string | number;
  unitCost: string | number;
  reason?: string;
}

export interface CreateAdjustmentInput {
  projectId: string;
  materialId: string;
  warehouseId: string;
  storageLocationId?: string;
  quantity: string | number;
  type: "IN" | "OUT";
  reason: string;
}

// ============================================================
// HELPERS
// ============================================================

function decimal(value: string | number | Prisma.Decimal) {
  return new Prisma.Decimal(value);
}

// ============================================================
// TRANSACTION NUMBER
// ============================================================

async function generateInventoryTransactionNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const lastTransaction =
    await tx.inventoryTransaction.findFirst({
      where: {
        transactionNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        transactionNumber: "desc",
      },
      select: {
        transactionNumber: true,
      },
    });

  let sequence = 1;

  if (lastTransaction) {
    const lastSequence = Number(
      lastTransaction.transactionNumber.substring(
        prefix.length
      )
    );

    if (!Number.isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(6, "0")}`;
}

// ============================================================
// VALIDATE MATERIAL
// ============================================================

async function validateMaterial(
  tx: Prisma.TransactionClient,
  materialId: string
) {
  const material =
    await tx.material.findUnique({
      where: {
        id: materialId,
      },
    });

  if (!material) {
    throw new Error("Material not found");
  }

  if (!material.isActive) {
    throw new Error(
      `Material is inactive: ${material.materialCode} - ${material.name}`
    );
  }

  return material;
}

// ============================================================
// VALIDATE WAREHOUSE
// ============================================================

async function validateWarehouse(
  tx: Prisma.TransactionClient,
  projectId: string,
  warehouseId: string
) {
  const warehouse =
    await tx.warehouse.findUnique({
      where: {
        id: warehouseId,
      },
    });

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  if (!warehouse.isActive) {
    throw new Error("Warehouse is inactive");
  }

  if (warehouse.projectId !== projectId) {
    throw new Error(
      "Warehouse does not belong to the selected project"
    );
  }

  return warehouse;
}

// ============================================================
// VALIDATE STORAGE LOCATION
// ============================================================

async function validateStorageLocation(
  tx: Prisma.TransactionClient,
  warehouseId: string,
  storageLocationId?: string
) {
  if (!storageLocationId) {
    return null;
  }

  const storageLocation =
    await tx.storageLocation.findUnique({
      where: {
        id: storageLocationId,
      },
    });

  if (!storageLocation) {
    throw new Error(
      "Storage location not found"
    );
  }

  if (!storageLocation.isActive) {
    throw new Error(
      "Storage location is inactive"
    );
  }

  if (
    storageLocation.warehouseId !==
    warehouseId
  ) {
    throw new Error(
      "Storage location does not belong to the selected warehouse"
    );
  }

  return storageLocation;
}

// ============================================================
// GET INVENTORY BALANCES
// ============================================================

export async function getInventoryBalances(
  filters: InventoryBalanceFilters
) {
  const where: Prisma.InventoryBalanceWhereInput =
    {};

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters.materialId) {
    where.materialId = filters.materialId;
  }

  if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  if (filters.storageLocationId) {
    where.storageLocationId =
      filters.storageLocationId;
  }

  return prisma.inventoryBalance.findMany({
    where,

    include: {
      material: true,
      project: true,
      warehouse: true,
      storageLocation: true,
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
}

// ============================================================
// GET SINGLE BALANCE
// ============================================================

export async function getInventoryBalanceById(
  id: string
) {
  const balance =
    await prisma.inventoryBalance.findUnique({
      where: {
        id,
      },

      include: {
        material: true,
        project: true,
        warehouse: true,
        storageLocation: true,
      },
    });

  if (!balance) {
    throw new Error(
      "Inventory balance not found"
    );
  }

  return balance;
}

// ============================================================
// GET INVENTORY TRANSACTIONS
// ============================================================

export async function getInventoryTransactions(
  filters: InventoryTransactionFilters
) {
  const page = Math.max(
    Number(filters.page) || 1,
    1
  );

  const limit = Math.min(
    Math.max(Number(filters.limit) || 20, 1),
    100
  );

  const skip = (page - 1) * limit;

  const where: Prisma.InventoryTransactionWhereInput =
    {};

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters.materialId) {
    where.materialId = filters.materialId;
  }

  if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  if (filters.storageLocationId) {
    where.storageLocationId =
      filters.storageLocationId;
  }

  if (filters.transactionType) {
    where.transactionType =
      filters.transactionType;
  }

  if (filters.referenceType) {
    where.referenceType =
      filters.referenceType;
  }

  if (filters.referenceId) {
    where.referenceId =
      filters.referenceId;
  }

  const [transactions, total] =
    await prisma.$transaction([
      prisma.inventoryTransaction.findMany({
        where,

        include: {
          material: true,
          project: true,
          warehouse: true,
          storageLocation: true,
          performer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },

        orderBy: {
          transactionDate: "desc",
        },

        skip,
        take: limit,
      }),

      prisma.inventoryTransaction.count({
        where,
      }),
    ]);

  return {
    data: transactions,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================
// GET SINGLE TRANSACTION
// ============================================================

export async function getInventoryTransactionById(
  id: string
) {
  const transaction =
    await prisma.inventoryTransaction.findUnique({
      where: {
        id,
      },

      include: {
        material: true,
        project: true,
        warehouse: true,
        storageLocation: true,

        performer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

  if (!transaction) {
    throw new Error(
      "Inventory transaction not found"
    );
  }

  return transaction;
}

// ============================================================
// CREATE OPENING BALANCE
// ============================================================

export async function createOpeningBalance(
  data: CreateOpeningBalanceInput,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const quantity = decimal(data.quantity);
    const unitCost = decimal(data.unitCost);

    if (quantity.lte(0)) {
      throw new Error(
        "Opening balance quantity must be greater than zero"
      );
    }

    if (unitCost.lt(0)) {
      throw new Error(
        "Unit cost cannot be negative"
      );
    }

    // ------------------------------------------
    // Validate material
    // ------------------------------------------

    await validateMaterial(
      tx,
      data.materialId
    );

    // ------------------------------------------
    // Validate warehouse
    // ------------------------------------------

    await validateWarehouse(
      tx,
      data.projectId,
      data.warehouseId
    );

    // ------------------------------------------
    // Validate storage location
    // ------------------------------------------

    await validateStorageLocation(
      tx,
      data.warehouseId,
      data.storageLocationId
    );

    // ------------------------------------------
    // Prevent duplicate opening balance
    // ------------------------------------------

    const existingOpening =
      await tx.inventoryTransaction.findFirst({
        where: {
          projectId: data.projectId,
          materialId: data.materialId,
          warehouseId: data.warehouseId,
          storageLocationId:
            data.storageLocationId ?? null,
          transactionType:
            "OPENING_BALANCE",
        },
      });

    if (existingOpening) {
      throw new Error(
        "Opening balance already exists for this inventory location"
      );
    }

    // ------------------------------------------
    // Calculate value
    // ------------------------------------------

    const totalValue =
      quantity.mul(unitCost);

    // ------------------------------------------
    // Generate transaction number
    // ------------------------------------------

    const transactionNumber =
      await generateInventoryTransactionNumber(
        tx
      );

    // ------------------------------------------
    // Find balance
    // ------------------------------------------

    const existingBalance =
      await tx.inventoryBalance.findFirst({
        where: {
          projectId: data.projectId,
          materialId: data.materialId,
          warehouseId: data.warehouseId,
          storageLocationId:
            data.storageLocationId ?? null,
        },
      });

    let balance;

    if (existingBalance) {
      const newQuantity =
        existingBalance.physicalQuantity.add(
          quantity
        );

      const newStockValue =
        existingBalance.stockValue.add(
          totalValue
        );

      const newAverageCost =
        newQuantity.eq(0)
          ? new Prisma.Decimal(0)
          : newStockValue.div(newQuantity);

      balance =
        await tx.inventoryBalance.update({
          where: {
            id: existingBalance.id,
          },

          data: {
            physicalQuantity:
              newQuantity,

            averageUnitCost:
              newAverageCost,

            stockValue:
              newStockValue,
          },
        });
    } else {
      balance =
        await tx.inventoryBalance.create({
          data: {
            projectId:
              data.projectId,

            materialId:
              data.materialId,

            warehouseId:
              data.warehouseId,

            storageLocationId:
              data.storageLocationId,

            physicalQuantity:
              quantity,

            reservedQuantity:
              new Prisma.Decimal(0),

            averageUnitCost:
              unitCost,

            stockValue:
              totalValue,
          },
        });
    }

    // ------------------------------------------
    // Create transaction
    // ------------------------------------------

    const transaction =
      await tx.inventoryTransaction.create({
        data: {
          transactionNumber,

          projectId:
            data.projectId,

          materialId:
            data.materialId,

          warehouseId:
            data.warehouseId,

          storageLocationId:
            data.storageLocationId,

          transactionType:
            "OPENING_BALANCE",

          quantity,

          unitCost,

          totalValue,

          referenceType:
            "OPENING_BALANCE",

          performedBy:
            userId,

          reason:
            data.reason ??
            "Initial inventory balance",
        },
      });

    return {
      balance,
      transaction,
    };
  });
}

// ============================================================
// CREATE INVENTORY ADJUSTMENT
// ============================================================

export async function createInventoryAdjustment(
  data: CreateAdjustmentInput,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const quantity = decimal(data.quantity);

    if (quantity.lte(0)) {
      throw new Error(
        "Adjustment quantity must be greater than zero"
      );
    }

    if (!data.reason?.trim()) {
      throw new Error(
        "Adjustment reason is required"
      );
    }

    // ------------------------------------------
    // Validate material
    // ------------------------------------------

    const material =
      await validateMaterial(
        tx,
        data.materialId
      );

    // ------------------------------------------
    // Validate warehouse
    // ------------------------------------------

    await validateWarehouse(
      tx,
      data.projectId,
      data.warehouseId
    );

    // ------------------------------------------
    // Validate location
    // ------------------------------------------

    await validateStorageLocation(
      tx,
      data.warehouseId,
      data.storageLocationId
    );

    // ------------------------------------------
    // Find inventory balance
    // ------------------------------------------

    const balance =
      await tx.inventoryBalance.findFirst({
        where: {
          projectId: data.projectId,
          materialId: data.materialId,
          warehouseId: data.warehouseId,
          storageLocationId:
            data.storageLocationId ?? null,
        },
      });

    if (!balance) {
      throw new Error(
        "Inventory balance not found for this material location"
      );
    }

    // ------------------------------------------
    // ADJUSTMENT IN
    // ------------------------------------------

    if (data.type === "IN") {
      const unitCost =
        balance.averageUnitCost;

      const totalValue =
        quantity.mul(unitCost);

      const newQuantity =
        balance.physicalQuantity.add(
          quantity
        );

      const newStockValue =
        balance.stockValue.add(
          totalValue
        );

      const newAverageCost =
        newQuantity.eq(0)
          ? new Prisma.Decimal(0)
          : newStockValue.div(newQuantity);

      const updatedBalance =
        await tx.inventoryBalance.update({
          where: {
            id: balance.id,
          },

          data: {
            physicalQuantity:
              newQuantity,

            averageUnitCost:
              newAverageCost,

            stockValue:
              newStockValue,
          },
        });

      const transactionNumber =
        await generateInventoryTransactionNumber(
          tx
        );

      const transaction =
        await tx.inventoryTransaction.create({
          data: {
            transactionNumber,

            projectId:
              data.projectId,

            materialId:
              data.materialId,

            warehouseId:
              data.warehouseId,

            storageLocationId:
              data.storageLocationId,

            transactionType:
              "ADJUSTMENT_IN",

            quantity,

            unitCost,

            totalValue,

            referenceType:
              "STOCK_ADJUSTMENT",

            performedBy:
              userId,

            reason:
              data.reason,
          },
        });

      return {
        balance: updatedBalance,
        transaction,
      };
    }

    // ------------------------------------------
    // ADJUSTMENT OUT
    // ------------------------------------------

    if (data.type === "OUT") {
      if (
        balance.physicalQuantity.lt(quantity)
      ) {
        throw new Error(
          `Insufficient inventory. Available: ${balance.physicalQuantity.toString()}, Requested: ${quantity.toString()}`
        );
      }

      const unitCost =
        balance.averageUnitCost;

      const totalValue =
        quantity.mul(unitCost);

      const newQuantity =
        balance.physicalQuantity.sub(
          quantity
        );

      const newStockValue =
        balance.stockValue.sub(
          totalValue
        );

      const updatedBalance =
        await tx.inventoryBalance.update({
          where: {
            id: balance.id,
          },

          data: {
            physicalQuantity:
              newQuantity,

            stockValue:
              newStockValue,

            averageUnitCost:
              newQuantity.eq(0)
                ? new Prisma.Decimal(0)
                : balance.averageUnitCost,
          },
        });

      const transactionNumber =
        await generateInventoryTransactionNumber(
          tx
        );

      const transaction =
        await tx.inventoryTransaction.create({
          data: {
            transactionNumber,

            projectId:
              data.projectId,

            materialId:
              data.materialId,

            warehouseId:
              data.warehouseId,

            storageLocationId:
              data.storageLocationId,

            transactionType:
              "ADJUSTMENT_OUT",

            quantity,

            unitCost,

            totalValue,

            referenceType:
              "STOCK_ADJUSTMENT",

            performedBy:
              userId,

            reason:
              data.reason,
          },
        });

      return {
        balance: updatedBalance,
        transaction,
      };
    }

    throw new Error(
      "Invalid adjustment type"
    );
  });
}
