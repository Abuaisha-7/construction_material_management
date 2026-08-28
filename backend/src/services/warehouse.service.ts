import {
    Prisma,
    PrismaClient,
  } from "@prisma/client";
  
  import {
    CreateWarehouseInput,
    UpdateWarehouseInput,
  } from "../schemas/warehouse.schema";
  
  const prisma =
    new PrismaClient();
  
  /**
   * Create Warehouse
   */
  export async function createWarehouse(
    data: CreateWarehouseInput
  ) {
    return prisma.$transaction(
      async (tx) => {
  
        // ==================================================
        // 1. Validate project
        // ==================================================
  
        const project =
          await tx.project.findUnique({
            where: {
              id: data.projectId,
            },
          });
  
        if (!project) {
          throw new Error(
            "Project not found"
          );
        }
  
        if (project.status !== "ACTIVE") {
          throw new Error(
            "Cannot create warehouse under an inactive project"
          );
        }
  
        // ==================================================
        // 2. Validate responsible user
        // ==================================================
  
        if (
          data.responsibleUserId
        ) {
          const user =
            await tx.user.findUnique({
              where: {
                id: data.responsibleUserId,
              },
            });
  
          if (!user) {
            throw new Error(
              "Responsible user not found"
            );
          }
  
          if (
            user.status !== "ACTIVE"
          ) {
            throw new Error(
              "Responsible user is inactive"
            );
          }
        }
  
        // ==================================================
        // 3. Check duplicate warehouse code
        // ==================================================
  
        const existing =
          await tx.warehouse.findUnique({
            where: {
              projectId_code: {
                projectId:
                  data.projectId,
                code: data.code,
              },
            },
          });
  
        if (existing) {
          throw new Error(
            `Warehouse code already exists in this project: ${data.code}`
          );
        }
  
        // ==================================================
        // 4. Create warehouse
        // ==================================================
  
        const warehouse =
          await tx.warehouse.create({
            data: {
              projectId:
                data.projectId,
  
              code:
                data.code,
  
              name:
                data.name,
  
              type:
                data.type ?? null,
  
              responsibleUserId:
                data.responsibleUserId ??
                null,
  
              capacityDescription:
                data.capacityDescription ??
                null,
  
              isActive:
                data.isActive ?? true,
            },
  
            include: {
              project: true,
  
              storageLocations: true,
            },
          });
  
        return warehouse;
      }
    );
  }
  
  /**
   * Get Warehouses
   */
  export async function getWarehouses(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      projectId?: string;
      responsibleUserId?: string;
      isActive?: boolean;
    } = {}
  ) {
    const page =
      options.page ?? 1;
  
    const limit =
      options.limit ?? 20;
  
    const skip =
      (page - 1) * limit;
  
    const where:
      Prisma.WarehouseWhereInput =
      {};
  
    // ==================================================
    // Project filter
    // ==================================================
  
    if (options.projectId) {
      where.projectId =
        options.projectId;
    }
  
    // ==================================================
    // Responsible user filter
    // ==================================================
  
    if (
      options.responsibleUserId
    ) {
      where.responsibleUserId =
        options.responsibleUserId;
    }
  
    // ==================================================
    // Active filter
    // ==================================================
  
    if (
      options.isActive !== undefined
    ) {
      where.isActive =
        options.isActive;
    }
  
    // ==================================================
    // Search
    // ==================================================
  
    if (options.search) {
      where.OR = [
        {
          code: {
            contains:
              options.search,
          },
        },
        {
          name: {
            contains:
              options.search,
          },
        },
        {
          type: {
            contains:
              options.search,
          },
        },
        {
          capacityDescription: {
            contains:
              options.search,
          },
        },
      ];
    }
  
    const [
      warehouses,
      total,
    ] =
      await prisma.$transaction([
        prisma.warehouse.findMany({
          where,
  
          include: {
            project: true,
  
            storageLocations: true,
  
            _count: {
              select: {
                storageLocations: true,
                inventoryBalances: true,
                inventoryTransactions: true,
                materialIssues: true,
                stockAdjustments: true,
                stockCounts: true,
              },
            },
          },
  
          orderBy: [
            {
              name: "asc",
            },
            {
              code: "asc",
            },
          ],
  
          skip,
  
          take: limit,
        }),
  
        prisma.warehouse.count({
          where,
        }),
      ]);
  
    return {
      warehouses,
  
      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    };
  }
  
  /**
   * Get Warehouse By ID
   */
  export async function getWarehouseById(
    id: string
  ) {
    const warehouse =
      await prisma.warehouse.findUnique({
        where: {
          id,
        },
  
        include: {
          project: true,
  
          storageLocations: {
            orderBy: {
              code: "asc",
            },
          },
  
          inventoryBalances: {
            include: {
              material: true,
              storageLocation: true,
            },
          },
  
          _count: {
            select: {
              storageLocations: true,
              inventoryBalances: true,
              inventoryTransactions: true,
              materialIssues: true,
              stockAdjustments: true,
              stockCounts: true,
            },
          },
        },
      });
  
    if (!warehouse) {
      throw new Error(
        "Warehouse not found"
      );
    }
  
    return warehouse;
  }
  
  /**
   * Update Warehouse
   */
  export async function updateWarehouse(
    id: string,
    data: UpdateWarehouseInput
  ) {
    return prisma.$transaction(
      async (tx) => {
  
        // ==================================================
        // 1. Find existing warehouse
        // ==================================================
  
        const existing =
          await tx.warehouse.findUnique({
            where: {
              id,
            },
          });
  
        if (!existing) {
          throw new Error(
            "Warehouse not found"
          );
        }
  
        // ==================================================
        // 2. Validate project
        // ==================================================
  
        const projectId =
          data.projectId ??
          existing.projectId;
  
        const project =
          await tx.project.findUnique({
            where: {
              id: projectId,
            },
          });
  
        if (!project) {
          throw new Error(
            "Project not found"
          );
        }
  
        if (!project.isActive) {
          throw new Error(
            "Cannot assign warehouse to an inactive project"
          );
        }
  
        // ==================================================
        // 3. Validate responsible user
        // ==================================================
  
        if (
          data.responsibleUserId
        ) {
          const user =
            await tx.user.findUnique({
              where: {
                id:
                  data.responsibleUserId,
              },
            });
  
          if (!user) {
            throw new Error(
              "Responsible user not found"
            );
          }
  
          if (
            user.status !== "ACTIVE"
          ) {
            throw new Error(
              "Responsible user is inactive"
            );
          }
        }
  
        // ==================================================
        // 4. Check duplicate code
        // ==================================================
  
        const code =
          data.code ??
          existing.code;
  
        const duplicate =
          await tx.warehouse.findFirst({
            where: {
              projectId,
              code,
  
              NOT: {
                id,
              },
            },
          });
  
        if (duplicate) {
          throw new Error(
            `Warehouse code already exists in this project: ${code}`
          );
        }
  
        // ==================================================
        // 5. Build update data
        // ==================================================
  
        const updateData:
          Prisma.WarehouseUpdateInput =
          {};
  
        if (
          data.projectId !==
          undefined
        ) {
          updateData.project = {
            connect: {
              id:
                data.projectId,
            },
          };
        }
  
        if (
          data.code !==
          undefined
        ) {
          updateData.code =
            data.code;
        }
  
        if (
          data.name !==
          undefined
        ) {
          updateData.name =
            data.name;
        }
  
        if (
          data.type !==
          undefined
        ) {
          updateData.type =
            data.type;
        }
  
        if (
          data.responsibleUserId !==
          undefined
        ) {
          updateData.responsibleUser =
            data.responsibleUserId
              ? {
                  connect: {
                    id:
                      data.responsibleUserId,
                  },
                }
              : {
                  disconnect: true,
                };
        }
  
        if (
          data.capacityDescription !==
          undefined
        ) {
          updateData.capacityDescription =
            data.capacityDescription;
        }
  
        if (
          data.isActive !==
          undefined
        ) {
          updateData.isActive =
            data.isActive;
        }
  
        // ==================================================
        // 6. Update
        // ==================================================
  
        return tx.warehouse.update({
          where: {
            id,
          },
  
          data: updateData,
  
          include: {
            project: true,
            storageLocations: true,
          },
        });
      }
    );
  }
  
  /**
   * Deactivate Warehouse
   */
  export async function deactivateWarehouse(
    id: string
  ) {
    return prisma.$transaction(
      async (tx) => {
  
        const warehouse =
          await tx.warehouse.findUnique({
            where: {
              id,
            },
  
            include: {
              storageLocations: true,
            },
          });
  
        if (!warehouse) {
          throw new Error(
            "Warehouse not found"
          );
        }
  
        if (!warehouse.isActive) {
          throw new Error(
            "Warehouse is already inactive"
          );
        }
  
        // ================================================
        // Prevent deactivation if active locations exist
        // ================================================
  
        const activeLocations =
          warehouse.storageLocations.filter(
            (location) =>
              location.isActive
          );
  
        if (
          activeLocations.length > 0
        ) {
          throw new Error(
            "Cannot deactivate warehouse while active storage locations exist"
          );
        }
  
        return tx.warehouse.update({
          where: {
            id,
          },
  
          data: {
            isActive: false,
          },
  
          include: {
            project: true,
            storageLocations: true,
          },
        });
      }
    );
  }
  
  /**
   * Activate Warehouse
   */
  export async function activateWarehouse(
    id: string
  ) {
    return prisma.$transaction(
      async (tx) => {
  
        const warehouse =
          await tx.warehouse.findUnique({
            where: {
              id,
            },
  
            include: {
              project: true,
            },
          });
  
        if (!warehouse) {
          throw new Error(
            "Warehouse not found"
          );
        }
  
        if (warehouse.isActive) {
          throw new Error(
            "Warehouse is already active"
          );
        }
  
        if (!warehouse.project.isActive) {
          throw new Error(
            "Cannot activate warehouse under an inactive project"
          );
        }
  
        return tx.warehouse.update({
          where: {
            id,
          },
  
          data: {
            isActive: true,
          },
  
          include: {
            project: true,
            storageLocations: true,
          },
        });
      }
    );
  }