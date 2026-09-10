import { prisma } from "../config/database";

interface CreateRoleInput {
  name: string;
  description?: string;
}

interface UpdateRoleInput {
  name?: string;
  description?: string;
}

export async function getRoles() {
  const roles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  return roles;
}

export async function getRoleById(roleId: string) {
  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  return role;
}

export async function createRole(data: CreateRoleInput) {
  const existingRole = await prisma.role.findUnique({
    where: {
      name: data.name,
    },
  });

  if (existingRole) {
    throw new Error("Role with this name already exists");
  }

  return prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
}

export async function updateRole(
  roleId: string,
  data: UpdateRoleInput
) {
  const existingRole = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!existingRole) {
    throw new Error("Role not found");
  }

  if (
    data.name &&
    data.name !== existingRole.name
  ) {
    const duplicate = await prisma.role.findUnique({
      where: {
        name: data.name,
      },
    });

    if (duplicate) {
      throw new Error("Role with this name already exists");
    }
  }

  return prisma.role.update({
    where: {
      id: roleId,
    },
    data: {
      name: data.name,
      description: data.description,
    },
  });
}

export async function deleteRole(roleId: string) {
  const existingRole = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!existingRole) {
    throw new Error("Role not found");
  }

  await prisma.role.delete({
    where: {
      id: roleId,
    },
  });

  return true;
}