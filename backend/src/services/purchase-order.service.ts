import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";
import {
  generatePurchaseOrderNumber
} from "../utils/numberGenerator";

interface CreatePurchaseOrderInput {
  projectId: string;
  supplierId: string;
  materialRequestId: string;
  expectedDeliveryDate?: Date;
  currency?: string;
  remarks?: string;

  items: {
    materialId: string;
    orderedQuantity: number;
    unitPrice: number;
  }[];
}

const VAT_RATE = 0.15;

export async function createPurchaseOrder(
  data: CreatePurchaseOrderInput,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    // ==================================================
    // 1. Validate project
    // ==================================================

    const project = await tx.project.findUnique({
      where: {
        id: data.projectId,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // ==================================================
    // 2. Validate supplier
    // ==================================================

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

    // ==================================================
    // 3. Validate material request
    // ==================================================

    const materialRequest =
      await tx.materialRequest.findUnique({
        where: {
          id: data.materialRequestId,
        },
        include: {
          items: true,
        },
      });

    if (!materialRequest) {
      throw new Error("Material request not found");
    }

    // ==================================================
    // 4. Material request must be APPROVED
    // ==================================================

    if (materialRequest.status !== "APPROVED") {
      throw new Error(
        "Purchase Order can only be created from an APPROVED material request"
      );
    }

    // ==================================================
    // 5. Request must belong to project
    // ==================================================

    if (
      materialRequest.projectId !==
      data.projectId
    ) {
      throw new Error(
        "Material request does not belong to the selected project"
      );
    }

    // ==================================================
    // 6. Validate PO has items
    // ==================================================

    if (!data.items || data.items.length === 0) {
      throw new Error(
        "Purchase Order must contain at least one item"
      );
    }

    // ==================================================
    // 7. Prevent duplicate materials
    // ==================================================

    const materialIds = data.items.map(
      (item) => item.materialId
    );

    const uniqueMaterialIds =
      new Set(materialIds);

    if (
      uniqueMaterialIds.size !==
      materialIds.length
    ) {
      throw new Error(
        "The same material cannot appear more than once in a Purchase Order"
      );
    }

    // ==================================================
    // 8. Get materials from database
    // ==================================================

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
          estimatedUnitPrice: true,
        },
      });

    const materialMap = new Map(
      materials.map((material) => [
        material.id,
        material,
      ])
    );

    // ==================================================
    // 9. Create approved-request item map
    // ==================================================

    const requestItemMap = new Map(
      materialRequest.items.map((item) => [
        item.materialId,
        item,
      ])
    );

    // ==================================================
    // 10. Validate each PO item
    // ==================================================

    for (const item of data.items) {
      const material =
        materialMap.get(item.materialId);

      // Material exists
      if (!material) {
        throw new Error(
          `Material not found: ${item.materialId}`
        );
      }

      // Material active
      if (!material.isActive) {
        throw new Error(
          `Material is inactive: ${material.materialCode} - ${material.name}`
        );
      }

      // Material must be part of approved request
      const requestItem =
        requestItemMap.get(item.materialId);

      if (!requestItem) {
        throw new Error(
          `Material ${material.materialCode} is not included in the approved material request`
        );
      }

      // Quantity
      const orderedQuantity =
        new Prisma.Decimal(
          item.orderedQuantity
        );

      if (
        orderedQuantity.lessThanOrEqualTo(0)
      ) {
        throw new Error(
          `Ordered quantity for ${material.materialCode} must be greater than zero`
        );
      }

      // Approved quantity
      const approvedQuantity =
        new Prisma.Decimal(
          requestItem.approvedQuantity
        );

      if (
        orderedQuantity.greaterThan(
          approvedQuantity
        )
      ) {
        throw new Error(
          `Ordered quantity for ${material.materialCode} (${orderedQuantity.toString()}) cannot exceed approved quantity (${approvedQuantity.toString()})`
        );
      }

      // Unit price
      const unitPrice =
        new Prisma.Decimal(item.unitPrice);

      if (unitPrice.lessThan(0)) {
        throw new Error(
          `Unit price for ${material.materialCode} cannot be negative`
        );
      }
    }

    // ==================================================
    // 11. Calculate subtotal
    // ==================================================

    let subtotal =
      new Prisma.Decimal(0);

    const orderItems =
      data.items.map((item) => {
        const quantity =
          new Prisma.Decimal(
            item.orderedQuantity
          );

        const unitPrice =
          new Prisma.Decimal(
            item.unitPrice
          );

        const lineTotal =
          quantity.mul(unitPrice);

        subtotal =
          subtotal.add(lineTotal);

        return {
          materialId:
            item.materialId,

          orderedQuantity:
            quantity,

          unitPrice:
            unitPrice,
        };
      });

    // ==================================================
    // 12. Calculate VAT
    // ==================================================

    const taxAmount =
      subtotal.mul(VAT_RATE);

    // ==================================================
    // 13. Calculate total
    // ==================================================

    const totalAmount =
      subtotal.add(taxAmount);

    // ==================================================
    // 14. Generate PO number
    // ==================================================

    const purchaseOrderNumber =
      await generatePurchaseOrderNumber(tx);

    // ==================================================
    // 15. Create Purchase Order
    // ==================================================

    const purchaseOrder =
      await tx.purchaseOrder.create({
        data: {
          purchaseOrderNumber,

          projectId:
            data.projectId,

          supplierId:
            data.supplierId,

          materialRequestId:
            data.materialRequestId,

          orderDate:
            new Date(),

          expectedDeliveryDate:
            data.expectedDeliveryDate,

          status:
            "DRAFT",

          // IMPORTANT:
          // These values come from backend calculation.
          subtotal,

          taxAmount,

          totalAmount,

          currency:
            data.currency ?? "ETB",

          remarks:
            data.remarks,

          createdBy:
            userId,

          items: {
            create: orderItems,
          },
        },

        include: {
          project: true,

          supplier: true,

          materialRequest: {
            include: {
              items: {
                include: {
                  material: true,
                },
              },
            },
          },

          items: {
            include: {
              material: true,
            },
          },
        },
      });

    return purchaseOrder;
  });
}

