import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

const permissions = [
  "dashboard:read",

  "users:read",
  "users:create",
  "users:update",
  "users:delete",

  "projects:read",
  "projects:create",
  "projects:update",
  "projects:delete",

  "materials:read",
  "materials:create",
  "materials:update",
  "materials:delete",

  "suppliers:read",
  "suppliers:create",
  "suppliers:update",

  "material_requests:read",
  "material_requests:create",
  "material_requests:approve",
  "material_requests:reject",

  "purchase_orders:read",
  "purchase_orders:create",
  "purchase_orders:approve",

  "grn:read",
  "grn:create",
  "grn:post",

  "inspections:read",
  "inspections:create",
  "inspections:approve",
  "inspections:reject",

  "inventory:read",
  "inventory:receive",
  "inventory:issue",
  "inventory:adjust",

  "reports:read"
];

async function main() {
  console.log("🌱 Starting database seed...");

  // --------------------------------------------------
  // 1. Create permissions
  // --------------------------------------------------

  for (const permissionName of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permissionName
      },
      update: {},
      create: {
        name: permissionName
      }
    });
  }

  console.log(`✅ ${permissions.length} permissions created/verified`);

  // --------------------------------------------------
  // 2. Create Admin Role
  // --------------------------------------------------

  const adminRole = await prisma.role.upsert({
    where: {
      name: "ADMIN"
    },
    update: {},
    create: {
      name: "ADMIN",
      description: "System administrator with full access"
    }
  });

  console.log(`✅ Admin role: ${adminRole.name}`);

  // --------------------------------------------------
  // 3. Assign all permissions to ADMIN
  // --------------------------------------------------

  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id
      }
    });
  }

  console.log("✅ All permissions assigned to ADMIN");

  // --------------------------------------------------
  // 4. Create Admin User
  // --------------------------------------------------

  const passwordHash = await hashPassword("Admin@123");

  const adminUser = await prisma.user.upsert({
    where: {
      email: "admin@construction.local"
    },
    update: {
      fullName: "System Administrator",
      passwordHash,
      status: "ACTIVE"
    },
    create: {
      fullName: "System Administrator",
      email: "admin@construction.local",
      phone: null,
      passwordHash,
      status: "ACTIVE"
    }
  });

  console.log(`✅ Admin user: ${adminUser.email}`);

  // --------------------------------------------------
  // 5. Assign ADMIN role to user
  // --------------------------------------------------

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });

  console.log("✅ ADMIN role assigned to user");

  console.log("");
  console.log("======================================");
  console.log("DATABASE SEED COMPLETED");
  console.log("======================================");
  console.log("Email:    admin@construction.local");
  console.log("Password: Admin@123");
  console.log("Role:     ADMIN");
  console.log("======================================");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });