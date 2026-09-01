import { Prisma, PrismaClient } from "@prisma/client";

import { generateMaterialIssueNumber, generateInventoryTransactionNumber } from "../utils/numberGenerator";
const prisma = new PrismaClient();

/* =====================================================
   Types
===================================================== */

export interface CreateMaterialIssueInput {
  projectId: string;
  warehouseId: string;
  requestedBy?: string;

  receiverId?: string;
  activityId?: string;
  buildingId?: string;
  zoneId?: string;

  issueDate?: string;
  purpose?: string;
  remarks?: string;

  items: {
    materialId: string;
    approvedQuantity: string | number;
    issuedQuantity?: string | number;
    unitCost?: string | number;
    storageLocationId?: string;
  }[];
}

/* =====================================================
   CREATE MATERIAL ISSUE
===================================================== */

export async function createMaterialIssue(
  data: CreateMaterialIssueInput,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    /* -----------------------------------------------
       1. Validate project
    ------------------------------------------------ */

    const project =
      await tx.project.findUnique({
        where: {
          id: data.projectId,
        },
      });

    if (!project) {
      throw new Error("Project not found");
    }

    /* -----------------------------------------------
       2. Validate warehouse
    ------------------------------------------------ */

    const warehouse =
      await tx.warehouse.findUnique({
        where: {
          id: data.warehouseId,
        },
      });

    if (!warehouse) {
      throw new Error("Warehouse not found");
    }

    if (!warehouse.isActive) {
      throw new Error("Warehouse is inactive");
    }

    if (
      warehouse.projectId !==
      data.projectId
    ) {
      throw new Error(
        "Warehouse does not belong to the selected project"
      );
    }

    /* -----------------------------------------------
       3. Validate items
    ------------------------------------------------ */

    if (
      !data.items ||
      data.items.length === 0
    ) {
      throw new Error(
        "Material issue must contain at least one item"
      );
    }

    /* -----------------------------------------------
       4. Prevent duplicate materials
    ------------------------------------------------ */

    const materialIds =
      data.items.map(
        (item) => item.materialId
      );

    if (
      new Set(materialIds).size !==
      materialIds.length
    ) {
      throw new Error(
        "Duplicate materials are not allowed in the same material issue"
      );
    }

    /* -----------------------------------------------
       5. Validate materials
    ------------------------------------------------ */

    const materials =
      await tx.material.findMany({
        where: {
          id: {
            in: materialIds,
          },
        },
        select: {
          id: true,
          materialCode: true,
          name: true,
          isActive: true,
          currentUnitPrice: true,
        },
      });

    const materialMap = new Map(
      materials.map((material) => [
        material.id,
        material,
      ])
    );

    for (const item of data.items) {
      const material =
        materialMap.get(item.materialId);

      if (!material) {
        throw new Error(
          `Material not found: ${item.materialId}`
        );
      }

      if (!material.isActive) {
        throw new Error(
          `Material is inactive: ${material.materialCode} - ${material.name}`
        );
      }

      const quantity =
        new Prisma.Decimal(
          item.approvedQuantity
        );

      if (quantity.lte(0)) {
        throw new Error(
          `Approved quantity must be greater than zero for ${material.name}`
        );
      }

      if (
        item.issuedQuantity !== undefined
      ) {
        const issued =
          new Prisma.Decimal(
            item.issuedQuantity
          );

        if (issued.lt(0)) {
          throw new Error(
            `Issued quantity cannot be negative for ${material.name}`
          );
        }

        if (issued.gt(quantity)) {
          throw new Error(
            `Issued quantity cannot exceed approved quantity for ${material.name}`
          );
        }
      }
    }

    /* -----------------------------------------------
       6. Validate storage locations
    ------------------------------------------------ */

    for (const item of data.items) {
      if (!item.storageLocationId) {
        continue;
      }

      const location =
        await tx.storageLocation.findUnique({
          where: {
            id: item.storageLocationId,
          },
        });

      if (!location) {
        throw new Error(
          `Storage location not found: ${item.storageLocationId}`
        );
      }

      if (!location.isActive) {
        throw new Error(
          `Storage location is inactive: ${location.name}`
        );
      }

      if (
        location.warehouseId !==
        data.warehouseId
      ) {
        throw new Error(
          `Storage location ${location.name} does not belong to the selected warehouse`
        );
      }
    }

    /* -----------------------------------------------
       7. Generate issue number
    ------------------------------------------------ */

    const issueNumber =
      await generateMaterialIssueNumber(tx);

    /* -----------------------------------------------
       8. Create issue
    ------------------------------------------------ */

    const issue =
      await tx.materialIssue.create({
        data: {
          issueNumber,

          projectId:
            data.projectId,

          warehouseId:
            data.warehouseId,

          requestedBy:
            data.requestedBy ?? userId,

          receiverId:
            data.receiverId,

          activityId:
            data.activityId,

          buildingId:
            data.buildingId,

          zoneId:
            data.zoneId,

          issueDate:
            data.issueDate
              ? new Date(data.issueDate)
              : new Date(),

          status: "DRAFT",

          purpose:
            data.purpose,

          remarks:
            data.remarks,

          items: {
            create: data.items.map(
              (item) => ({
                materialId:
                  item.materialId,

                approvedQuantity:
                  new Prisma.Decimal(
                    item.approvedQuantity
                  ),

                issuedQuantity:
                  new Prisma.Decimal(
                    item.issuedQuantity ?? 0
                  ),

                unitCost:
                  item.unitCost !== undefined
                    ? new Prisma.Decimal(
                        item.unitCost
                      )
                    : materialMap.get(
                        item.materialId
                      )?.currentUnitPrice ?? 0,

                storageLocationId:
                  item.storageLocationId,
              })
            ),
          },
        },

        include: {
          project: true,

          warehouse: true,

          requester: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          receiver: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          activity: true,

          building: true,

          zone: true,

          items: {
            include: {
              material: true,
              storageLocation: true,
            },
          },
        },
      });

    return issue;
  });
}

/* =====================================================
   GET MATERIAL ISSUE 
===================================================== */

export async function getMaterialIssues(params?: {
    projectId?: string;
    warehouseId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
  
    const skip =
      (page - 1) * limit;
  
    const where: Prisma.MaterialIssueWhereInput =
      {};
  
    if (params?.projectId) {
      where.projectId =
        params.projectId;
    }
  
    if (params?.warehouseId) {
      where.warehouseId =
        params.warehouseId;
    }
  
    if (params?.status) {
      where.status =
        params.status as any;
    }
  
    const [issues, total] =
      await prisma.$transaction([
        prisma.materialIssue.findMany({
          where,
  
          skip,
          take: limit,
  
          orderBy: {
            issueDate: "desc",
          },
  
          include: {
            project: true,
            warehouse: true,
  
            requester: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
  
            receiver: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
  
            activity: true,
  
            items: {
              include: {
                material: true,
                storageLocation: true,
              },
            },
          },
        }),
  
        prisma.materialIssue.count({
          where,
        }),
      ]);
  
    return {
      data: issues,
      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit),
      },
    };
  }

export async function getMaterialIssueById(
    id: string
  ) {
    const issue =
      await prisma.materialIssue.findUnique({
        where: {
          id,
        },
  
        include: {
          project: true,
          warehouse: true,
  
          requester: {
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
  
          receiver: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
  
          activity: true,
          building: true,
          zone: true,
  
          items: {
            include: {
              material: true,
              storageLocation: true,
            },
          },
        },
      });
  
    if (!issue) {
      throw new Error(
        "Material issue not found"
      );
    }
  
    return issue;
  }

export async function submitMaterialIssue(
    id: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        const issue =
          await tx.materialIssue.findUnique({
            where: {
              id,
            },
  
            include: {
              items: true,
            },
          });
  
        if (!issue) {
          throw new Error(
            "Material issue not found"
          );
        }
  
        if (
          issue.status !== "DRAFT"
        ) {
          throw new Error(
            "Only DRAFT material issues can be submitted"
          );
        }
  
        if (
          issue.items.length === 0
        ) {
          throw new Error(
            "Cannot submit a material issue without items"
          );
        }
  
        return tx.materialIssue.update({
          where: {
            id,
          },
  
          data: {
            status:
              "PENDING_APPROVAL",
          },
  
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        });
      }
    );
  }

export async function approveMaterialIssue(
    id: string,
    userId: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        const issue =
          await tx.materialIssue.findUnique({
            where: {
              id,
            },
  
            include: {
              items: {
                include: {
                  material: true,
                  storageLocation: true,
                },
              },
            },
          });
  
        if (!issue) {
          throw new Error(
            "Material issue not found"
          );
        }
  
        if (
          issue.status !==
          "PENDING_APPROVAL"
        ) {
          throw new Error(
            "Only PENDING_APPROVAL material issues can be approved"
          );
        }
  
        if (
          issue.items.length === 0
        ) {
          throw new Error(
            "Cannot approve material issue without items"
          );
        }
  
        /* ---------------------------------------------
           Validate and reserve stock
        --------------------------------------------- */
  
        for (const item of issue.items) {
          const requested =
            new Prisma.Decimal(
              item.approvedQuantity
            );
  
          const balance =
            await tx.inventoryBalance.findFirst({
              where: {
                projectId:
                  issue.projectId,
  
                materialId:
                  item.materialId,
  
                warehouseId:
                  issue.warehouseId,
  
                storageLocationId:
                  item.storageLocationId,
              },
            });
  
          if (!balance) {
            throw new Error(
              `No inventory balance found for ${item.material.name}`
            );
          }
  
          const available =
            new Prisma.Decimal(
              balance.physicalQuantity
            ).sub(
              new Prisma.Decimal(
                balance.reservedQuantity
              )
            );
  
          if (
            available.lt(requested)
          ) {
            throw new Error(
              `Insufficient available stock for ${item.material.name}. ` +
              `Available: ${available}, ` +
              `Requested: ${requested}`
            );
          }
  
          const newReserved =
            new Prisma.Decimal(
              balance.reservedQuantity
            ).add(requested);
  
          await tx.inventoryBalance.update({
            where: {
              id: balance.id,
            },
  
            data: {
              reservedQuantity:
                newReserved,
            },
          });
        }
  
        /* ---------------------------------------------
           Approve issue
        --------------------------------------------- */
  
        return tx.materialIssue.update({
          where: {
            id,
          },
  
          data: {
            status: "APPROVED",
            approvedBy: userId,
          },
  
          include: {
            project: true,
            warehouse: true,
  
            approver: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
  
            items: {
              include: {
                material: true,
                storageLocation: true,
              },
            },
          },
        });
      }
    );
  }

