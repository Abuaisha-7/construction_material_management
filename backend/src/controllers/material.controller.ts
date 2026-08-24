import { Request, Response } from "express";
import { prisma } from "../config/database";

export async function createMaterial(
  req: Request,
  res: Response
) {
  try {
    const material = await prisma.material.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create material"
    });
  }
}

export async function getMaterials(
  req: Request,
  res: Response
) {
  try {
    const {
      search,
      categoryId,
      isActive
    } = req.query;

    const materials =
      await prisma.material.findMany({
        where: {
          ...(search
            ? {
                OR: [
                  {
                    name: {
                      contains: String(search)
                    }
                  },
                  {
                    materialCode: {
                      contains: String(search)
                    }
                  }
                ]
              }
            : {}),

          ...(categoryId
            ? {
                categoryId: String(categoryId)
              }
            : {}),

          ...(isActive !== undefined
            ? {
                isActive:
                  String(isActive) === "true"
              }
            : {})
        },

        include: {
          category: true,
          unit: true,
          suppliers: {
            include: {
              supplier: true
            }
          }
        },

        orderBy: {
          name: "asc"
        }
      });

    res.json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch materials"
    });
  }
}

export async function getMaterialById(
  req: Request,
  res: Response
) {
  try {
    const material =
      await prisma.material.findUnique({
        where: {
          id: req.params.id
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
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch material"
    });
  }
}

export async function updateMaterial(
  req: Request,
  res: Response
) {
  try {
    const material =
      await prisma.material.update({
        where: {
          id: req.params.id
        },
        data: req.body
      });

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update material"
    });
  }
}

export async function deleteMaterial(
  req: Request,
  res: Response
) {
  try {
    await prisma.material.update({
      where: {
        id: req.params.id
      },
      data: {
        isActive: false
      }
    });

    res.json({
      success: true,
      message: "Material deactivated successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to deactivate material"
    });
  }
}