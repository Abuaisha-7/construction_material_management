import { Request, Response } from "express";

import {
  createInspection,
  getInspections,
  getInspectionById,
  startInspection,
  updateInspection,
  completeInspection,
} from "../services/inspection.service";

import {
  createInspectionSchema,
  updateInspectionSchema,
  completeInspectionSchema,
} from "../schemas/inspection.schema";


/**
 * ============================================================
 * CREATE
 * POST /api/inspections
 * ============================================================
 */

export async function createInspectionController(
  req: Request,
  res: Response
) {

  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    const data =
      createInspectionSchema.parse(
        req.body
      );

    const inspection =
      await createInspection(
        data,
        userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Material inspection created successfully",
      data: inspection,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create material inspection",
    });
  }
}


/**
 * ============================================================
 * GET ALL
 * GET /api/inspections
 * ============================================================
 */

export async function getInspectionsController(
  req: Request,
  res: Response
) {

  try {

    const result =
      await getInspections({
        page: req.query.page
          ? Number(req.query.page)
          : 1,

        limit: req.query.limit
          ? Number(req.query.limit)
          : 20,

        status:
          req.query.status as string,

        decision:
          req.query.decision as string,

        grnId:
          req.query.grnId as string,

        inspectorId:
          req.query.inspectorId as string,
      });

    return res.json({
      success: true,
      data: result.inspections,
      pagination:
        result.pagination,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch inspections",
    });
  }
}


/**
 * ============================================================
 * GET BY ID
 * GET /api/inspections/:id
 * ============================================================
 */

export async function getInspectionByIdController(
  req: Request,
  res: Response
) {

  try {

    const inspection =
      await getInspectionById(
        req.params.id
      );

    return res.json({
      success: true,
      data: inspection,
    });

  } catch (error: any) {

    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Inspection not found",
    });
  }
}


/**
 * ============================================================
 * START
 * POST /api/inspections/:id/start
 * ============================================================
 */

export async function startInspectionController(
  req: Request,
  res: Response
) {

  try {

    const inspection =
      await startInspection(
        req.params.id
      );

    return res.json({
      success: true,
      message:
        "Material inspection started successfully",
      data: inspection,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to start inspection",
    });
  }
}


/**
 * ============================================================
 * UPDATE
 * PATCH /api/inspections/:id
 * ============================================================
 */

export async function updateInspectionController(
  req: Request,
  res: Response
) {

  try {

    const data =
      updateInspectionSchema.parse(
        req.body
      );

    const inspection =
      await updateInspection(
        req.params.id,
        data
      );

    return res.json({
      success: true,
      message:
        "Material inspection updated successfully",
      data: inspection,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update inspection",
    });
  }
}


/**
 * ============================================================
 * COMPLETE
 * POST /api/inspections/:id/complete
 * ============================================================
 */

export async function completeInspectionController(
  req: Request,
  res: Response
) {

  try {

    const data =
      completeInspectionSchema.parse(
        req.body
      );

    const inspection =
      await completeInspection(
        req.params.id,
        data
      );

    return res.json({
      success: true,
      message:
        "Material inspection completed successfully",
      data: inspection,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to complete inspection",
    });
  }
}
