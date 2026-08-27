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