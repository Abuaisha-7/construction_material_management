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

    // --------------------------------------------------
    // 1. Validate project
    // --------------------------------------------------

    const project = await tx.project.findUnique({
      where: {
        id: data.projectId
      }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // --------------------------------------------------
    // 2. Validate supplier
    // --------------------------------------------------

    const supplier = await tx.supplier.findUnique({
      where: {
        id: data.supplierId
      }
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    if (!supplier.isActive) {
      throw new Error("Supplier is inactive");
    }

    // --------------------------------------------------
    // 3. Validate material request
    // --------------------------------------------------

    const materialRequest =
      await tx.materialRequest.findUnique({
        where: {
          id: data.materialRequestId
        },
        include: {
          items: true
        }
      });

    if (!materialRequest) {
      throw new Error("Material request not found");
    }

    // --------------------------------------------------
    // 4. Material request must be approved
    // --------------------------------------------------

    if (materialRequest.status !== "APPROVED") {
      throw new Error(
        "Purchase Order can only be created from an APPROVED material request"
      );
    }

    // --------------------------------------------------
    // 5. Ensure request belongs to project
    // --------------------------------------------------

    if (materialRequest.projectId !== data.projectId) {
      throw new Error(
        "Material request does not belong to the selected project"
      );
    }

    // --------------------------------------------------
    // 6. Validate items
    // --------------------------------------------------

    const materialIds = data.items.map(
      item => item.materialId
    );

    const materials = await tx.material.findMany({
      where: {
        id: {
          in: materialIds
        },
        isActive: true
      }
    });

    if (materials.length !== materialIds.length) {
      throw new Error(
        "One or more materials are invalid or inactive"
      );
    }

    // --------------------------------------------------
    // 7. Validate requested quantities
    // --------------------------------------------------

    let subtotal = new Prisma.Decimal(0);

    const orderItems = data.items.map(item => {

      const quantity =
        new Prisma.Decimal(item.orderedQuantity);

      const unitPrice =
        new Prisma.Decimal(item.unitPrice);

      const lineTotal =
        quantity.mul(unitPrice);

      subtotal = subtotal.add(lineTotal);

      return {
        materialId: item.materialId,
        orderedQuantity: quantity,
        unitPrice
      };
    });

    // --------------------------------------------------
    // 8. Calculate VAT
    // --------------------------------------------------

    const taxAmount =
      subtotal.mul(VAT_RATE);

    // --------------------------------------------------
    // 9. Calculate total
    // --------------------------------------------------

    const totalAmount =
      subtotal.add(taxAmount);

    // --------------------------------------------------
    // 10. Generate PO number
    // --------------------------------------------------

    const purchaseOrderNumber =
      await generatePurchaseOrderNumber(tx);

    // --------------------------------------------------
    // 11. Create PO
    // --------------------------------------------------

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
            create: orderItems
          }
        },

        include: {
          project: true,
          supplier: true,
          items: {
            include: {
              material: true
            }
          },
          materialRequest: true
        }
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