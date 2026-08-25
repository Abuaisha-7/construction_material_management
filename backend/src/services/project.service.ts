import { prisma } from "../config/database";

interface CreateProjectInput {
  code: string;
  name: string;
  description?: string;
  clientName: string;
  consultantName?: string;
  contractorName?: string;
  location?: string;
  contractNumber?: string;
  contractAmount?: number;
  currency?: string;
  startDate: Date;
  plannedCompletionDate: Date;
  actualCompletionDate?: Date;
  contractDurationDays?: number;
  status?: string;
}

export async function createProject(
  data: CreateProjectInput
) {
  const existingProject =
    await prisma.project.findUnique({
      where: {
        code: data.code
      }
    });

  if (existingProject) {
    throw new Error(
      "PROJECT_CODE_ALREADY_EXISTS"
    );
  }

  return prisma.project.create({
    data: {
      ...data
    }
  });
}

export async function getProjects(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
  
    const skip =
      (page - 1) * limit;
  
    const where = {
      ...(params.search
        ? {
            OR: [
              {
                code: {
                  contains: params.search
                }
              },
              {
                name: {
                  contains: params.search
                }
              },
              {
                clientName: {
                  contains: params.search
                }
              }
            ]
          }
        : {}),
  
      ...(params.status
        ? {
            status: params.status as any
          }
        : {})
    };
  
    const [
      projects,
      total
    ] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc"
        }
      }),
  
      prisma.project.count({
        where
      })
    ]);
  
    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit)
      }
    };
  }

export async function getProjectById(
    projectId: string
  ) {
    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId
        },
  
        include: {
          buildings: true,
          activities: true
        }
      });
  
    if (!project) {
      throw new Error(
        "PROJECT_NOT_FOUND"
      );
    }
  
    return project;
  }

export async function updateProject(
    projectId: string,
    data: Record<string, unknown>
  ) {
    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId
        }
      });
  
    if (!project) {
      throw new Error(
        "PROJECT_NOT_FOUND"
      );
    }
  
    return prisma.project.update({
      where: {
        id: projectId
      },
  
      data
    });
  }

export async function deactivateProject(
    projectId: string
  ) {
    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId
        }
      });
  
    if (!project) {
      throw new Error(
        "PROJECT_NOT_FOUND"
      );
    }
  
    return prisma.project.update({
      where: {
        id: projectId
      },
  
      data: {
        status: "CANCELLED"
      }
    });
  }