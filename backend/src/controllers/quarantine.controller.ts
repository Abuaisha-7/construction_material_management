// src/controllers/quarantine.controller.ts

import { Request, Response } from "express";

import {
  createQuarantine,
  getQuarantines,
  getQuarantineById,
  createDisposition,
} from "../services/quarantine.service";

export async function createQuarantineController(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as any).user!.id;

    const quarantine =
      await createQuarantine(
        req.body,
        userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Material quarantine created successfully",
      data: quarantine,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create quarantine",
    });
  }
}

export async function getQuarantinesController(
    req: Request,
    res: Response
  ) {
    try {
      const result =
        await getQuarantines({
          page: Number(req.query.page) || 1,
  
          limit:
            Number(req.query.limit) || 20,
  
          status:
            req.query.status as string,
  
          projectId:
            req.query.projectId as string,
        });
  
      return res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to get quarantines",
      });
    }
  }

export async function getQuarantineByIdController(
    req: Request,
    res: Response
  ) {
    try {
      const quarantine =
        await getQuarantineById(
          req.params.id as string
        );
  
      return res.json({
        success: true,
        data: quarantine,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message:
          error.message ||
          "Quarantine not found",
      });
    }
  }

export async function createDispositionController(
    req: Request,
    res: Response
  ) {
    try {
      const userId = (req as any).user!.id;
  
      const disposition =
        await createDisposition(
          req.params.id as string,
          req.body,
          userId
        );
  
      return res.status(201).json({
        success: true,
        message:
          "Material disposition recorded successfully",
        data: disposition,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to create disposition",
      });
    }
  }