export async function getPurchaseOrders(params: {
    page: number;
    limit: number;
    search?: string;
    status?: any;
    projectId?: string;
    supplierId?: string;
  }) {
    const {
      page,
      limit,
      search,
      status,
      projectId,
      supplierId
    } = params;
  
    const skip = (page - 1) * limit;
  
    const where: any = {};
  
    if (status) {
      where.status = status;
    }
  
    if (projectId) {
      where.projectId = projectId;
    }
  
    if (supplierId) {
      where.supplierId = supplierId;
    }
  
    if (search) {
      where.OR = [
        {
          purchaseOrderNumber: {
            contains: search
          }
        },
        {
          supplier: {
            companyName: {
              contains: search
            }
          }
        }
      ];
    }
  
    const [purchaseOrders, total] =
      await prisma.$transaction([
        prisma.purchaseOrder.findMany({
          where,
  
          include: {
            project: true,
            supplier: true,
  
            items: {
              include: {
                material: true
              }
            }
          },
  
          orderBy: {
            createdAt: "desc"
          },
  
          skip,
          take: limit
        }),
  
        prisma.purchaseOrder.count({
          where
        })
      ]);
  
    return {
      purchaseOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

export async function getPurchaseOrderById(
    id: string
  ) {
    const purchaseOrder =
      await prisma.purchaseOrder.findUnique({
  
        where: {
          id
        },
  
        include: {
          project: true,
  
          supplier: true,
  
          materialRequest: {
            include: {
              items: {
                include: {
                  material: true
                }
              }
            }
          },
  
          items: {
            include: {
              material: {
                include: {
                  category: true,
                  unit: true
                }
              }
            }
          }
        }
      });
  
    if (!purchaseOrder) {
      throw new Error(
        "Purchase order not found"
      );
    }
  
    return purchaseOrder;
  }

  /**
   * Submit Purchase Order
   *
   * DRAFT → PENDING_APPROVAL
   */
  export async function submitPurchaseOrder(
    id: string,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const purchaseOrder =
        await tx.purchaseOrder.findUnique({
          where: {
            id,
          },
        });
  
      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }
  
      // Only DRAFT can be submitted
      if (purchaseOrder.status !== "DRAFT") {
        throw new Error(
          `Purchase order cannot be submitted from ${purchaseOrder.status} status`
        );
      }
  
      // Optional: only creator can submit
      if (
        purchaseOrder.createdBy &&
        purchaseOrder.createdBy !== userId
      ) {
        throw new Error(
          "Only the purchase order creator can submit this purchase order"
        );
      }
  
      // Make sure PO has items
      const itemCount =
        await tx.purchaseOrderItem.count({
          where: {
            purchaseOrderId: id,
          },
        });
  
      if (itemCount === 0) {
        throw new Error(
          "Cannot submit a purchase order without items"
        );
      }
  
      const updatedPO =
        await tx.purchaseOrder.update({
          where: {
            id,
          },
          data: {
            status: "PENDING_APPROVAL",
          },
          include: {
            project: true,
            supplier: true,
            items: {
              include: {
                material: true,
              },
            },
            materialRequest: true,
          },
        });
  
      return updatedPO;
    });
  }
  
  
  /**
   * Approve Purchase Order
   *
   * PENDING_APPROVAL → APPROVED
   */
  export async function approvePurchaseOrder(
    id: string,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const purchaseOrder =
        await tx.purchaseOrder.findUnique({
          where: {
            id,
          },
          include: {
            items: true,
          },
        });
  
      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }
  
      // VERY IMPORTANT
      // Cannot approve DRAFT directly
      if (
        purchaseOrder.status !==
        "PENDING_APPROVAL"
      ) {
        throw new Error(
          "Only PENDING_APPROVAL purchase orders can be approved"
        );
      }
  
      if (purchaseOrder.items.length === 0) {
        throw new Error(
          "Cannot approve a purchase order without items"
        );
      }
  
      // Make sure totals are valid
      if (
        new Prisma.Decimal(
          purchaseOrder.totalAmount
        ).lessThanOrEqualTo(0)
      ) {
        throw new Error(
          "Purchase order total amount must be greater than zero"
        );
      }
  
      const updatedPO =
        await tx.purchaseOrder.update({
          where: {
            id,
          },
          data: {
            status: "APPROVED",
          },
          include: {
            project: true,
            supplier: true,
            items: {
              include: {
                material: true,
              },
            },
            materialRequest: true,
          },
        });
  
      return updatedPO;
    });
  }
  
  
  /**
   * Cancel Purchase Order
   *
   * DRAFT
   * PENDING_APPROVAL
   * APPROVED
   * PARTIALLY_RECEIVED
   *
   * → CANCELLED
   */
  export async function cancelPurchaseOrder(
    id: string,
    userId: string,
    reason: string
  ) {
    return prisma.$transaction(async (tx) => {
      const purchaseOrder =
        await tx.purchaseOrder.findUnique({
          where: {
            id,
          },
        });
  
      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }
  
      const cancellableStatuses = [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "PARTIALLY_RECEIVED",
      ] as const;
  
      if (
        !cancellableStatuses.includes(
          purchaseOrder.status
        )
      ) {
        throw new Error(
          `Purchase order cannot be cancelled from ${purchaseOrder.status} status`
        );
      }
  
      if (!reason || !reason.trim()) {
        throw new Error(
          "Cancellation reason is required"
        );
      }
  
      const updatedPO =
        await tx.purchaseOrder.update({
          where: {
            id,
          },
          data: {
            status: "CANCELLED",
  
            remarks: purchaseOrder.remarks
              ? `${purchaseOrder.remarks}\nCancellation reason: ${reason.trim()}`
              : `Cancellation reason: ${reason.trim()}`,
          },
          include: {
            project: true,
            supplier: true,
            items: {
              include: {
                material: true,
              },
            },
            materialRequest: true,
          },
        });
  
      return updatedPO;
    });
  }
  
  
  /**
   * Close Purchase Order
   *
   * FULLY_RECEIVED → CLOSED
   */
  export async function closePurchaseOrder(
    id: string,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const purchaseOrder =
        await tx.purchaseOrder.findUnique({
          where: {
            id,
          },
          include: {
            items: true,
          },
        });
  
      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }
  
      // VERY IMPORTANT
      // Only FULLY_RECEIVED can be closed
      if (
        purchaseOrder.status !==
        "FULLY_RECEIVED"
      ) {
        throw new Error(
          "Only FULLY_RECEIVED purchase orders can be closed"
        );
      }
  
      if (purchaseOrder.items.length === 0) {
        throw new Error(
          "Cannot close a purchase order without items"
        );
      }
  
      // Double-check quantities
      for (const item of purchaseOrder.items) {
        const ordered =
          new Prisma.Decimal(
            item.orderedQuantity
          );
  
        const received =
          new Prisma.Decimal(
            item.receivedQuantity
          );
  
        if (received.lessThan(ordered)) {
          throw new Error(
            `Material ${item.materialId} has not been fully received`
          );
        }
      }
  
      const updatedPO =
        await tx.purchaseOrder.update({
          where: {
            id,
          },
          data: {
            status: "CLOSED",
          },
          include: {
            project: true,
            supplier: true,
            items: {
              include: {
                material: true,
              },
            },
            materialRequest: true,
          },
        });
  
      return updatedPO;
    });
  }