export async function issueMaterial(
    id: string,
    userId: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        const issue =
          await tx.materialIssue.findUnique({
            where: {
              id,
            },
  
            include: {
              items: {
                include: {
                  material: true,
                  storageLocation: true,
                },
              },
            },
          });
  
        if (!issue) {
          throw new Error(
            "Material issue not found"
          );
        }
  
        if (
          issue.status !== "APPROVED" &&
          issue.status !==
            "PARTIALLY_ISSUED"
        ) {
          throw new Error(
            "Only APPROVED or PARTIALLY_ISSUED material issues can be issued"
          );
        }
  
        let totalIssued = true;
  
        for (const item of issue.items) {
          const approved =
            new Prisma.Decimal(
              item.approvedQuantity
            );
  
          const alreadyIssued =
            new Prisma.Decimal(
              item.issuedQuantity
            );
  
          const remaining =
            approved.sub(
              alreadyIssued
            );
  
          if (remaining.lte(0)) {
            continue;
          }
  
          /*
           * For this endpoint we issue the
           * remaining approved quantity.
           */
  
          const issueQuantity =
            remaining;
  
          const balance =
            await tx.inventoryBalance.findFirst({
              where: {
                projectId:
                  issue.projectId,
  
                materialId:
                  item.materialId,
  
                warehouseId:
                  issue.warehouseId,
  
                storageLocationId:
                  item.storageLocationId,
              },
            });
  
          if (!balance) {
            throw new Error(
              `Inventory balance not found for ${item.material.name}`
            );
          }
  
          const physical =
            new Prisma.Decimal(
              balance.physicalQuantity
            );
  
          const reserved =
            new Prisma.Decimal(
              balance.reservedQuantity
            );
  
          if (
            physical.lt(issueQuantity)
          ) {
            throw new Error(
              `Insufficient physical stock for ${item.material.name}`
            );
          }
  
          if (
            reserved.lt(issueQuantity)
          ) {
            throw new Error(
              `Reserved stock is insufficient for ${item.material.name}`
            );
          }
  
          const newPhysical =
            physical.sub(
              issueQuantity
            );
  
          const newReserved =
            reserved.sub(
              issueQuantity
            );
  
          const unitCost =
            item.unitCost
              ? new Prisma.Decimal(
                  item.unitCost
                )
              : new Prisma.Decimal(
                  balance.averageUnitCost
                );
  
          const totalValue =
            issueQuantity.mul(
              unitCost
            );
  
          /*
           * Update inventory
           */
  
          await tx.inventoryBalance.update({
            where: {
              id: balance.id,
            },
  
            data: {
              physicalQuantity:
                newPhysical,
  
              reservedQuantity:
                newReserved,
  
              stockValue:
                newPhysical.mul(
                  balance.averageUnitCost
                ),
            },
          });
  
          /*
           * Update issue item
           */
  
          await tx.materialIssueItem.update({
            where: {
              id: item.id,
            },
  
            data: {
              issuedQuantity:
                alreadyIssued.add(
                  issueQuantity
                ),
            },
          });
  
          /*
           * Create inventory transaction
           */
  
          const transactionNumber =
            await generateInventoryTransactionNumber(
              tx
            );
  
          await tx.inventoryTransaction.create({
            data: {
              transactionNumber,
  
              projectId:
                issue.projectId,
  
              materialId:
                item.materialId,
  
              warehouseId:
                issue.warehouseId,
  
              storageLocationId:
                item.storageLocationId,
  
              transactionType:
                "ISSUE",
  
              quantity:
                issueQuantity,
  
              unitCost,
  
              totalValue,
  
              referenceType:
                "MATERIAL_ISSUE",
  
              referenceId:
                issue.id,
  
              transactionDate:
                new Date(),
  
              performedBy:
                userId,
  
              reason:
                `Material issued under ${issue.issueNumber}`,
            },
          });
        }
  
        /*
         * Determine final status
         */
  
        const updatedItems =
          await tx.materialIssueItem.findMany({
            where: {
              issueId: id,
            },
          });
  
        let allIssued = true;
  
        let someIssued = false;
  
        for (const item of updatedItems) {
          const approved =
            new Prisma.Decimal(
              item.approvedQuantity
            );
  
          const issued =
            new Prisma.Decimal(
              item.issuedQuantity
            );
  
          if (issued.gt(0)) {
            someIssued = true;
          }
  
          if (!issued.eq(approved)) {
            allIssued = false;
          }
        }
  
        let status:
          | "PARTIALLY_ISSUED"
          | "ISSUED";
  
        if (allIssued) {
          status = "ISSUED";
        } else if (someIssued) {
          status =
            "PARTIALLY_ISSUED";
        } else {
          throw new Error(
            "No material was issued"
          );
        }
  
        return tx.materialIssue.update({
          where: {
            id,
          },
  
          data: {
            status,
            receiverId:
              issue.receiverId,
          },
  
          include: {
            project: true,
            warehouse: true,
  
            requester: {
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
  
            receiver: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
  
            activity: true,
  
            items: {
              include: {
                material: true,
                storageLocation: true,
              },
            },
          },
        });
      }
    );
  }

export async function cancelMaterialIssue(
    id: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        const issue =
          await tx.materialIssue.findUnique({
            where: {
              id,
            },
  
            include: {
              items: true,
            },
          });
  
        if (!issue) {
          throw new Error(
            "Material issue not found"
          );
        }
  
        if (
          issue.status === "CANCELLED"
        ) {
          throw new Error(
            "Material issue is already cancelled"
          );
        }
  
        if (
          issue.status === "ISSUED" ||
          issue.status ===
            "PARTIALLY_ISSUED"
        ) {
          throw new Error(
            "Issued material cannot be cancelled. Use a material return process instead."
          );
        }
  
        /*
         * Release reservations
         */
  
        if (
          issue.status === "APPROVED"
        ) {
          for (const item of issue.items) {
            const quantity =
              new Prisma.Decimal(
                item.approvedQuantity
              );
  
            const balance =
              await tx.inventoryBalance.findFirst({
                where: {
                  projectId:
                    issue.projectId,
  
                  materialId:
                    item.materialId,
  
                  warehouseId:
                    issue.warehouseId,
  
                  storageLocationId:
                    item.storageLocationId,
                },
              });
  
            if (balance) {
              const reserved =
                new Prisma.Decimal(
                  balance.reservedQuantity
                );
  
              const newReserved =
                reserved.sub(quantity);
  
              if (newReserved.lt(0)) {
                throw new Error(
                  `Invalid reservation for material ${item.materialId}`
                );
              }
  
              await tx.inventoryBalance.update({
                where: {
                  id: balance.id,
                },
  
                data: {
                  reservedQuantity:
                    newReserved,
                },
              });
            }
          }
        }
  
        return tx.materialIssue.update({
          where: {
            id,
          },
  
          data: {
            status: "CANCELLED",
          },
  
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        });
      }
    );
  }