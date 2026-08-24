import { prisma } from "../config/database";
import {
  comparePassword,
  hashPassword
} from "../utils/password";
import { generateToken } from "../utils/jwt";

export async function authenticateUser(
  email: string,
  password: string
) {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("ACCOUNT_INACTIVE");
  }

  const passwordValid =
    await comparePassword(
      password,
      user.passwordHash
    );

  if (!passwordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const roles = user.roles.map(
    userRole => userRole.role.name
  );

  const permissions = [
    ...new Set(
      user.roles.flatMap(
        userRole =>
          userRole.role.permissions.map(
            rolePermission =>
              rolePermission.permission.name
          )
      )
    )
  ];

  const token = generateToken({
    userId: user.id,
    email: user.email
  });

  return {
    token,

    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      roles,
      permissions
    }
  };
}