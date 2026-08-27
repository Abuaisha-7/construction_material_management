import { Prisma } from "@prisma/client";

export async function generateRequestNumber(
  tx: Prisma.TransactionClient
): Promise<string> {

  const year = new Date().getFullYear();

  const prefix = `MR-${year}-`;

  const lastRequest =
    await tx.materialRequest.findFirst({
      where: {
        requestNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        requestNumber: "desc"
      },
      select: {
        requestNumber: true
      }
    });

  let nextNumber = 1;

  if (lastRequest) {
    const lastSequence =
      parseInt(
        lastRequest.requestNumber
          .replace(prefix, ""),
        10
      );

    if (!isNaN(lastSequence)) {
      nextNumber = lastSequence + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(6, "0")}`;
}

export async function generatePurchaseOrderNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const year = new Date().getFullYear();

  const lastOrder = await tx.purchaseOrder.findFirst({
    where: {
      purchaseOrderNumber: {
        startsWith: `PO-${year}-`
      }
    },
    orderBy: {
      purchaseOrderNumber: "desc"
    },
    select: {
      purchaseOrderNumber: true
    }
  });

  let nextNumber = 1;

  if (lastOrder) {
    const lastSequence = Number(
      lastOrder.purchaseOrderNumber.split("-")[2]
    );

    if (!Number.isNaN(lastSequence)) {
      nextNumber = lastSequence + 1;
    }
  }

  return `PO-${year}-${String(nextNumber).padStart(6, "0")}`;
}