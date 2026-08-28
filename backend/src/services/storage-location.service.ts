import { Prisma, PrismaClient } from "@prisma/client";

import {
  CreateStorageLocationInput,
  UpdateStorageLocationInput,
} from "../schemas/storage-location.schema";

const prisma = new PrismaClient();

/**
 * Create storage location
 */
export async function createStorageLocation(
  data: CreateStorageLocationInput
) {
  const warehouse =
    await prisma.warehouse.findUnique({
      where: {
        id: data.warehouseId,
      },
      include: {
        project: true,
      },
    });

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  if (!warehouse.isActive) {
    throw new Error(
      "Cannot create storage location inside an inactive warehouse"
    );
  }

  if (!warehouse.project) {
    throw new Error(
      "Warehouse is not associated with a project"
    );
  }

  const existing =
    await prisma.storageLocation.findUnique({
      where: {
        warehouseId_code: {
          warehouseId: data.warehouseId,
          code: data.code,
        },
      },
    });

  if (existing) {
    throw new Error(
      `Storage location code already exists in this warehouse: ${data.code}`
    );
  }

  const storageLocation =
    await prisma.storageLocation.create({
      data: {
        warehouseId: data.warehouseId,
        code: data.code,
        name: data.name,
        locationType: data.locationType ?? null,
        capacity:
          data.capacity !== undefined &&
          data.capacity !== null
            ? new Prisma.Decimal(data.capacity)
            : null,
        description: data.description ?? null,
        isActive:
          data.isActive ?? true,
      },

      include: {
        warehouse: {
          include: {
            project: true,
          },
        },
      },
    });

  return storageLocation;
}

/**
 * Get all storage locations
 */
export async function getStorageLocations(
  options: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    isActive?: boolean;
  } = {}
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;

  const skip = (page - 1) * limit;

  const where: Prisma.StorageLocationWhereInput =
    {};

  if (options.warehouseId) {
    where.warehouseId =
      options.warehouseId;
  }

  if (options.isActive !== undefined) {
    where.isActive =
      options.isActive;
  }

  if (options.search) {
    where.OR = [
      {
        code: {
          contains: options.search,
        },
      },
      {
        name: {
          contains: options.search,
        },
      },
      {
        locationType: {
          contains: options.search,
        },
      },
      {
        description: {
          contains: options.search,
        },
      },
    ];
  }

  const [storageLocations, total] =
    await prisma.$transaction([
      prisma.storageLocation.findMany({
        where,

        include: {
          warehouse: {
            include: {
              project: true,
            },
          },
        },

        orderBy: [
          {
            warehouse: {
              name: "asc",
            },
          },
          {
            code: "asc",
          },
        ],

        skip,
        take: limit,
      }),

      prisma.storageLocation.count({
        where,
      }),
    ]);

  return {
    storageLocations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit
      ),
    },
  };
}

/**
 * Get storage location by ID
 */
export async function getStorageLocationById(
  id: string
) {
  const storageLocation =
    await prisma.storageLocation.findUnique({
      where: {
        id,
      },

      include: {
        warehouse: {
          include: {
            project: true,
          },
        },

        grnItems: {
          include: {
            grn: true,
            material: true,
            unit: true,
          },

          orderBy: {
            grn: {
              deliveryDate: "desc",
            },
          },

          take: 20,
        },

        inventoryBalances: {
          include: {
            material: true,
            warehouse: true,
          },
        },
      },
    });

  if (!storageLocation) {
    throw new Error(
      "Storage location not found"
    );
  }

  return storageLocation;
}

/**
 * Update storage location
 */
export async function updateStorageLocation(
  id: string,
  data: UpdateStorageLocationInput
) {
  const existing =
    await prisma.storageLocation.findUnique({
      where: {
        id,
      },
      include: {
        warehouse: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Storage location not found"
    );
  }

  let warehouseId =
    existing.warehouseId;

  if (data.warehouseId) {
    const warehouse =
      await prisma.warehouse.findUnique({
        where: {
          id: data.warehouseId,
        },
      });

    if (!warehouse) {
      throw new Error(
        "Target warehouse not found"
      );
    }

    if (!warehouse.isActive) {
      throw new Error(
        "Cannot move storage location to an inactive warehouse"
      );
    }

    warehouseId = data.warehouseId;
  }

  const code =
    data.code ?? existing.code;

  const duplicate =
    await prisma.storageLocation.findFirst({
      where: {
        warehouseId,
        code,
        NOT: {
          id,
        },
      },
    });

  if (duplicate) {
    throw new Error(
      `Storage location code already exists in this warehouse: ${code}`
    );
  }

  const updateData: Prisma.StorageLocationUpdateInput =
    {};

  if (data.warehouseId !== undefined) {
    updateData.warehouse = {
      connect: {
        id: data.warehouseId,
      },
    };
  }

  if (data.code !== undefined) {
    updateData.code = data.code;
  }

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.locationType !== undefined) {
    updateData.locationType =
      data.locationType;
  }

  if (data.capacity !== undefined) {
    updateData.capacity =
      data.capacity === null
        ? null
        : new Prisma.Decimal(
            data.capacity
          );
  }

  if (data.description !== undefined) {
    updateData.description =
      data.description;
  }

  if (data.isActive !== undefined) {
    updateData.isActive =
      data.isActive;
  }

  return prisma.storageLocation.update({
    where: {
      id,
    },

    data: updateData,

    include: {
      warehouse: {
        include: {
          project: true,
        },
      },
    },
  });
}

/**
 * Deactivate storage location
 */
export async function deactivateStorageLocation(
  id: string
) {
  const storageLocation =
    await prisma.storageLocation.findUnique({
      where: {
        id,
      },
    });

  if (!storageLocation) {
    throw new Error(
      "Storage location not found"
    );
  }

  if (!storageLocation.isActive) {
    throw new Error(
      "Storage location is already inactive"
    );
  }

  return prisma.storageLocation.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },

    include: {
      warehouse: true,
    },
  });
}

/**
 * Activate storage location
 */
export async function activateStorageLocation(
  id: string
) {
  const storageLocation =
    await prisma.storageLocation.findUnique({
      where: {
        id,
      },

      include: {
        warehouse: true,
      },
    });

  if (!storageLocation) {
    throw new Error(
      "Storage location not found"
    );
  }

  if (!storageLocation.warehouse.isActive) {
    throw new Error(
      "Cannot activate storage location inside an inactive warehouse"
    );
  }

  if (storageLocation.isActive) {
    throw new Error(
      "Storage location is already active"
    );
  }

  return prisma.storageLocation.update({
    where: {
      id,
    },

    data: {
      isActive: true,
    },

    include: {
      warehouse: true,
    },
  });
}