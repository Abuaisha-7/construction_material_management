import { prisma } from "../config/database";

export interface CreateUnitInput {
  code: string;
  name: string;
  symbol: string;
}

export interface UpdateUnitInput {
  code?: string;
  name?: string;
  symbol?: string;
}

/**
 * Create a new unit
 */
export async function createUnit(data: CreateUnitInput) {
  const { code, name, symbol } = data;

  const existing = await prisma.unit.findFirst({
    where: {
      OR: [
        {
          code,
        },
        {
          name,
        },
      ],
    },
  });

  if (existing) {
    throw new Error("UNIT_ALREADY_EXISTS");
  }

  return prisma.unit.create({
    data: {
      code,
      name,
      symbol,
    },
  });
}

/**
 * Get all units
 */
export async function getUnits() {
  return prisma.unit.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Get unit by ID
 */
export async function getUnitById(id: string) {
  return prisma.unit.findUnique({
    where: {
      id,
    },
  });
}

/**
 * Update unit
 */
export async function updateUnit(
  id: string,
  data: UpdateUnitInput
) {
  const existing = await prisma.unit.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new Error("UNIT_NOT_FOUND");
  }

  if (data.code || data.name) {
    const duplicate = await prisma.unit.findFirst({
      where: {
        OR: [
          ...(data.code
            ? [
                {
                  code: data.code,
                },
              ]
            : []),

          ...(data.name
            ? [
                {
                  name: data.name,
                },
              ]
            : []),
        ],

        NOT: {
          id,
        },
      },
    });

    if (duplicate) {
      throw new Error("UNIT_ALREADY_EXISTS");
    }
  }

  return prisma.unit.update({
    where: {
      id,
    },
    data,
  });
}

/**
 * Delete unit
 */
export async function deleteUnit(id: string) {
  const existing = await prisma.unit.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new Error("UNIT_NOT_FOUND");
  }

  return prisma.unit.delete({
    where: {
      id,
    },
  });
}