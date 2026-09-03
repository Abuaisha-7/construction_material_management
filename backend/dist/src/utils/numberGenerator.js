"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRequestNumber = generateRequestNumber;
exports.generatePurchaseOrderNumber = generatePurchaseOrderNumber;
exports.generateGrnNumber = generateGrnNumber;
exports.generateInspectionNumber = generateInspectionNumber;
exports.generateQuarantineNumber = generateQuarantineNumber;
exports.generateDispositionNumber = generateDispositionNumber;
exports.generateInventoryTransactionNumber = generateInventoryTransactionNumber;
exports.generateMaterialIssueNumber = generateMaterialIssueNumber;
exports.generateReturnNumber = generateReturnNumber;
exports.generateCountNumber = generateCountNumber;
async function generateRequestNumber(tx) {
    const year = new Date().getFullYear();
    const prefix = `MR-${year}-`;
    const lastRequest = await tx.materialRequest.findFirst({
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
        const lastSequence = parseInt(lastRequest.requestNumber
            .replace(prefix, ""), 10);
        if (!isNaN(lastSequence)) {
            nextNumber = lastSequence + 1;
        }
    }
    return `${prefix}${String(nextNumber).padStart(6, "0")}`;
}
async function generatePurchaseOrderNumber(tx) {
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
        const lastSequence = Number(lastOrder.purchaseOrderNumber.split("-")[2]);
        if (!Number.isNaN(lastSequence)) {
            nextNumber = lastSequence + 1;
        }
    }
    return `PO-${year}-${String(nextNumber).padStart(6, "0")}`;
}
async function generateGrnNumber(tx) {
    const year = new Date().getFullYear();
    const lastGrn = await tx.goodsReceivedNote.findFirst({
        where: {
            grnNumber: {
                startsWith: `GRN-${year}-`,
            },
        },
        orderBy: {
            grnNumber: "desc",
        },
        select: {
            grnNumber: true,
        },
    });
    let sequence = 1;
    if (lastGrn) {
        const lastSequence = parseInt(lastGrn.grnNumber.split("-")[2], 10);
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }
    return `GRN-${year}-${sequence
        .toString()
        .padStart(6, "0")}`;
}
async function generateInspectionNumber(tx) {
    const year = new Date().getFullYear();
    const prefix = `INS-${year}-`;
    const lastInspection = await tx.materialInspection.findFirst({
        where: {
            inspectionNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            inspectionNumber: "desc",
        },
        select: {
            inspectionNumber: true,
        },
    });
    let nextNumber = 1;
    if (lastInspection) {
        const lastNumber = Number(lastInspection.inspectionNumber.replace(prefix, ""));
        if (!Number.isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }
    return `${prefix}${String(nextNumber).padStart(6, "0")}`;
}
async function generateQuarantineNumber(tx) {
    const year = new Date().getFullYear();
    const lastQuarantine = await tx.materialQuarantine.findFirst({
        where: {
            quarantineNumber: {
                startsWith: `QTN-${year}-`,
            },
        },
        orderBy: {
            quarantineNumber: "desc",
        },
        select: {
            quarantineNumber: true,
        },
    });
    let sequence = 1;
    if (lastQuarantine) {
        const lastSequence = Number(lastQuarantine.quarantineNumber.split("-")[2]);
        if (!Number.isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }
    return `QTN-${year}-${String(sequence).padStart(6, "0")}`;
}
async function generateDispositionNumber(tx) {
    const year = new Date().getFullYear();
    const last = await tx.materialDisposition.findFirst({
        where: {
            dispositionNumber: {
                startsWith: `MD-${year}-`,
            },
        },
        orderBy: {
            dispositionNumber: "desc",
        },
        select: {
            dispositionNumber: true,
        },
    });
    let sequence = 1;
    if (last) {
        const parts = last.dispositionNumber.split("-");
        sequence = Number(parts[2]) + 1;
    }
    return `MD-${year}-${String(sequence).padStart(6, "0")}`;
}
;
async function generateInventoryTransactionNumber(tx) {
    const year = new Date().getFullYear();
    const prefix = `TXN-${year}-`;
    const lastTransaction = await tx.inventoryTransaction.findFirst({
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
        const lastSequence = Number(lastTransaction.transactionNumber.substring(prefix.length));
        if (!Number.isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }
    return `${prefix}${String(sequence).padStart(6, "0")}`;
}
async function generateMaterialIssueNumber(tx) {
    const year = new Date().getFullYear();
    const lastIssue = await tx.materialIssue.findFirst({
        where: {
            issueNumber: {
                startsWith: `MI-${year}-`,
            },
        },
        orderBy: {
            issueNumber: "desc",
        },
        select: {
            issueNumber: true,
        },
    });
    let nextNumber = 1;
    if (lastIssue) {
        const parts = lastIssue.issueNumber.split("-");
        nextNumber =
            parseInt(parts[2], 10) + 1;
    }
    return `MI-${year}-${String(nextNumber).padStart(6, "0")}`;
}
async function generateReturnNumber(tx) {
    const year = new Date().getFullYear();
    const lastReturn = await tx.materialReturn.findFirst({
        where: {
            returnNumber: {
                startsWith: `MR-${year}-`,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            returnNumber: true,
        },
    });
    let sequence = 1;
    if (lastReturn) {
        const match = lastReturn.returnNumber.match(/-(\d+)$/);
        if (match) {
            sequence = Number(match[1]) + 1;
        }
    }
    return `MR-${year}-${String(sequence).padStart(6, "0")}`;
}
async function generateCountNumber(tx) {
    const year = new Date().getFullYear();
    const lastCount = await tx.stockCount.findFirst({
        where: {
            countNumber: {
                startsWith: `SC-${year}-`,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            countNumber: true,
        },
    });
    let sequence = 1;
    if (lastCount) {
        const match = lastCount.countNumber.match(/-(\d+)$/);
        if (match) {
            sequence =
                Number(match[1]) + 1;
        }
    }
    return `SC-${year}-${String(sequence).padStart(6, "0")}`;
}
