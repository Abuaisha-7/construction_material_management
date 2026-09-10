import { prisma } from "../config/database";

interface CreatePermissionInput {
  name: string;
  description?: string;
}

export async function getPermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      roles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return permissions;
}

export async function createPermission(data: CreatePermissionInput) {
  const existingPermission = await prisma.permission.findUnique({
    where: {
      name: data.name,
    },
  });

  if (existingPermission) {
    throw new Error("Permission with this name already exists");
  }

  return prisma.permission.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
}