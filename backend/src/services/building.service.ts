import {prisma} from "../config/database";

interface CreateBuildingData {
  projectId: string;
  code: string;
  name: string;
  description?: string | null;
}

interface UpdateBuildingData {
  code?: string;
  name?: string;
  description?: string | null;
}

export async function createBuilding(data: CreateBuildingData) {
  const { projectId, code, name, description } = data;

  // 1. Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // 2. Check duplicate building code within project
  const existingBuilding = await prisma.building.findFirst({
    where: {
      projectId,
      code,
    },
  });

  if (existingBuilding) {
    throw new Error(
      `Building code '${code}' already exists in this project`
    );
  }

  // 3. Create building
  return prisma.building.create({
    data: {
      projectId,
      code,
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
    },
  });
}

export async function getBuildings(projectId?: string) {
  return prisma.building.findMany({
    where: projectId
      ? {
          projectId,
        }
      : undefined,
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          zones: true,
          activities: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getBuildingById(id: string) {
  const building = await prisma.building.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      zones: {
        orderBy: {
          createdAt: "asc",
        },
      },
      activities: {
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          zones: true,
          activities: true,
        },
      },
    },
  });

  if (!building) {
    throw new Error("Building not found");
  }

  return building;
}

export async function updateBuilding(
  id: string,
  data: UpdateBuildingData
) {
  const existingBuilding = await prisma.building.findUnique({
    where: { id },
  });

  if (!existingBuilding) {
    throw new Error("Building not found");
  }

  // Check duplicate code if code is being changed
  if (data.code && data.code !== existingBuilding.code) {
    const duplicate = await prisma.building.findFirst({
      where: {
        projectId: existingBuilding.projectId,
        code: data.code,
        NOT: {
          id,
        },
      },
    });

    if (duplicate) {
      throw new Error(
        `Building code '${data.code}' already exists in this project`
      );
    }
  }

  return prisma.building.update({
    where: { id },
    data: {
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
    },
  });
}

export async function deleteBuilding(id: string) {
  const building = await prisma.building.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          zones: true,
          activities: true,
        },
      },
    },
  });

  if (!building) {
    throw new Error("Building not found");
  }

  // Don't allow deletion if it contains dependent data
  if (building._count.zones > 0) {
    throw new Error(
      "Cannot delete building because it has zones"
    );
  }

  if (building._count.activities > 0) {
    throw new Error(
      "Cannot delete building because it has activities"
    );
  }

  return prisma.building.delete({
    where: { id },
  });
}