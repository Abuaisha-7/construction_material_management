import { prisma } from "../config/database";

export interface CreateMaterialInput {
  materialCode: string;
  name: string;
  categoryId: string;
  unitId: string;
  specification?: string;
  standard?: string;
  description?: string;
  estimatedUnitPrice?: number;
  currentUnitPrice?: number;
  minimumStock?: number;
  reorderLevel?: number;
  maximumStock?: number;
  requiresInspection?: boolean;
  requiresCertificate?: boolean;
  storageRequirements?: string;
  isActive?: boolean;
}

export interface GetMaterialsParams {
  search?: string;
  categoryId?: string;
  unitId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function createMaterial(
  data: CreateMaterialInput
) {
  const existingMaterial =
    await prisma.material.findUnique({
      where: {
        materialCode: data.materialCode,
      },
    });

  if (existingMaterial) {
    throw new Error(
      "Material code already exists"
    );
  }

  const category =
    await prisma.materialCategory.findUnique({
      where: {
        id: data.categoryId,
      },
    });

  if (!category) {
    throw new Error(
      "Material category not found"
    );
  }

  const unit =
    await prisma.unit.findUnique({
      where: {
        id: data.unitId,
      },
    });

  if (!unit) {
    throw new Error(
      "Unit of measurement not found"
    );
  }

  return prisma.material.create({
    data: {
      materialCode: data.materialCode,
      name: data.name,
      categoryId: data.categoryId,
      unitId: data.unitId,

      specification: data.specification,
      standard: data.standard,
      description: data.description,

      estimatedUnitPrice:
        data.estimatedUnitPrice ?? 0,

      currentUnitPrice:
        data.currentUnitPrice ?? 0,

      minimumStock:
        data.minimumStock ?? 0,

      reorderLevel:
        data.reorderLevel ?? 0,

      maximumStock:
        data.maximumStock,

      requiresInspection:
        data.requiresInspection ?? true,

      requiresCertificate:
        data.requiresCertificate ?? false,

      storageRequirements:
        data.storageRequirements,

      isActive:
        data.isActive ?? true,
    },

    include: {
      category: true,
      unit: true,
    },
  });
}

export async function getMaterials(
  params: GetMaterialsParams
) {
  const {
    search,
    categoryId,
    unitId,
    isActive,
    page = 1,
    limit = 20,
  } = params;

  const skip = (page - 1) * limit;

  const where: any = {};

  // Search
  if (search) {
    where.OR = [
      {
        materialCode: {
          contains: search,
        },
      },
      {
        name: {
          contains: search,
        },
      },
      {
        specification: {
          contains: search,
        },
      },
      {
        standard: {
          contains: search,
        },
      },
      {
        description: {
          contains: search,
        },
      },
    ];
  }

  // Category filter
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Unit filter
  if (unitId) {
    where.unitId = unitId;
  }

  // Active filter
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [materials, total] =
    await prisma.$transaction([
      prisma.material.findMany({
        where,

        include: {
          category: true,
          unit: true,
        },

        orderBy: {
          name: "asc",
        },

        skip,
        take: limit,
      }),

      prisma.material.count({
        where,
      }),
    ]);

  return {
    materials,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMaterialById(
    materialId: string
  ) {
    const material =
      await prisma.material.findUnique({
        where: {
          id: materialId
        },
  
        include: {
          category: true,
  
          unit: true,
  
          suppliers: {
            include: {
              supplier: true
            }
          },
  
          inventoryBalances: {
            include: {
              warehouse: true,
              storageLocation: true
            }
          }
        }
      });
  
    if (!material) {
      throw new Error(
        "MATERIAL_NOT_FOUND"
      );
    }
  
    return material;
  }

