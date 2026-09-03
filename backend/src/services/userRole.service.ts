import { prisma } from "../config/database";

interface AssignRoleInput {
  userId: string;
  roleId: string;
}

// =====================================================
// ASSIGN ROLE TO USER
// =====================================================
export async function assignRoleToUser(
  data: AssignRoleInput
) {
  const { userId, roleId } = data;

  // Check user
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check role
  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  // Check if role already assigned
  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  if (existingUserRole) {
    throw new Error(
      "Role is already assigned to this user"
    );
  }

  // Create user-role relationship
  return prisma.userRole.create({
    data: {
      userId,
      roleId,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });
}


// =====================================================
// GET ALL USER ROLE ASSIGNMENTS
// =====================================================
export async function getAllUserRoles() {
  return prisma.userRole.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: {
      user: {
        fullName: "asc",
      },
    },
  });
}


// =====================================================
// GET ROLES FOR A USER
// =====================================================
export async function getUserRolesByUser(
  userId: string
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
    },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  return {
    user,
    roles: userRoles.map(
      (userRole) => userRole.role
    ),
  };
}


// =====================================================
// GET ONE USER ROLE ASSIGNMENT
// =====================================================
export async function getUserRole(
  userId: string,
  roleId: string
) {
  const userRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  if (!userRole) {
    throw new Error(
      "Role assignment not found"
    );
  }

  return userRole;
}


// =====================================================
// REMOVE ROLE FROM USER
// =====================================================
export async function removeRoleFromUser(
  userId: string,
  roleId: string
) {
  const existingUserRole =
    await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

  if (!existingUserRole) {
    throw new Error(
      "Role assignment not found"
    );
  }

  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  return true;
}