import { prisma } from "../config/database";

interface AssignPermissionInput {
  roleId: string;
  permissionId: string;
}

export async function assignPermissionToRole(
  data: AssignPermissionInput
) {
  const { roleId, permissionId } = data;

  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  const permission = await prisma.permission.findUnique({
    where: {
      id: permissionId,
    },
  });

  if (!permission) {
    throw new Error("Permission not found");
  }

  const existingRolePermission =
    await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

  if (existingRolePermission) {
    throw new Error("Permission is already assigned to this role");
  }

  return prisma.rolePermission.create({
    data: {
      roleId,
      permissionId,
    },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      permission: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });
}

export async function getAllRolePermissions() {
  return prisma.rolePermission.findMany({
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      permission: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: {
      role: {
        name: "asc",
      },
    },
  });
}

export async function getRolePermission(
  roleId: string,
  permissionId: string
) {
  const rolePermission = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      permission: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  if (!rolePermission) {
    throw new Error("Role permission assignment not found");
  }

  return rolePermission;
}

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string
) {
  const existingRolePermission =
    await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

  if (!existingRolePermission) {
    throw new Error("Role permission assignment not found");
  }

  await prisma.rolePermission.delete({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },
  });

  return true;
}