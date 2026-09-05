import {
  Prisma,
  StockAdjustmentStatus,
  InventoryTransactionType,
} from "@prisma/client";

import {prisma} from "../config/database";
import { generateInventoryTransactionNumber, generateMaterialWastageNumber } from "../utils/numberGenerator";
import {
  notifyMaterialWastageCreated,
  notifyMaterialWastageApproved,
  notifyMaterialWastageRejected,
  notifyMaterialWastagePosted,
} from "./notification.events";

export interface CreateMaterialWastageInput {
  projectId: string;
  materialId: string;
  activityId?: string;
  buildingId?: string;
  wastageDate?: string;
  quantity: number;
  reason: string;
}

export interface UpdateMaterialWastageInput {
  activityId?: string | null;
  buildingId?: string | null;
  wastageDate?: string;
  quantity?: number;
  reason?: string;
}

function toDecimal(value: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(value);
}

function parseDate(value?: string) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid wastageDate");
  }

  return date;
}

function validatePositiveQuantity(quantity: number) {
  if (
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error("Quantity must be greater than zero");
  }
}

/**
 * Validate that the project exists.
 */
async function validateProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

/**
 * Validate material belongs to the system and is active.
 */
async function validateMaterial(materialId: string) {
  const material = await prisma.material.findUnique({
    where: {
      id: materialId,
    },
  });

  if (!material) {
    throw new Error("Material not found");
  }

  if (!material.isActive) {
    throw new Error("Material is inactive");
  }

  return material;
}

/**
 * Validate optional building.
 */
async function validateBuilding(
  projectId: string,
  buildingId?: string | null
) {
  if (!buildingId) {
    return null;
  }

  const building = await prisma.building.findFirst({
    where: {
      id: buildingId,
      projectId,
    },
  });

  if (!building) {
    throw new Error(
      "Building not found or does not belong to the project"
    );
  }

  return building;
}

/**
 * Validate optional activity.
 */
async function validateActivity(
  projectId: string,
  activityId?: string | null
) {
  if (!activityId) {
    return null;
  }

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      projectId,
    },
  });

  if (!activity) {
    throw new Error(
      "Activity not found or does not belong to the project"
    );
  }

  return activity;
}

/**
 * Create wastage report.
 *
 * Inventory is NOT changed here.
 */

