import { prisma } from "../config/database";
import { Prisma, UserStatus } from "@prisma/client";
import { hashPassword } from "../utils/password";

interface CreateUserInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  status?: UserStatus;
}

interface UpdateUserInput {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  status?: UserStatus;
}

export async function getUsers(params: {
  search?: string;
  status?: UserStatus;
  page?: number;
  limit?: number;
}) {
  const { search, status, page = 1, limit = 20 } = params;

  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      {
        fullName: {
          contains: search,
        },
      },
      {
        email: {
          contains: search,
        },
      },
      {
        phone: {
          contains: search,
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function createUser(data: CreateUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      status: data.status ?? "ACTIVE",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateUser(
  userId: string,
  data: UpdateUserInput
) {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (
    data.email &&
    data.email !== existingUser.email
  ) {
    const duplicate = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (duplicate) {
      throw new Error("User with this email already exists");
    }
  }

  const updateData: Prisma.UserUpdateInput = {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    status: data.status,
  };

  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}