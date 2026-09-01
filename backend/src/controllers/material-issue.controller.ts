import { Request, Response } from "express";

import {
  createMaterialIssue,
  getMaterialIssues,
  getMaterialIssueById,
  submitMaterialIssue,
  approveMaterialIssue,
  issueMaterial,
  cancelMaterialIssue,
} from "../services/material-issue.service";

export async function createMaterialIssueController(
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
  
      const issue =
        await createMaterialIssue(
          req.body,
          userId
        );
  
      return res.status(201).json({
        success: true,
        message:
          "Material issue created successfully",
        data: issue,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to create material issue",
      });
    }
  }

export async function getMaterialIssuesController(
    req: Request,
    res: Response
  ) {
    try {
      const result =
        await getMaterialIssues({
          projectId:
            req.query.projectId as string,
  
          warehouseId:
            req.query.warehouseId as string,
  
          status:
            req.query.status as string,
  
          page: req.query.page
            ? Number(req.query.page)
            : 1,
  
          limit: req.query.limit
            ? Number(req.query.limit)
            : 20,
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
          "Failed to get material issues",
      });
    }
  }

export async function getMaterialIssueController(
    req: Request,
    res: Response
  ) {
    try {
      const issue =
        await getMaterialIssueById(
         (req as any).params.id
        );
  
      return res.json({
        success: true,
        data: issue,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message:
          error.message ||
          "Material issue not found",
      });
    }
  }

export async function submitMaterialIssueController(
    req: Request,
    res: Response
  ) {
    try {
      const issue =
        await submitMaterialIssue(
          (req as any).params.id
        );
  
      return res.json({
        success: true,
        message:
          "Material issue submitted for approval",
        data: issue,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to submit material issue",
      });
    }
  }

export async function approveMaterialIssueController(
    req: Request,
    res: Response
  ) {
    try {
      const userId =
        (req as any).user?.id;
  
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
  
      const issue =
        await approveMaterialIssue(
          ( req as any).params.id,
          userId
        );
  
      return res.json({
        success: true,
        message:
          "Material issue approved successfully",
        data: issue,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to approve material issue",
      });
    }
  }

export async function issueMaterialController(
    req: Request,
    res: Response
  ) {
    try {
      const userId =
        (req as any).user?.id;
  
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
  
      const issue =
        await issueMaterial(
          (req as any).params.id,
          userId
        );
  
      return res.json({
        success: true,
        message:
          "Material issued successfully",
        data: issue,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to issue material",
      });
    }
  }

export async function cancelMaterialIssueController(
    req: Request,
    res: Response
  ) {
    try {
      const issue =
        await cancelMaterialIssue(
          (req as any).params.id
        );
  
      return res.json({
        success: true,
        message:
          "Material issue cancelled successfully",
        data: issue,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to cancel material issue",
      });
    }
  }

  