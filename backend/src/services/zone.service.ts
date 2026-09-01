import {prisma} from "../config/database";

interface CreateZoneData {
  projectId: string;
  buildingId?: string | null;
  code?: string | null;
  name: string;
  description?: string | null;
}

interface UpdateZoneData {
  buildingId?: string | null;
  code?: string | null;
  name?: string;
  description?: string | null;
}

export async function createZone(data: CreateZoneData) {
  const {
    projectId,
    buildingId,
    code,
    name,
    description,
  } = data;

  // 1. Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // 2. Verify building if supplied
  if (buildingId) {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new Error("Building not found");
    }

    // Important: building must belong to same project
    if (building.projectId !== projectId) {
      throw new Error(
        "Building does not belong to the selected project"
      );
    }
  }

  // 3. Prevent duplicate zone code within project
  if (code) {
    const existingZone = await prisma.zone.findFirst({
      where: {
        projectId,
        code,
      },
    });

    if (existingZone) {
      throw new Error(
        `Zone code '${code}' already exists in this project`
      );
    }
  }

  // 4. Create zone
  return prisma.zone.create({
    data: {
      projectId,
      buildingId: buildingId ?? null,
      code: code ?? null,
      name,
      description: description ?? null,
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
    },
  });
}

export async function getZones(
    projectId?: string,
    buildingId?: string
  ) {
    return prisma.zone.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(buildingId && { buildingId }),
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
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

export async function getZoneById(id: string) {
    const zone = await prisma.zone.findUnique({
      where: { id },
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
        activities: {
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            activities: true,
          },
        },
      },
    });
  
    if (!zone) {
      throw new Error("Zone not found");
    }
  
    return zone;
  }

export async function updateZone(
    id: string,
    data: UpdateZoneData
  ) {
    const existingZone = await prisma.zone.findUnique({
      where: { id },
    });
  
    if (!existingZone) {
      throw new Error("Zone not found");
    }
  
    // If changing building, validate project relationship
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
  
        if (building.projectId !== existingZone.projectId) {
          throw new Error(
            "Building does not belong to this zone's project"
          );
        }
      }
    }
  
    // Check duplicate code
    if (
      data.code &&
      data.code !== existingZone.code
    ) {
      const duplicate = await prisma.zone.findFirst({
        where: {
          projectId: existingZone.projectId,
          code: data.code,
          NOT: {
            id,
          },
        },
      });
  
      if (duplicate) {
        throw new Error(
          `Zone code '${data.code}' already exists in this project`
        );
      }
    }
  
    return prisma.zone.update({
      where: { id },
      data: {
        ...(data.buildingId !== undefined && {
          buildingId: data.buildingId,
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
      },
    });
  }

export async function deleteZone(id: string) {
    const zone = await prisma.zone.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            activities: true,
          },
        },
      },
    });
  
    if (!zone) {
      throw new Error("Zone not found");
    }
  
    if (zone._count.activities > 0) {
      throw new Error(
        "Cannot delete zone because it has activities"
      );
    }
  
    return prisma.zone.delete({
      where: { id },
    });
  }