export async function createMaterialWastage(
  userId: string,
  data: CreateMaterialWastageInput
) {
  validatePositiveQuantity(data.quantity);

  if (!data.reason?.trim()) {
    throw new Error("Reason is required");
  }

  await validateProject(data.projectId);
  await validateMaterial(data.materialId);

  await validateBuilding(
    data.projectId,
    data.buildingId
  );

  await validateActivity(
    data.projectId,
    data.activityId
  );

  if (data.activityId && data.buildingId) {
    const activity = await prisma.activity.findUnique({
      where: {
        id: data.activityId,
      },
      select: {
        buildingId: true,
      },
    });

    if (
      activity?.buildingId &&
      activity.buildingId !== data.buildingId
    ) {
      throw new Error(
        "Activity does not belong to the specified building"
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const wastageNumber =
      await generateMaterialWastageNumber(tx);

    const wastage =
      await tx.materialWastage.create({
        data: {
          wastageNumber,

          projectId: data.projectId,
          materialId: data.materialId,
          activityId: data.activityId,
          buildingId: data.buildingId,

          wastageDate: parseDate(
            data.wastageDate
          ),

          quantity: toDecimal(data.quantity),

          reason: data.reason.trim(),

          reportedBy: userId,

          status: StockAdjustmentStatus.PENDING,
        },

        include: {
          project: true,

          material: {
            include: {
              unit: true,
            },
          },

          activity: true,
          building: true,

          reporter: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

    await notifyMaterialWastageCreated(
      wastage.projectId,
      wastage.id,
      wastage.wastageNumber,
      tx
    );

    return wastage;
  });
}

/**
 * Get one wastage record.
 */
export async function getMaterialWastageById(
  id: string
) {
  const wastage =
    await prisma.materialWastage.findUnique({
      where: {
        id,
      },

      include: {
        project: true,

        material: {
          include: {
            unit: true,
            category: true,
          },
        },

        activity: true,

        building: true,

        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },

        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

  if (!wastage) {
    throw new Error("Material wastage not found");
  }

  return wastage;
}

/**
 * List wastage records.
 */
export async function getMaterialWastages(filters?: {
  projectId?: string;
  materialId?: string;
  activityId?: string;
  buildingId?: string;
  status?: StockAdjustmentStatus;
}) {
  return prisma.materialWastage.findMany({
    where: {
      ...(filters?.projectId
        ? {
            projectId: filters.projectId,
          }
        : {}),

      ...(filters?.materialId
        ? {
            materialId: filters.materialId,
          }
        : {}),

      ...(filters?.activityId
        ? {
            activityId: filters.activityId,
          }
        : {}),

      ...(filters?.buildingId
        ? {
            buildingId: filters.buildingId,
          }
        : {}),

      ...(filters?.status
        ? {
            status: filters.status,
          }
        : {}),
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      material: {
        include: {
          unit: true,
        },
      },

      project: true,

      activity: true,

      building: true,

      reporter: {
        select: {
          id: true,
          fullName: true,
        },
      },

      approver: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });
}

/**
 * Update PENDING wastage.
 */
export async function updateMaterialWastage(
  id: string,
  data: UpdateMaterialWastageInput
) {
  const existing =
    await prisma.materialWastage.findUnique({
      where: {
        id,
      },
    });

  if (!existing) {
    throw new Error("Material wastage not found");
  }

  if (
    existing.status !==
    StockAdjustmentStatus.PENDING
  ) {
    throw new Error(
      "Only PENDING wastage records can be updated"
    );
  }

  if (data.quantity !== undefined) {
    validatePositiveQuantity(data.quantity);
  }

  if (
    data.reason !== undefined &&
    !data.reason.trim()
  ) {
    throw new Error("Reason cannot be empty");
  }

  if (data.buildingId !== undefined) {
    await validateBuilding(
      existing.projectId,
      data.buildingId
    );
  }

  if (data.activityId !== undefined) {
    await validateActivity(
      existing.projectId,
      data.activityId
    );
  }

  return prisma.materialWastage.update({
    where: {
      id,
    },

    data: {
      ...(data.activityId !== undefined
        ? {
            activityId: data.activityId,
          }
        : {}),

      ...(data.buildingId !== undefined
        ? {
            buildingId: data.buildingId,
          }
        : {}),

      ...(data.wastageDate !== undefined
        ? {
            wastageDate: parseDate(
              data.wastageDate
            ),
          }
        : {}),

      ...(data.quantity !== undefined
        ? {
            quantity: toDecimal(data.quantity),
          }
        : {}),

      ...(data.reason !== undefined
        ? {
            reason: data.reason.trim(),
          }
        : {}),
    },

    include: {
      material: true,
      activity: true,
      building: true,
      project: true,
    },
  });
}

/**
 * Approve wastage.
 *
 * Inventory is NOT changed here.
 */
export async function approveMaterialWastage(
  id: string,
  approverId: string
) {
  return prisma.$transaction(async (tx) => {
    const wastage =
      await tx.materialWastage.findUnique({
        where: {
          id,
        },
      });

    if (!wastage) {
      throw new Error(
        "Material wastage not found"
      );
    }

    if (
      wastage.status !==
      StockAdjustmentStatus.PENDING
    ) {
      throw new Error(
        `Wastage cannot be approved from status ${wastage.status}`
      );
    }

    if (wastage.reportedBy === approverId) {
      throw new Error(
        "The person who reported wastage cannot approve the same record"
      );
    }

    const updated =
      await tx.materialWastage.update({
        where: {
          id,
        },

        data: {
          status: StockAdjustmentStatus.APPROVED,
          approvedBy: approverId,
        },

        include: {
          material: true,
          project: true,
          activity: true,
          building: true,

          reporter: {
            select: {
              id: true,
              fullName: true,
            },
          },

          approver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

    if (updated.reportedBy) {
      await notifyMaterialWastageApproved(
        updated.reportedBy,
        updated.id,
        updated.wastageNumber,
        tx
      );
    }

    return updated;
  });
}

/**
 * Reject wastage.
 *
 * No inventory change.
 */
export async function rejectMaterialWastage(
  id: string,
  approverId: string
) {
  return prisma.$transaction(async (tx) => {
    const wastage =
      await tx.materialWastage.findUnique({
        where: {
          id,
        },
      });

    if (!wastage) {
      throw new Error(
        "Material wastage not found"
      );
    }

    if (
      wastage.status !==
      StockAdjustmentStatus.PENDING
    ) {
      throw new Error(
        `Wastage cannot be rejected from status ${wastage.status}`
      );
    }

    if (wastage.reportedBy === approverId) {
      throw new Error(
        "The person who reported wastage cannot reject the same record"
      );
    }

    const updated =
      await tx.materialWastage.update({
        where: {
          id,
        },

        data: {
          status: StockAdjustmentStatus.REJECTED,
          approvedBy: approverId,
        },

        include: {
          material: true,
          project: true,

          reporter: {
            select: {
              id: true,
              fullName: true,
            },
          },

          approver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

    if (updated.reportedBy) {
      await notifyMaterialWastageRejected(
        updated.reportedBy,
        updated.id,
        updated.wastageNumber,
        tx
      );
    }

    return updated;
  });
}

/**
 * Post approved wastage to inventory.
 *
 * This is the operation that actually decreases stock.
 */
export async function postMaterialWastage(
  id: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const wastage =
      await tx.materialWastage.findUnique({
        where: {
          id,
        },

        include: {
          material: true,
        },
      });

    if (!wastage) {
      throw new Error(
        "Material wastage not found"
      );
    }

    if (
      wastage.status !==
      StockAdjustmentStatus.APPROVED
    ) {
      throw new Error(
        `Only APPROVED wastage can be posted. Current status: ${wastage.status}`
      );
    }

    /**
     * Find inventory for this project/material.
     *
     * Wastage model has no warehouseId, so the current
     * schema does not tell us which warehouse should be
     * reduced if multiple warehouses contain the material.
     *
     * We therefore require exactly one inventory balance.
     */
    const balances =
      await tx.inventoryBalance.findMany({
        where: {
          projectId: wastage.projectId,
          materialId: wastage.materialId,
        },
      });

    if (balances.length === 0) {
      throw new Error(
        "No inventory balance found for this material in the project"
      );
    }

    if (balances.length > 1) {
      throw new Error(
        "Multiple inventory balances found. MaterialWastage needs warehouseId/storageLocationId to safely post wastage."
      );
    }

    const inventory = balances[0];

    if (
      inventory.physicalQuantity.lt(
        wastage.quantity
      )
    ) {
      throw new Error(
        `Insufficient inventory. Available: ${inventory.physicalQuantity.toString()}, wastage: ${wastage.quantity.toString()}`
      );
    }

    const newPhysicalQuantity =
      inventory.physicalQuantity.minus(
        wastage.quantity
      );

    const newStockValue =
      newPhysicalQuantity.times(
        inventory.averageUnitCost
      );

    await tx.inventoryBalance.update({
      where: {
        id: inventory.id,
      },

      data: {
        physicalQuantity:
          newPhysicalQuantity,
        stockValue: newStockValue,
      },
    });

    /**
     * Use DAMAGE by default.
     *
     * LOSS/DISPOSAL can be added later when a dedicated
     * wastage type is introduced into the schema.
     */
    const transactionNumber =
      await generateInventoryTransactionNumber(
        tx
      );

    await tx.inventoryTransaction.create({
      data: {
        transactionNumber,
        projectId: wastage.projectId,
        materialId: wastage.materialId,
        warehouseId: inventory.warehouseId,
        storageLocationId:
          inventory.storageLocationId,

        transactionType:
          InventoryTransactionType.DAMAGE,

        quantity: wastage.quantity,

        unitCost:
          inventory.averageUnitCost,

        totalValue:
          wastage.quantity.times(
            inventory.averageUnitCost
          ),

        referenceType: "MATERIAL_WASTAGE",
        referenceId: wastage.id,

        performedBy: userId,

        reason: wastage.reason,
      },
    });

    const updated = await tx.materialWastage.update({
      where: {
        id,
      },
      data: {
        status: StockAdjustmentStatus.POSTED,
      },
      include: {
        material: true,
        project: true,
        activity: true,
        building: true,
        reporter: {
          select: {
            id: true,
            fullName: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
    
    if (updated.reportedBy) {
      await notifyMaterialWastagePosted(
        updated.reportedBy,
        updated.id,
        updated.wastageNumber,
        tx
      );
    }
    
    return updated;
  });
}
