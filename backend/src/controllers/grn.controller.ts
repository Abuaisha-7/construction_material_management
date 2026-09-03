import { Request, Response } from "express";

import {
  createGrn,
  getGrns,
  getGrnById,
  updateGrn,
  confirmGrn,
  rejectGrn,
} from "../services/grn.service";

// ======================================================
// CREATE
// ======================================================

export async function createGrnController(
  req: Request,
  res: Response
) {
  try {

    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const grn = await createGrn(
      req.body,
      userId
    );

    return res.status(201).json({
      success: true,
      message:
        "Goods receipt note created successfully",
      data: grn,
    });

  } catch (error: any) {

    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create GRN",
    });
  }
}

// ======================================================
// GET ALL
// ======================================================

export async function getGrnsController(
  _req: Request,
  res: Response
) {
  try {

    const grns = await getGrns();

    return res.json({
      success: true,
      data: grns,
    });

  } catch (error: any) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch GRNs",
    });
  }
}

// ======================================================
// GET ONE
// ======================================================

export async function getGrnByIdController(
  req: Request,
  res: Response
) {
  try {

    const grn =
      await getGrnById(
        (req as any).params.id
      );

    return res.json({
      success: true,
      data: grn,
    });

  } catch (error: any) {

    console.error(error);

    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "GRN not found",
    });
  }
}

// ======================================================
// UPDATE
// ======================================================

export async function updateGrnController(
  req: Request,
  res: Response
) {
  try {

    const grn =
      await updateGrn(
        (req as any).params.id,
        req.body
      );

    return res.json({
      success: true,
      message:
        "GRN updated successfully",
      data: grn,
    });

  } catch (error: any) {

    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update GRN",
    });
  }
}

// ======================================================
// CONFIRM
// ======================================================

export async function confirmGrnController(
  req: Request,
  res: Response
) {
  try {

    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const grn =
      await confirmGrn(
        (req as any).params.id,
        userId
      );

    return res.json({
      success: true,
      message:
        "GRN confirmed successfully",
      data: grn,
    });

  } catch (error: any) {

    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to confirm GRN",
    });
  }
}

// ======================================================
// REJECT
// ======================================================

export async function rejectGrnController(
  req: Request,
  res: Response
) {
  try {

    const { reason } = req.body;

    const grn =
      await rejectGrn(
        (req as any).params.id,
        reason
      );

    return res.json({
      success: true,
      message:
        "GRN rejected successfully",
      data: grn,
    });

  } catch (error: any) {

    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to reject GRN",
    });
  }
}