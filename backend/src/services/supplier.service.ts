import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

interface CreateSupplierInput {
  supplierCode: string;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  registrationNumber?: string;
  taxNumber?: string;
  licenseNumber?: string;
  rating?: number;
  isActive?: boolean;
}

interface UpdateSupplierInput {
  supplierCode?: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  registrationNumber?: string;
  taxNumber?: string;
  licenseNumber?: string;
  rating?: number;
  isActive?: boolean;
}

/**
 * Create supplier
 */
export async function createSupplier(
  data: CreateSupplierInput
) {
  const existingSupplier =
    await prisma.supplier.findUnique({
      where: {
        supplierCode: data.supplierCode,
      },
    });

  if (existingSupplier) {
    throw new Error("Supplier code already exists");
  }

  return prisma.supplier.create({
    data: {
      supplierCode: data.supplierCode,
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      registrationNumber: data.registrationNumber,
      taxNumber: data.taxNumber,
      licenseNumber: data.licenseNumber,
      rating: data.rating,
      isActive: data.isActive ?? true,
    },
  });
}

/**
 * Get all suppliers
 */
export async function getSuppliers(params: {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}) {
  const {
    search,
    page = 1,
    limit = 20,
    isActive,
  } = params;

  const skip = (page - 1) * limit;

  const where: Prisma.SupplierWhereInput = {};

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      {
        supplierCode: {
          contains: search,
        },
      },
      {
        companyName: {
          contains: search,
        },
      },
      {
        contactPerson: {
          contains: search,
        },
      },
      {
        phone: {
          contains: search,
        },
      },
      {
        email: {
          contains: search,
        },
      },
      {
        registrationNumber: {
          contains: search,
        },
      },
      {
        taxNumber: {
          contains: search,
        },
      },
    ];
  }

  const [suppliers, total] =
    await prisma.$transaction([
      prisma.supplier.findMany({
        where,
        orderBy: {
          companyName: "asc",
        },
        skip,
        take: limit,
      }),

      prisma.supplier.count({
        where,
      }),
    ]);

  return {
    suppliers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(
  id: string
) {
  const supplier =
    await prisma.supplier.findUnique({
      where: {
        id,
      },
      include: {
        materials: true,
        purchaseOrders: true,
        goodsReceived: true,
      },
    });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return supplier;
}

/**
 * Update supplier
 */
export async function updateSupplier(
  id: string,
  data: UpdateSupplierInput
) {
  const existingSupplier =
    await prisma.supplier.findUnique({
      where: {
        id,
      },
    });

  if (!existingSupplier) {
    throw new Error("Supplier not found");
  }

  if (
    data.supplierCode &&
    data.supplierCode !==
      existingSupplier.supplierCode
  ) {
    const duplicate =
      await prisma.supplier.findUnique({
        where: {
          supplierCode: data.supplierCode,
        },
      });

    if (duplicate) {
      throw new Error(
        "Supplier code already exists"
      );
    }
  }

  return prisma.supplier.update({
    where: {
      id,
    },
    data,
  });
}

/**
 * Delete supplier
 */
export async function deleteSupplier(
  id: string
) {
  const supplier =
    await prisma.supplier.findUnique({
      where: {
        id,
      },
    });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return prisma.supplier.delete({
    where: {
      id,
    },
  });
}

