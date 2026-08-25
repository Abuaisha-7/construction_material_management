import { prisma } from "../config/database";

import { PrismaClient } from "@prisma/client";
import { generateRequestNumber } from "../utils/numberGenerator";

const prisma = new PrismaClient();

interface CreateMaterialRequestInput {
  projectId: string;
  buildingId?: string;
  zoneId?: string;
  activityId?: string;
  requiredDate?: Date;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  purpose?: string;
  remarks?: string;

  items: {
    materialId: string;
    requestedQuantity: number;
    estimatedUnitPrice?: number;
    remarks?: string;
  }[];
}

interface UpdateMaterialRequestInput {
  buildingId?: string;
  zoneId?: string;
  activityId?: string;
  requiredDate?: Date;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  purpose?: string;
  remarks?: string;
}

export async function createMaterialRequest(
    userId: string,
    data: CreateMaterialRequestInput
  ) {
  
    return prisma.$transaction(async (tx) => {
  
      // --------------------------------------------------
      // Validate project
      // --------------------------------------------------
  
      const project =
        await tx.project.findUnique({
          where: {
            id: data.projectId
          }
        });
  
      if (!project) {
        throw new Error("Project not found");
      }
  
      // --------------------------------------------------
      // Validate building if supplied
      // --------------------------------------------------
  
      if (data.buildingId) {
  
        const building =
          await tx.building.findUnique({
            where: {
              id: data.buildingId
            }
          });
  
        if (!building) {
          throw new Error("Building not found");
        }
      }
  
      // --------------------------------------------------
      // Validate zone if supplied
      // --------------------------------------------------
  
      if (data.zoneId) {
  
        const zone =
          await tx.zone.findUnique({
            where: {
              id: data.zoneId
            }
          });
  
        if (!zone) {
          throw new Error("Zone not found");
        }
      }
  
      // --------------------------------------------------
      // Validate activity if supplied
      // --------------------------------------------------
  
      if (data.activityId) {
  
        const activity =
          await tx.activity.findUnique({
            where: {
              id: data.activityId
            }
          });
  
        if (!activity) {
          throw new Error("Activity not found");
        }
      }
  
      // --------------------------------------------------
      // Validate materials
      // --------------------------------------------------
  
      const materialIds =
        data.items.map(
          item => item.materialId
        );
  
      const materials =
        await tx.material.findMany({
          where: {
            id: {
              in: materialIds
            },
            isActive: true
          }
        });
  
      if (
        materials.length !==
        new Set(materialIds).size
      ) {
        throw new Error(
          "One or more materials were not found or are inactive"
        );
      }
  
      // --------------------------------------------------
      // Generate request number
      // --------------------------------------------------
  
      const requestNumber =
        await generateRequestNumber(tx);
  
      // --------------------------------------------------
      // Create request
      // --------------------------------------------------
  
      const materialRequest =
        await tx.materialRequest.create({
  
          data: {
  
            requestNumber,
  
            projectId:
              data.projectId,
  
            requestedBy:
              userId,
  
            buildingId:
              data.buildingId,
  
            zoneId:
              data.zoneId,
  
            activityId:
              data.activityId,
  
            requestDate:
              new Date(),
  
            requiredDate:
              data.requiredDate,
  
            priority:
              data.priority ?? "NORMAL",
  
            purpose:
              data.purpose,
  
            remarks:
              data.remarks,
  
            status:
              "DRAFT",
  
            items: {
  
              create:
                data.items.map(item => ({
  
                  materialId:
                    item.materialId,
  
                  requestedQuantity:
                    item.requestedQuantity,
  
                  estimatedUnitPrice:
                    item.estimatedUnitPrice,
  
                  remarks:
                    item.remarks
                }))
            }
          },
  
          include: {
  
            project: true,
  
            requester: {
              select: {
                id: true,
                fullName: true,
                email: true
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
            },
  
            building: true,
  
            zone: true,
  
            activity: true
          }
        });
  
      return materialRequest;
    });
  }

export async function getMaterialRequests(
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
    projectId?: string
  ) {
  
    const skip =
      (page - 1) * limit;
  
    const where: any = {};
  
    if (search) {
  
      where.OR = [
  
        {
          requestNumber: {
            contains: search
          }
        },
  
        {
          purpose: {
            contains: search
          }
        }
      ];
    }
  
    if (status) {
      where.status = status;
    }
  
    if (projectId) {
      where.projectId = projectId;
    }
  
    const [
      requests,
      total
    ] = await prisma.$transaction([
  
      prisma.materialRequest.findMany({
  
        where,
  
        include: {
  
          project: {
            select: {
              id: true,
              projectCode: true,
              name: true
            }
          },
  
          requester: {
            select: {
              id: true,
              fullName: true,
              email: true
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
        },
  
        orderBy: {
          createdAt: "desc"
        },
  
        skip,
  
        take: limit
      }),
  
      prisma.materialRequest.count({
        where
      })
    ]);
  
    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit)
      }
    };
  }

export async function getMaterialRequestById(
    id: string
  ) {
  
    const request =
      await prisma.materialRequest.findUnique({
  
        where: {
          id
        },
  
        include: {
  
          project: true,
  
          requester: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
  
          building: true,
  
          zone: true,
  
          activity: true,
  
          items: {
            include: {
              material: {
                include: {
                  category: true,
                  unit: true
                }
              }
            }
          },
  
          approvals: true
        }
      });
  
    if (!request) {
      throw new Error(
        "Material request not found"
      );
    }
  
    return request;
  }

export async function updateMaterialRequest(
    id: string,
    data: UpdateMaterialRequestInput
  ) {
  
    const existing =
      await prisma.materialRequest.findUnique({
        where: {
          id
        }
      });
  
    if (!existing) {
      throw new Error(
        "Material request not found"
      );
    }
  
    // Only DRAFT or RETURNED requests
    // should normally be editable.
  
    if (
      existing.status !== "DRAFT" &&
      existing.status !== "RETURNED"
    ) {
      throw new Error(
        "Only DRAFT or RETURNED requests can be updated"
      );
    }
  
    return prisma.materialRequest.update({
  
      where: {
        id
      },
  
      data: {
  
        buildingId:
          data.buildingId,
  
        zoneId:
          data.zoneId,
  
        activityId:
          data.activityId,
  
        requiredDate:
          data.requiredDate,
  
        priority:
          data.priority,
  
        purpose:
          data.purpose,
  
        remarks:
          data.remarks
      },
  
      include: {
        items: {
          include: {
            material: true
          }
        }
      }
    });
  }

export async function submitMaterialRequest(
  id: string
) {
  const request =
    await prisma.materialRequest.findUnique({
      where: {
        id
      }
    });

  if (!request) {
    throw new Error(
      "Material request not found"
    );
  }

  if (request.status !== "DRAFT") {
    throw new Error(
      "Only DRAFT requests can be submitted"
    );
  }

  return prisma.materialRequest.update({
    where: {
      id
    },

    data: {
      status: "SUBMITTED"
    },

    include: {
      items: {
        include: {
          material: true
        }
      }
    }
  });
}

export async function startMaterialRequestReview(
    id: string
  ) {
    const request =
      await prisma.materialRequest.findUnique({
        where: {
          id
        }
      });
  
    if (!request) {
      throw new Error(
        "Material request not found"
      );
    }
  
    if (request.status !== "SUBMITTED") {
      throw new Error(
        "Only SUBMITTED requests can be placed under review"
      );
    }
  
    return prisma.materialRequest.update({
      where: {
        id
      },
  
      data: {
        status: "UNDER_REVIEW"
      }
    });
  }

  export async function approveMaterialRequest(
    id: string
  ) {
    const request =
      await prisma.materialRequest.findUnique({
        where: {
          id
        },
  
        include: {
          items: true
        }
      });
  
    if (!request) {
      throw new Error(
        "Material request not found"
      );
    }
  
    // VERY IMPORTANT
    if (request.status !== "UNDER_REVIEW") {
      throw new Error(
        "Only UNDER_REVIEW requests can be approved"
      );
    }
  
    if (request.items.length === 0) {
      throw new Error(
        "Cannot approve a request without items"
      );
    }
  
    return prisma.materialRequest.update({
      where: {
        id
      },
  
      data: {
        status: "APPROVED"
      },
  
      include: {
        items: {
          include: {
            material: true
          }
        }
      }
    });
  }

export async function cancelMaterialRequest(
    id: string
  ) {
  
    const request =
      await prisma.materialRequest.findUnique({
        where: {
          id
        }
      });
  
    if (!request) {
      throw new Error(
        "Material request not found"
      );
    }
  
    if (
      request.status === "COMPLETED" ||
      request.status === "FULLY_SUPPLIED"
    ) {
      throw new Error(
        "Completed or fully supplied requests cannot be cancelled"
      );
    }
  
    return prisma.materialRequest.update({
  
      where: {
        id
      },
  
      data: {
        status: "CANCELLED"
      }
    });
  }

  export async function rejectMaterialRequest(
    id: string,
    reason: string
  ) {
    const request =
      await prisma.materialRequest.findUnique({
        where: {
          id
        }
      });
  
    if (!request) {
      throw new Error(
        "Material request not found"
      );
    }
  
    if (request.status !== "UNDER_REVIEW") {
      throw new Error(
        "Only UNDER_REVIEW requests can be rejected"
      );
    }
  
    return prisma.materialRequest.update({
      where: {
        id
      },
  
      data: {
        status: "REJECTED",
  
        remarks: reason
      },
  
      include: {
        items: {
          include: {
            material: true
          }
        }
      }
    });
  }