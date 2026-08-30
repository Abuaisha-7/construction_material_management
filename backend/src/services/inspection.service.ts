import { Prisma } from "@prisma/client";

import {prisma} from "../config/database";
import {
  CreateInspectionInput,
  UpdateInspectionInput,
  CompleteInspectionInput,
} from "../schemas/inspection.schema";

import {
  generateInspectionNumber,
} from "../utils/numberGenerator";


/**
 * ============================================================
 * CREATE INSPECTION
 * ============================================================
 */

export async function createInspection(
  data: CreateInspectionInput,
  userId: string
) {

  return prisma.$transaction(async (tx) => {

    // --------------------------------------------------------
    // 1. Validate GRN
    // --------------------------------------------------------

    const grn =
      await tx.goodsReceivedNote.findUnique({
        where: {
          id: data.grnId,
        },
        include: {
          items: true,
          purchaseOrder: true,
          supplier: true,
          project: true,
        },
      });

    if (!grn) {
      throw new Error("Goods Received Note not found");
    }

    // --------------------------------------------------------
    // 2. GRN must be awaiting inspection
    // --------------------------------------------------------

    if (grn.status !== "AWAITING_INSPECTION") {
      throw new Error(
        `Inspection can only be created for GRN with status AWAITING_INSPECTION. Current status: ${grn.status}`
      );
    }

    // --------------------------------------------------------
    // 3. Prevent duplicate inspection
    // --------------------------------------------------------

    const existingInspection =
      await tx.materialInspection.findFirst({
        where: {
          grnId: data.grnId,
        },
      });

    if (existingInspection) {
      throw new Error(
        `An inspection already exists for this GRN: ${existingInspection.inspectionNumber}`
      );
    }

    // --------------------------------------------------------
    // 4. GRN must contain items
    // --------------------------------------------------------

    if (grn.items.length === 0) {
      throw new Error(
        "Cannot create inspection for a GRN without items"
      );
    }

    // --------------------------------------------------------
    // 5. Validate inspection items
    // --------------------------------------------------------

    const grnItemMap = new Map(
      grn.items.map((item) => [
        item.id,
        item,
      ])
    );

    for (const item of data.items) {

      const grnItem =
        grnItemMap.get(item.grnItemId);

      if (!grnItem) {
        throw new Error(
          `GRN item not found: ${item.grnItemId}`
        );
      }

      const deliveredQuantity =
        new Prisma.Decimal(
          grnItem.deliveredQuantity
        );

      const quantityInspected =
        new Prisma.Decimal(
          item.quantityInspected ?? 0
        );

      const accepted =
        new Prisma.Decimal(
          item.quantityAccepted ?? 0
        );

      const conditionallyAccepted =
        new Prisma.Decimal(
          item.quantityConditionallyAccepted ?? 0
        );

      const quarantined =
        new Prisma.Decimal(
          item.quantityQuarantined ?? 0
        );

      const rejected =
        new Prisma.Decimal(
          item.quantityRejected ?? 0
        );

      // ------------------------------------------------------
      // Quantity inspected cannot exceed delivered quantity
      // ------------------------------------------------------

      if (
        quantityInspected.gt(
          deliveredQuantity
        )
      ) {
        throw new Error(
          `Inspected quantity cannot exceed delivered quantity for material ${grnItem.materialId}`
        );
      }

      // ------------------------------------------------------
      // Result quantities cannot exceed inspected quantity
      // ------------------------------------------------------

      const resultTotal =
        accepted
          .add(conditionallyAccepted)
          .add(quarantined)
          .add(rejected);

      if (
        resultTotal.gt(quantityInspected)
      ) {
        throw new Error(
          `Accepted, conditionally accepted, quarantined and rejected quantities cannot exceed inspected quantity for GRN item ${grnItem.id}`
        );
      }
    }

    // --------------------------------------------------------
    // 6. Generate inspection number
    // --------------------------------------------------------

    const inspectionNumber =
      await generateInspectionNumber(tx);

    // --------------------------------------------------------
    // 7. Create inspection
    // --------------------------------------------------------

    const inspection =
      await tx.materialInspection.create({
        data: {
          inspectionNumber,

          grnId:
            data.grnId,

          inspectionDate:
            data.inspectionDate ??
            new Date(),

          inspectorId:
            userId,

          status:
            "PENDING",

          remarks:
            data.remarks,

          correctiveAction:
            data.correctiveAction,

          items: {
            create: data.items.map((item) => ({
              grnItemId:
                item.grnItemId,

              quantityInspected:
                item.quantityInspected !== undefined
                  ? new Prisma.Decimal(
                      item.quantityInspected
                    )
                  : null,

              quantityAccepted:
                new Prisma.Decimal(
                  item.quantityAccepted ?? 0
                ),

              quantityConditionallyAccepted:
                new Prisma.Decimal(
                  item.quantityConditionallyAccepted ?? 0
                ),

              quantityQuarantined:
                new Prisma.Decimal(
                  item.quantityQuarantined ?? 0
                ),

              quantityRejected:
                new Prisma.Decimal(
                  item.quantityRejected ?? 0
                ),

              specification:
                item.specification,

              requiredStandard:
                item.requiredStandard,

              certificateNumber:
                item.certificateNumber,

              testRequired:
                item.testRequired ?? false,

              testResult:
                item.testResult,

              remarks:
                item.remarks,

              materialId:
                item.materialId,
            })),
          },
        },

        include: {
          grn: {
            include: {
              supplier: true,
              project: true,
              purchaseOrder: true,
            },
          },

          inspector: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          items: {
            include: {
              grnItem: {
                include: {
                  material: true,
                  unit: true,
                  storageLocation: true,
                },
              },

              material: true,
            },
          },
        },
      });

    return inspection;
  });
}


/**
 * ============================================================
 * GET ALL INSPECTIONS
 * ============================================================
 */

export async function getInspections(params?: {
  page?: number;
  limit?: number;
  status?: string;
  decision?: string;
  grnId?: string;
  inspectorId?: string;
}) {

  const page =
    Math.max(params?.page ?? 1, 1);

  const limit =
    Math.min(
      Math.max(params?.limit ?? 20, 1),
      100
    );

  const skip =
    (page - 1) * limit;

  const where: Prisma.MaterialInspectionWhereInput = {};

  if (params?.status) {
    where.status =
      params.status as any;
  }

  if (params?.decision) {
    where.decision =
      params.decision as any;
  }

  if (params?.grnId) {
    where.grnId =
      params.grnId;
  }

  if (params?.inspectorId) {
    where.inspectorId =
      params.inspectorId;
  }

  const [
    inspections,
    total,
  ] =
    await prisma.$transaction([
      prisma.materialInspection.findMany({
        where,

        include: {
          grn: {
            include: {
              supplier: true,
              project: true,
              purchaseOrder: true,
            },
          },

          inspector: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          items: {
            include: {
              grnItem: {
                include: {
                  material: true,
                  unit: true,
                  storageLocation: true,
                },
              },
            },
          },
        },

        orderBy: {
          inspectionDate: "desc",
        },

        skip,

        take: limit,
      }),

      prisma.materialInspection.count({
        where,
      }),
    ]);

  return {
    inspections,
    pagination: {
      page,
      limit,
      total,
      totalPages:
        Math.ceil(total / limit),
    },
  };
}


/**
 * ============================================================
 * GET INSPECTION BY ID
 * ============================================================
 */

export async function getInspectionById(
  id: string
) {

  const inspection =
    await prisma.materialInspection.findUnique({
      where: {
        id,
      },

      include: {
        grn: {
          include: {
            supplier: true,
            project: true,
            purchaseOrder: true,
            items: {
              include: {
                material: true,
                unit: true,
                storageLocation: true,
              },
            },
          },
        },

        inspector: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },

        items: {
          include: {
            grnItem: {
              include: {
                material: true,
                unit: true,
                storageLocation: true,
              },
            },

            Material: true,
          },
        },
      },
    });

  if (!inspection) {
    throw new Error(
      "Material inspection not found"
    );
  }

  return inspection;
}


/**
 * ============================================================
 * START INSPECTION
 * PENDING → IN_PROGRESS
 * ============================================================
 */

export async function startInspection(
  id: string
) {

  const inspection =
    await prisma.materialInspection.findUnique({
      where: {
        id,
      },
    });

  if (!inspection) {
    throw new Error(
      "Material inspection not found"
    );
  }

  if (inspection.status !== "PENDING") {
    throw new Error(
      "Only PENDING inspections can be started"
    );
  }

  return prisma.materialInspection.update({
    where: {
      id,
    },

    data: {
      status: "IN_PROGRESS",
    },

    include: {
      items: {
        include: {
          grnItem: {
            include: {
              material: true,
              unit: true,
            },
          },
        },
      },
    },
  });
}


/**
 * ============================================================
 * UPDATE INSPECTION
 * ============================================================
 */

export async function updateInspection(
  id: string,
  data: UpdateInspectionInput
) {

  return prisma.$transaction(async (tx) => {

    const inspection =
      await tx.materialInspection.findUnique({
        where: {
          id,
        },

        include: {
          grn: {
            include: {
              items: true,
            },
          },
        },
      });

    if (!inspection) {
      throw new Error(
        "Material inspection not found"
      );
    }

    if (
      inspection.status === "COMPLETED"
    ) {
      throw new Error(
        "Completed inspections cannot be modified"
      );
    }

    if (data.items) {

      const grnItemMap = new Map(
        inspection.grn.items.map((item) => [
          item.id,
          item,
        ])
      );

      for (const item of data.items) {

        const grnItem =
          grnItemMap.get(item.grnItemId);

        if (!grnItem) {
          throw new Error(
            `GRN item not found: ${item.grnItemId}`
          );
        }

        const inspected =
          new Prisma.Decimal(
            item.quantityInspected ?? 0
          );

        const delivered =
          new Prisma.Decimal(
            grnItem.deliveredQuantity
          );

        if (inspected.gt(delivered)) {
          throw new Error(
            "Inspected quantity cannot exceed delivered quantity"
          );
        }

        const resultTotal =
          new Prisma.Decimal(
            item.quantityAccepted ?? 0
          )
            .add(
              new Prisma.Decimal(
                item.quantityConditionallyAccepted ?? 0
              )
            )
            .add(
              new Prisma.Decimal(
                item.quantityQuarantined ?? 0
              )
            )
            .add(
              new Prisma.Decimal(
                item.quantityRejected ?? 0
              )
            );

        if (resultTotal.gt(inspected)) {
          throw new Error(
            "Inspection result quantities cannot exceed inspected quantity"
          );
        }
      }

      // Delete old items and recreate them.
      await tx.inspectionItem.deleteMany({
        where: {
          inspectionId: id,
        },
      });
    }

    const updated =
      await tx.materialInspection.update({
        where: {
          id,
        },

        data: {
          inspectionDate:
            data.inspectionDate,

          remarks:
            data.remarks,

          correctiveAction:
            data.correctiveAction,

          ...(data.items
            ? {
                items: {
                  create: data.items.map(
                    (item) => ({
                      grnItemId:
                        item.grnItemId,

                      quantityInspected:
                        item.quantityInspected !== undefined
                          ? new Prisma.Decimal(
                              item.quantityInspected
                            )
                          : null,

                      quantityAccepted:
                        new Prisma.Decimal(
                          item.quantityAccepted ?? 0
                        ),

                      quantityConditionallyAccepted:
                        new Prisma.Decimal(
                          item.quantityConditionallyAccepted ?? 0
                        ),

                      quantityQuarantined:
                        new Prisma.Decimal(
                          item.quantityQuarantined ?? 0
                        ),

                      quantityRejected:
                        new Prisma.Decimal(
                          item.quantityRejected ?? 0
                        ),

                      specification:
                        item.specification,

                      requiredStandard:
                        item.requiredStandard,

                      certificateNumber:
                        item.certificateNumber,

                      testRequired:
                        item.testRequired ?? false,

                      testResult:
                        item.testResult,

                      remarks:
                        item.remarks,

                      materialId:
                        item.materialId,
                    })
                  ),
                },
              }
            : {}),
        },

        include: {
          items: {
            include: {
              grnItem: {
                include: {
                  material: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

    return updated;
  });
}


/**
 * ============================================================
 * COMPLETE INSPECTION
 * IN_PROGRESS → COMPLETED
 * ============================================================
 */

export async function completeInspection(
  id: string,
  data: CompleteInspectionInput
) {

  return prisma.$transaction(async (tx) => {

    // --------------------------------------------------------
    // 1. Load inspection
    // --------------------------------------------------------

    const inspection =
      await tx.materialInspection.findUnique({
        where: {
          id,
        },

        include: {
          items: true,
          grn: {
            include: {
              items: true,
            },
          },
        },
      });

    if (!inspection) {
      throw new Error(
        "Material inspection not found"
      );
    }

    // --------------------------------------------------------
    // 2. Must be IN_PROGRESS
    // --------------------------------------------------------

    if (
      inspection.status !== "IN_PROGRESS"
    ) {
      throw new Error(
        "Only IN_PROGRESS inspections can be completed"
      );
    }

    // --------------------------------------------------------
    // 3. Must contain items
    // --------------------------------------------------------

    if (inspection.items.length === 0) {
      throw new Error(
        "Cannot complete inspection without items"
      );
    }

    // --------------------------------------------------------
    // 4. Validate inspection quantities
    // --------------------------------------------------------

    for (const item of inspection.items) {

      const inspected =
        new Prisma.Decimal(
          item.quantityInspected ?? 0
        );

      const accepted =
        new Prisma.Decimal(
          item.quantityAccepted
        );

      const conditionallyAccepted =
        new Prisma.Decimal(
          item.quantityConditionallyAccepted
        );

      const quarantined =
        new Prisma.Decimal(
          item.quantityQuarantined
        );

      const rejected =
        new Prisma.Decimal(
          item.quantityRejected
        );

      const resultTotal =
        accepted
          .add(conditionallyAccepted)
          .add(quarantined)
          .add(rejected);

      if (resultTotal.gt(inspected)) {
        throw new Error(
          `Inspection result quantities exceed inspected quantity for item ${item.id}`
        );
      }
    }

    // --------------------------------------------------------
    // 5. Validate decision
    // --------------------------------------------------------

    if (!data.decision) {
      throw new Error(
        "Inspection decision is required"
      );
    }

    // --------------------------------------------------------
    // 6. Update inspection
    // --------------------------------------------------------

    const completed =
      await tx.materialInspection.update({
        where: {
          id,
        },

        data: {
          status:
            "COMPLETED",

          decision:
            data.decision,

          remarks:
            data.remarks ??
            inspection.remarks,

          correctiveAction:
            data.correctiveAction ??
            inspection.correctiveAction,
        },

        include: {
          grn: {
            include: {
              supplier: true,
              project: true,
              purchaseOrder: true,
            },
          },

          inspector: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          items: {
            include: {
              grnItem: {
                include: {
                  material: true,
                  unit: true,
                  storageLocation: true,
                },
              },
            },
          },
        },
      });

    // --------------------------------------------------------
    // 7. Update GRN status
    // --------------------------------------------------------

    let grnStatus:
      | "PARTIALLY_ACCEPTED"
      | "ACCEPTED"
      | "REJECTED";

    switch (data.decision) {

      case "ACCEPTED":
        grnStatus = "ACCEPTED";
        break;

      case "PARTIALLY_ACCEPTED":
        grnStatus = "PARTIALLY_ACCEPTED";
        break;

      case "CONDITIONALLY_ACCEPTED":
        grnStatus = "PARTIALLY_ACCEPTED";
        break;

      case "REJECTED":
        grnStatus = "REJECTED";
        break;

      case "QUARANTINED":
        grnStatus = "REJECTED";
        break;

      default:
        throw new Error(
          "Invalid inspection decision"
        );
    }

    await tx.goodsReceivedNote.update({
      where: {
        id: inspection.grnId,
      },

      data: {
        status: grnStatus,
      },
    });

    return completed;
  });
}
