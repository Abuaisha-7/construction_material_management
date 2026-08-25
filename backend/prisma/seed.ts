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

  "reports:read",
];

const units = [
  {
    code: "BAG",
    name: "Bag",
    symbol: "bag",
  },
  {
    code: "KG",
    name: "Kilogram",
    symbol: "kg",
  },
  {
    code: "TON",
    name: "Ton",
    symbol: "ton",
  },
  {
    code: "M",
    name: "Meter",
    symbol: "m",
  },
  {
    code: "M2",
    name: "Square Meter",
    symbol: "m²",
  },
  {
    code: "M3",
    name: "Cubic Meter",
    symbol: "m³",
  },
  {
    code: "L",
    name: "Liter",
    symbol: "L",
  },
  {
    code: "PCS",
    name: "Piece",
    symbol: "pcs",
  },
  {
    code: "SET",
    name: "Set",
    symbol: "set",
  },
  {
    code: "ROLL",
    name: "Roll",
    symbol: "roll",
  },
  {
    code: "BOX",
    name: "Box",
    symbol: "box",
  },
  {
    code: "BUNDLE",
    name: "Bundle",
    symbol: "bundle",
  },
  {
    code: "SHEET",
    name: "Sheet",
    symbol: "sheet",
  },
  {
    code: "LENGTH",
    name: "Length",
    symbol: "length",
  },
  {
    code: "TRIP",
    name: "Trip",
    symbol: "trip",
  },
  {
    code: "DAY",
    name: "Day",
    symbol: "day",
  },
  {
    code: "HOUR",
    name: "Hour",
    symbol: "hr",
  },
];

const materialCategories = [
  {
    name: "Cement",
    description: "Cement and cement-based binding materials used for construction.",
  },
  {
    name: "Steel/Reinforcement",
    description: "Reinforcement bars, steel sections, mesh and other reinforcement materials.",
  },
  {
    name: "Aggregate",
    description: "Coarse aggregates, crushed stone and other aggregates used in concrete.",
  },
  {
    name: "Sand",
    description: "Fine aggregates including river sand, washed sand and selected construction sand.",
  },
  {
    name: "Concrete",
    description: "Ready-mix concrete, concrete products and related materials.",
  },
  {
    name: "Bricks/Blocks",
    description: "Concrete blocks, hollow blocks, solid blocks, bricks and related masonry units.",
  },
  {
    name: "Masonry",
    description: "Materials used for masonry and wall construction.",
  },
  {
    name: "Timber",
    description: "Timber, wood and wooden construction materials.",
  },
  {
    name: "Formwork",
    description: "Formwork materials including plywood, panels, supports and accessories.",
  },
  {
    name: "Roofing",
    description: "Roof sheets, roofing accessories, membranes and related materials.",
  },
  {
    name: "Flooring",
    description: "Flooring materials and floor finishing products.",
  },
  {
    name: "Tiles",
    description: "Ceramic, porcelain, stone and other tile products.",
  },
  {
    name: "Plumbing",
    description: "Pipes, fittings, valves, sanitary and plumbing materials.",
  },
  {
    name: "Electrical",
    description: "Electrical cables, conduits, switches, sockets and electrical accessories.",
  },
  {
    name: "Paint",
    description: "Paints, primers, thinners, coatings and painting accessories.",
  },
  {
    name: "Glass",
    description: "Glass sheets, glazing materials and glass accessories.",
  },
  {
    name: "Aluminum",
    description: "Aluminum profiles, sheets and aluminum construction materials.",
  },
  {
    name: "Doors & Windows",
    description: "Doors, windows, frames and associated accessories.",
  },
  {
    name: "Waterproofing",
    description: "Waterproofing membranes, coatings, sealants and related materials.",
  },
  {
    name: "Hardware",
    description: "General construction hardware and building accessories.",
  },
  {
    name: "Fasteners",
    description: "Nails, screws, bolts, nuts, washers and other fastening materials.",
  },
  {
    name: "Safety Equipment",
    description: "Personal protective equipment and construction site safety materials.",
  },
  {
    name: "Fuel",
    description: "Fuel and petroleum products used for construction equipment and vehicles.",
  },
  {
    name: "Tools",
    description: "Hand tools, power tools and construction equipment tools.",
  },
  {
    name: "Other",
    description: "Construction materials that do not belong to another category.",
  },
];

