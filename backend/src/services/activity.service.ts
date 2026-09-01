import {prisma} from "../config/database";
import { ActivityStatus } from "@prisma/client";

interface CreateActivityData {
  projectId: string;
  buildingId?: string | null;
  zoneId?: string | null;
  code?: string | null;
  name: string;
  description?: string | null;
  status?: ActivityStatus;
}

interface UpdateActivityData {
  buildingId?: string | null;
  zoneId?: string | null;
  code?: string | null;
  name?: string;
  description?: string | null;
  status?: ActivityStatus;
}

/**
 * Create Activity
 */
export async function createActivity(data: CreateActivityData) {
  const {
    projectId,
    buildingId,
    zoneId,
    code,
    name,
    description,
    status,
  } = data;

  // --------------------------------------------------
  // 1. Verify Project
  // --------------------------------------------------
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // --------------------------------------------------
  // 2. Verify Building
  // --------------------------------------------------
  if (buildingId) {
    const building = await prisma.building.findUnique({
      where: {
        id: buildingId,
      },
    });

    if (!building) {
      throw new Error("Building not found");
    }

    if (building.projectId !== projectId) {
      throw new Error(
        "Building does not belong to the selected project"
      );
    }
  }

  // --------------------------------------------------
  // 3. Verify Zone
  // --------------------------------------------------
  if (zoneId) {
    const zone = await prisma.zone.findUnique({
      where: {
        id: zoneId,
      },
    });

    if (!zone) {
      throw new Error("Zone not found");
    }

    if (zone.projectId !== projectId) {
      throw new Error(
        "Zone does not belong to the selected project"
      );
    }

    // If both building and zone are supplied,
    // make sure the zone belongs to that building.
    if (buildingId && zone.buildingId !== buildingId) {
      throw new Error(
        "Zone does not belong to the selected building"
      );
    }
  }

  // --------------------------------------------------
  // 4. Check duplicate Activity code
  // --------------------------------------------------
  if (code) {
    const existingActivity =
      await prisma.activity.findFirst({
        where: {
          projectId,
          code,
        },
      });

    if (existingActivity) {
      throw new Error(
        `Activity code '${code}' already exists in this project`
      );
    }
  }

  // --------------------------------------------------
  // 5. Create Activity
  // --------------------------------------------------
  return prisma.activity.create({
    data: {
      projectId,
      buildingId: buildingId ?? null,
      zoneId: zoneId ?? null,
      code: code ?? null,
      name,
      description: description ?? null,
      status: status ?? ActivityStatus.NOT_STARTED,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      building: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      zone: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function getActivities(
    projectId?: string,
    buildingId?: string,
    zoneId?: string,
    status?: ActivityStatus
  ) {
    return prisma.activity.findMany({
      where: {
        ...(projectId && {
          projectId,
        }),
  
        ...(buildingId && {
          buildingId,
        }),
  
        ...(zoneId && {
          zoneId,
        }),
  
        ...(status && {
          status,
        }),
      },
  
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
  
        building: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
  
        zone: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
  
        _count: {
          select: {
            materialIssues: true,
            materialRequests: true,
            consumption: true,
            wastage: true,
          },
        },
      },
  
      orderBy: {
        createdAt: "desc",
      },
    });
  }

export async function getActivityById(id: string) {
    const activity = await prisma.activity.findUnique({
      where: {
        id,
      },
  
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
  
        building: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
  
        zone: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
  
        materialIssues: {
          orderBy: {
            createdAt: "desc",
          },
  
          select: {
            id: true,
            issueNumber: true,
            issueDate: true,
            status: true,
          },
        },
  
        _count: {
          select: {
            materialIssues: true,
            materialRequests: true,
            consumption: true,
            wastage: true,
          },
        },
      },
    });
  
    if (!activity) {
      throw new Error("Activity not found");
    }
  
    return activity;
  }

export async function updateActivity(
    id: string,
    data: UpdateActivityData
  ) {
    const existingActivity =
      await prisma.activity.findUnique({
        where: {
          id,
        },
      });
  
    if (!existingActivity) {
      throw new Error("Activity not found");
    }
  
    // --------------------------------------------------
    // Validate Building
    // --------------------------------------------------
    if (data.buildingId !== undefined) {
      if (data.buildingId) {
        const building = await prisma.building.findUnique({
          where: {
            id: data.buildingId,
          },
        });
  
        if (!building) {
          throw new Error("Building not found");
        }
  
        if (
          building.projectId !== existingActivity.projectId
        ) {
          throw new Error(
            "Building does not belong to this activity's project"
          );
        }
      }
    }
  
    // --------------------------------------------------
    // Determine building for zone validation
    // --------------------------------------------------
    const targetBuildingId =
      data.buildingId !== undefined
        ? data.buildingId
        : existingActivity.buildingId;
  
    // --------------------------------------------------
    // Validate Zone
    // --------------------------------------------------
    if (data.zoneId !== undefined) {
      if (data.zoneId) {
        const zone = await prisma.zone.findUnique({
          where: {
            id: data.zoneId,
          },
        });
  
        if (!zone) {
          throw new Error("Zone not found");
        }
  
        if (
          zone.projectId !== existingActivity.projectId
        ) {
          throw new Error(
            "Zone does not belong to this activity's project"
          );
        }
  
        if (
          targetBuildingId &&
          zone.buildingId !== targetBuildingId
        ) {
          throw new Error(
            "Zone does not belong to the selected building"
          );
        }
      }
    }
  
    // --------------------------------------------------
    // Check duplicate code
    // --------------------------------------------------
    if (
      data.code &&
      data.code !== existingActivity.code
    ) {
      const duplicate =
        await prisma.activity.findFirst({
          where: {
            projectId: existingActivity.projectId,
            code: data.code,
            NOT: {
              id,
            },
          },
        });
  
      if (duplicate) {
        throw new Error(
          `Activity code '${data.code}' already exists in this project`
        );
      }
    }
  
    // --------------------------------------------------
    // Update
    // --------------------------------------------------
    return prisma.activity.update({
      where: {
        id,
      },
  
      data: {
        ...(data.buildingId !== undefined && {
          buildingId: data.buildingId,
        }),
  
        ...(data.zoneId !== undefined && {
          zoneId: data.zoneId,
        }),
  
        ...(data.code !== undefined && {
          code: data.code,
        }),
  
        ...(data.name !== undefined && {
          name: data.name,
        }),
  
        ...(data.description !== undefined && {
          description: data.description,
        }),
  
        ...(data.status !== undefined && {
          status: data.status,
        }),
      },
  
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
  
        building: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
  
        zone: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

export async function deleteActivity(id: string) {
    const activity = await prisma.activity.findUnique({
      where: {
        id,
      },
  
      include: {
        _count: {
          select: {
            materialIssues: true,
            materialRequests: true,
            consumption: true,
            wastage: true,
          },
        },
      },
    });
  
    if (!activity) {
      throw new Error("Activity not found");
    }
  
    if (activity._count.materialIssues > 0) {
      throw new Error(
        "Cannot delete activity because it has material issues"
      );
    }
  
    if (activity._count.materialRequests > 0) {
      throw new Error(
        "Cannot delete activity because it has material requests"
      );
    }
  
    if (activity._count.consumption > 0) {
      throw new Error(
        "Cannot delete activity because it has material consumption records"
      );
    }
  
    if (activity._count.wastage > 0) {
      throw new Error(
        "Cannot delete activity because it has wastage records"
      );
    }
  
    return prisma.activity.delete({
      where: {
        id,
      },
    });
  }