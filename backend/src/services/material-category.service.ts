import { prisma } from "../config/database";

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export async function createCategory(data: CreateCategoryInput) {
  const { name, description } = data;

  const existing = await prisma.materialCategory.findUnique({
    where: {
      name,
    },
  });

  if (existing) {
    throw new Error("CATEGORY_ALREADY_EXISTS");
  }

  return prisma.materialCategory.create({
    data: {
      name,
      description,
    },
  });
}

export async function getCategories() {
  return prisma.materialCategory.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getCategoryById(id: string) {
  return prisma.materialCategory.findUnique({
    where: {
      id,
    },
  });
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
  }
) {
  const existing = await prisma.materialCategory.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.materialCategory.findUnique({
      where: {
        name: data.name,
      },
    });

    if (duplicate) {
      throw new Error("CATEGORY_ALREADY_EXISTS");
    }
  }

  return prisma.materialCategory.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.materialCategory.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  return prisma.materialCategory.delete({
    where: {
      id,
    },
  });
}