async function seedPermissions() {
  console.log("🌱 Seeding permissions...");

  for (const permissionName of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permissionName,
      },
      update: {},
      create: {
        name: permissionName,
      },
    });
  }

  console.log(`✅ ${permissions.length} permissions seeded.`);
}

async function seedUnits() {
  console.log("🌱 Seeding units...");

  for (const unit of units) {
    await prisma.unit.upsert({
      where: {
        code: unit.code,
      },
      update: {
        name: unit.name,
        symbol: unit.symbol,
      },
      create: {
        code: unit.code,
        name: unit.name,
        symbol: unit.symbol,
      },
    });
  }

  console.log(`✅ ${units.length} units seeded.`);
}

async function seedMaterialCategories() {
  console.log("🌱 Seeding material categories...");

  for (const category of materialCategories) {
    await prisma.materialCategory.upsert({
      where: {
        name: category.name,
      },
      update: {
        description: category.description,
      },
      create: {
        name: category.name,
        description: category.description,
      },
    });
  }

  console.log(
    `✅ ${materialCategories.length} material categories seeded.`
  );
}

async function seedAdminUser() {
  console.log("🌱 Seeding admin user...");

  const passwordHash = await hashPassword("Admin@123");

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@construction.local",
    },
    update: {},
    create: {
      fullName: "System Administrator",
      email: "admin@construction.local",
      phone: "+251900000000",
      passwordHash,
      status: "ACTIVE",
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);

  return admin;
}

async function seedRoles() {
  console.log("🌱 Seeding roles...");

  const roles = [
    {
      name: "ADMIN",
      description: "System administrator with full access",
    },
    {
      name: "PROJECT_MANAGER",
      description: "Manages construction projects and project activities",
    },
    {
      name: "STORE_KEEPER",
      description: "Manages warehouse, inventory, receiving and issuing materials",
    },
    {
      name: "PROCUREMENT_OFFICER",
      description: "Manages suppliers and purchase orders",
    },
    {
      name: "INSPECTOR",
      description: "Performs material inspections and quality control",
    },
    {
      name: "SITE_ENGINEER",
      description: "Manages site material requests and consumption",
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        name: role.name,
      },
      update: {
        description: role.description,
      },
      create: {
        name: role.name,
        description: role.description,
      },
    });
  }

  console.log(`✅ ${roles.length} roles seeded.`);
}

async function seedAdminRole() {
  console.log("🌱 Assigning ADMIN role...");

  const admin = await prisma.user.findUnique({
    where: {
      email: "admin@construction.local",
    },
  });

  const adminRole = await prisma.role.findUnique({
    where: {
      name: "ADMIN",
    },
  });

  if (!admin || !adminRole) {
    throw new Error("Admin user or ADMIN role not found.");
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  console.log("✅ ADMIN role assigned.");
}

async function seedAdminPermissions() {
  console.log("🌱 Assigning permissions to ADMIN role...");

  const adminRole = await prisma.role.findUnique({
    where: {
      name: "ADMIN",
    },
  });

  if (!adminRole) {
    throw new Error("ADMIN role not found.");
  }

  for (const permissionName of permissions) {
    const permission = await prisma.permission.findUnique({
      where: {
        name: permissionName,
      },
    });

    if (!permission) {
      continue;
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("✅ All permissions assigned to ADMIN.");
}

async function main() {
  console.log("==========================================");
  console.log(" Construction Material Management System");
  console.log(" Database Seeding");
  console.log("==========================================");

  await seedPermissions();
  await seedUnits();
  await seedMaterialCategories();
  await seedRoles();
  await seedAdminUser();
  await seedAdminRole();
  await seedAdminPermissions();

  console.log("==========================================");
  console.log("✅ Database seeding completed successfully!");
  console.log("==========================================");
}

main()
  .catch((error) => {
    console.error("❌ Database seeding failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });