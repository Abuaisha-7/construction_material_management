import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { generateGrnNumber } from "../utils/numberGenerator";
import {
  CreateGrnInput,
  UpdateGrnInput,
} from "../types/grn.types";

// ======================================================
// CREATE GRN
// ======================================================

export async function createGrn(
  data: CreateGrnInput,
  userId: string
) {
  return prisma.$transaction(async (tx) => {

    // --------------------------------------------------
    // 1. Validate project
    // --------------------------------------------------

    const project = await tx.project.findUnique({
      where: {
        id: data.projectId,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // --------------------------------------------------
    // 2. Validate supplier
    // --------------------------------------------------

    const supplier = await tx.supplier.findUnique({
      where: {
        id: data.supplierId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    if (!supplier.isActive) {
      throw new Error("Supplier is inactive");
    }

    // --------------------------------------------------
    // 3. Validate PO
    // --------------------------------------------------

    let purchaseOrder = null;

    if (data.purchaseOrderId) {
      purchaseOrder =
        await tx.purchaseOrder.findUnique({
          where: {
            id: data.purchaseOrderId,
          },
          include: {
            items: true,
          },
        });

      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }

      // PO must be approved before delivery
      if (
        purchaseOrder.status !== "APPROVED" &&
        purchaseOrder.status !== "PARTIALLY_RECEIVED"
      ) {
        throw new Error(
          "GRN can only be created for an APPROVED or PARTIALLY_RECEIVED purchase order"
        );
      }

      // PO must belong to selected project
      if (
        purchaseOrder.projectId !== data.projectId
      ) {
        throw new Error(
          "Purchase order does not belong to the selected project"
        );
      }

      // PO must belong to selected supplier
      if (
        purchaseOrder.supplierId !== data.supplierId
      ) {
        throw new Error(
          "Purchase order does not belong to the selected supplier"
        );
      }
    }

    // --------------------------------------------------
    // 4. Validate GRN items
    // --------------------------------------------------

    if (!data.items || data.items.length === 0) {
      throw new Error(
        "GRN must contain at least one item"
      );
    }

    // Prevent duplicate materials
    const materialIds = data.items.map(
      (item) => item.materialId
    );

    const uniqueMaterialIds =
      new Set(materialIds);

    if (
      uniqueMaterialIds.size !== materialIds.length
    ) {
      throw new Error(
        "Duplicate materials are not allowed in the same GRN"
      );
    }

    // --------------------------------------------------
    // 5. Fetch materials
    // --------------------------------------------------

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

      if (
        item.deliveredQuantity <= 0
      ) {
        throw new Error(
          `Delivered quantity must be greater than zero for ${material.name}`
        );
      }

      if (
        (item.damagedQuantity ?? 0) < 0 ||
        (item.rejectedQuantity ?? 0) < 0 ||
        (item.acceptedQuantity ?? 0) < 0
      ) {
        throw new Error(
          `Quantities cannot be negative for ${material.name}`
        );
      }
    }

    // --------------------------------------------------
    // 6. Validate units
    // --------------------------------------------------

    const unitIds = data.items.map(
      (item) => item.unitId
    );

    const units = await tx.unit.findMany({
      where: {
        id: {
          in: unitIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const unitMap = new Map(
      units.map((unit) => [
        unit.id,
        unit,
      ])
    );

    for (const item of data.items) {
      if (!unitMap.has(item.unitId)) {
        throw new Error(
          `Unit not found: ${item.unitId}`
        );
      }
    }

    // --------------------------------------------------
    // 7. Validate quantities against PO
    // --------------------------------------------------

    if (purchaseOrder) {

      for (const item of data.items) {

        const poItem =
          purchaseOrder.items.find(
            (poItem) =>
              poItem.materialId ===
              item.materialId
          );

        if (!poItem) {
          throw new Error(
            `Material ${item.materialId} does not exist in the purchase order`
          );
        }

        const deliveredQuantity =
          new Prisma.Decimal(
            item.deliveredQuantity
          );

        const alreadyReceived =
          new Prisma.Decimal(
            poItem.receivedQuantity
          );

        const orderedQuantity =
          new Prisma.Decimal(
            poItem.orderedQuantity
          );

        const remainingQuantity =
          orderedQuantity.sub(
            alreadyReceived
          );

        if (
          deliveredQuantity.gt(
            remainingQuantity
          )
        ) {
          throw new Error(
            `Delivered quantity exceeds remaining PO quantity for material ${item.materialId}`
          );
        }
      }
    }

    // --------------------------------------------------
    // 8. Calculate accepted quantity
    // --------------------------------------------------

    const grnItems = data.items.map(
      (item) => {

        const delivered =
          new Prisma.Decimal(
            item.deliveredQuantity
          );

        const damaged =
          new Prisma.Decimal(
            item.damagedQuantity ?? 0
          );

        const rejected =
          new Prisma.Decimal(
            item.rejectedQuantity ?? 0
          );

        let accepted =
          item.acceptedQuantity !== undefined
            ? new Prisma.Decimal(
                item.acceptedQuantity
              )
            : delivered
                .sub(damaged)
                .sub(rejected);

        if (accepted.lt(0)) {
          accepted = new Prisma.Decimal(0);
        }

        if (accepted.gt(delivered)) {
          throw new Error(
            `Accepted quantity cannot exceed delivered quantity for material ${item.materialId}`
          );
        }

        return {
          materialId:
            item.materialId,

          orderedQuantity:
            purchaseOrder
              ? purchaseOrder.items.find(
                  (poItem) =>
                    poItem.materialId ===
                    item.materialId
                )?.orderedQuantity
              : undefined,

          deliveredQuantity:
            delivered,

          damagedQuantity:
            damaged,

          rejectedQuantity:
            rejected,

          acceptedQuantity:
            accepted,

          unitId:
            item.unitId,

          batchNumber:
            item.batchNumber,

          manufacturingDate:
            item.manufacturingDate
              ? new Date(
                  item.manufacturingDate
                )
              : undefined,

          expiryDate:
            item.expiryDate
              ? new Date(
                  item.expiryDate
                )
              : undefined,

          storageLocationId:
            item.storageLocationId,

          remarks:
            item.remarks,
        };
      }
    );

    // --------------------------------------------------
    // 9. Generate GRN number
    // --------------------------------------------------

    const grnNumber =
      await generateGrnNumber(tx);

    // --------------------------------------------------
    // 10. Create GRN
    // --------------------------------------------------

    const grn =
      await tx.goodsReceivedNote.create({
        data: {
          grnNumber,

          projectId:
            data.projectId,

          supplierId:
            data.supplierId,

          purchaseOrderId:
            data.purchaseOrderId,

          deliveryDate:
            new Date(data.deliveryDate),

          deliveryNoteNumber:
            data.deliveryNoteNumber,

          vehicleNumber:
            data.vehicleNumber,

          driverName:
            data.driverName,

          status:
            "DRAFT",

          receivedBy:
            userId,

          remarks:
            data.remarks,

          items: {
            create: grnItems,
          },
        },

        include: {
          project: true,
          supplier: true,
          purchaseOrder: true,

          receiver: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },

          items: {
            include: {
              material: true,
              unit: true,
              storageLocation: true,
            },
          },
        },
      });

    return grn;
  });
}

// ======================================================
// GET ALL GRNS
// ======================================================

export async function getGrns() {
  return prisma.goodsReceivedNote.findMany({
    orderBy: {
      deliveryDate: "desc",
    },

    include: {
      project: true,
      supplier: true,
      purchaseOrder: true,

      items: {
        include: {
          material: true,
          unit: true,
        },
      },
    },
  });
}

// ======================================================
// GET GRN BY ID
// ======================================================

export async function getGrnById(
  id: string
) {
  const grn =
    await prisma.goodsReceivedNote.findUnique({
      where: {
        id,
      },

      include: {
        project: true,
        supplier: true,
        purchaseOrder: true,

        receiver: {
          select: {
            id: true,
            name: true,
          },
        },

        items: {
          include: {
            material: true,
            unit: true,
            storageLocation: true,
          },
        },

        inspections: true,
      },
    });

  if (!grn) {
    throw new Error("GRN not found");
  }

  return grn;
}

// ======================================================
// UPDATE GRN
// ======================================================

export async function updateGrn(
  id: string,
  data: UpdateGrnInput
) {
  return prisma.$transaction(
    async (tx) => {

      const existing =
        await tx.goodsReceivedNote.findUnique({
          where: {
            id,
          },
          include: {
            items: true,
          },
        });

      if (!existing) {
        throw new Error(
          "GRN not found"
        );
      }

      if (
        existing.status !== "DRAFT"
      ) {
        throw new Error(
          "Only DRAFT GRNs can be updated"
        );
      }

      // Update header
      await tx.goodsReceivedNote.update({
        where: {
          id,
        },

        data: {
          deliveryDate:
            data.deliveryDate
              ? new Date(
                  data.deliveryDate
                )
              : undefined,

          deliveryNoteNumber:
            data.deliveryNoteNumber,

          vehicleNumber:
            data.vehicleNumber,

          driverName:
            data.driverName,

          remarks:
            data.remarks,
        },
      });

      // If items are supplied, replace them
      if (data.items) {

        await tx.grnItem.deleteMany({
          where: {
            grnId: id,
          },
        });

        await tx.grnItem.createMany({
          data: data.items.map(
            (item) => {

              const delivered =
                new Prisma.Decimal(
                  item.deliveredQuantity
                );

              const damaged =
                new Prisma.Decimal(
                  item.damagedQuantity ?? 0
                );

              const rejected =
                new Prisma.Decimal(
                  item.rejectedQuantity ?? 0
                );

              const accepted =
                item.acceptedQuantity !== undefined
                  ? new Prisma.Decimal(
                      item.acceptedQuantity
                    )
                  : delivered
                      .sub(damaged)
                      .sub(rejected);

              return {
                grnId: id,

                materialId:
                  item.materialId,

                deliveredQuantity:
                  delivered,

                damagedQuantity:
                  damaged,

                rejectedQuantity:
                  rejected,

                acceptedQuantity:
                  accepted,

                unitId:
                  item.unitId,

                batchNumber:
                  item.batchNumber,

                manufacturingDate:
                  item.manufacturingDate
                    ? new Date(
                        item.manufacturingDate
                      )
                    : undefined,

                expiryDate:
                  item.expiryDate
                    ? new Date(
                        item.expiryDate
                      )
                    : undefined,

                storageLocationId:
                  item.storageLocationId,

                remarks:
                  item.remarks,
              };
            }
          ),
        });
      }

      return tx.goodsReceivedNote.findUnique({
        where: {
          id,
        },

        include: {
          project: true,
          supplier: true,
          purchaseOrder: true,

          items: {
            include: {
              material: true,
              unit: true,
            },
          },
        },
      });
    }
  );
}

// ======================================================
// CONFIRM GRN
// ======================================================

export async function confirmGrn(
  id: string,
  userId: string
) {
  return prisma.$transaction(
    async (tx) => {

      const grn =
        await tx.goodsReceivedNote.findUnique({
          where: {
            id,
          },

          include: {
            items: true,
            purchaseOrder: {
              include: {
                items: true,
              },
            },
          },
        });

      if (!grn) {
        throw new Error(
          "GRN not found"
        );
      }

      if (grn.status !== "DRAFT") {
        throw new Error(
          "Only DRAFT GRNs can be confirmed"
        );
      }

      if (grn.items.length === 0) {
        throw new Error(
          "Cannot confirm GRN without items"
        );
      }

      // ------------------------------------------------
      // Update PO received quantities
      // ------------------------------------------------

      if (grn.purchaseOrder) {

        for (const grnItem of grn.items) {

          const poItem =
            grn.purchaseOrder.items.find(
              (item) =>
                item.materialId ===
                grnItem.materialId
            );

          if (!poItem) {
            throw new Error(
              `Material ${grnItem.materialId} does not exist in PO`
            );
          }

          const newReceivedQuantity =
            new Prisma.Decimal(
              poItem.receivedQuantity
            ).add(
              new Prisma.Decimal(
                grnItem.acceptedQuantity
              )
            );

          if (
            newReceivedQuantity.gt(
              poItem.orderedQuantity
            )
          ) {
            throw new Error(
              `Received quantity exceeds ordered quantity for material ${grnItem.materialId}`
            );
          }

          await tx.purchaseOrderItem.update({
            where: {
              id: poItem.id,
            },

            data: {
              receivedQuantity:
                newReceivedQuantity,
            },
          });
        }

        // ----------------------------------------------
        // Determine PO status
        // ----------------------------------------------

        const updatedItems =
          await tx.purchaseOrderItem.findMany({
            where: {
              purchaseOrderId:
                grn.purchaseOrder.id,
            },
          });

        const fullyReceived =
          updatedItems.every(
            (item) =>
              new Prisma.Decimal(
                item.receivedQuantity
              ).gte(
                item.orderedQuantity
              )
          );

        const partiallyReceived =
          updatedItems.some(
            (item) =>
              new Prisma.Decimal(
                item.receivedQuantity
              ).gt(0)
          );

        let newStatus:
          | "FULLY_RECEIVED"
          | "PARTIALLY_RECEIVED"
          | "APPROVED";

        if (fullyReceived) {
          newStatus = "FULLY_RECEIVED";
        } else if (partiallyReceived) {
          newStatus =
            "PARTIALLY_RECEIVED";
        } else {
          newStatus = "APPROVED";
        }

        await tx.purchaseOrder.update({
          where: {
            id: grn.purchaseOrder.id,
          },

          data: {
            status: newStatus,
          },
        });
      }

      // ------------------------------------------------
      // Confirm GRN
      // ------------------------------------------------

      const confirmedGrn =
        await tx.goodsReceivedNote.update({
          where: {
            id,
          },

          data: {
            status: "CONFIRMED",
            receivedBy: userId,
          },

          include: {
            project: true,
            supplier: true,
            purchaseOrder: true,

            items: {
              include: {
                material: true,
                unit: true,
              },
            },
          },
        });

      return confirmedGrn;
    }
  );
}

// ======================================================
// REJECT GRN
// ======================================================

export async function rejectGrn(
  id: string,
  reason: string
) {
  if (!reason?.trim()) {
    throw new Error(
      "Rejection reason is required"
    );
  }

  const grn =
    await prisma.goodsReceivedNote.findUnique({
      where: {
        id,
      },
    });

  if (!grn) {
    throw new Error("GRN not found");
  }

  if (
    grn.status !== "DRAFT"
  ) {
    throw new Error(
      "Only DRAFT GRNs can be rejected"
    );
  }

  return prisma.goodsReceivedNote.update({
    where: {
      id,
    },

    data: {
      status: "REJECTED",

      remarks: reason,
    },

    include: {
      project: true,
      supplier: true,
      purchaseOrder: true,
      items: true,
    },
  });
}