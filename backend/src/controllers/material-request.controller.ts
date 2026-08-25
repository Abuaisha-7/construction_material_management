import {
    Request,
    Response
  } from "express";
  
  import {
    createMaterialRequest,
    getMaterialRequests,
    getMaterialRequestById,
    updateMaterialRequest,
    submitMaterialRequest,
    cancelMaterialRequest,
    startMaterialRequestReview,
    approveMaterialRequest,
    rejectMaterialRequest
  } from "../services/material-request.service";
  
  import {
    createMaterialRequestSchema,
    rejectMaterialRequestSchema,
    updateMaterialRequestSchema
  } from "../schemas/material-request.schema";

  export async function createMaterialRequestController(
    req: Request,
    res: Response
  ) {
  
    try {
  
      const result =
        createMaterialRequestSchema.safeParse(
          req.body
        );
  
      if (!result.success) {
  
        return res.status(400).json({
  
          success: false,
  
          message:
            "Validation failed",
  
          errors:
            result.error.flatten()
        });
      }
  
      const userId =
        (req as any).user?.id;
  
      if (!userId) {
  
        return res.status(401).json({
  
          success: false,
  
          message:
            "Unauthorized"
        });
      }
  
      const request =
        await createMaterialRequest(
          userId,
          result.data
        );
  
      return res.status(201).json({
  
        success: true,
  
        message:
          "Material request created successfully",
  
        data:
          request
      });
  
    } catch (error: any) {
  
      console.error(error);
  
      return res.status(400).json({
  
        success: false,
  
        message:
          error.message ||
          "Failed to create material request"
      });
    }
  }
  
  export async function getMaterialRequestsController(
    req: Request,
    res: Response
  ) {
  
    try {
  
      const page =
        Number(req.query.page) || 1;
  
      const limit =
        Number(req.query.limit) || 20;
  
      const search =
        req.query.search as string | undefined;
  
      const status =
        req.query.status as string | undefined;
  
      const projectId =
        req.query.projectId as string | undefined;
  
      const result =
        await getMaterialRequests(
          page,
          limit,
          search,
          status,
          projectId
        );
  
      return res.json({
  
        success: true,
  
        data:
          result.requests,
  
        pagination:
          result.pagination
      });
  
    } catch (error: any) {
  
      console.error(error);
  
      return res.status(500).json({
  
        success: false,
  
        message:
          "Failed to fetch material requests"
      });
    }
  }
  
  export async function getMaterialRequestController(
    req: Request,
    res: Response
  ) {
  
    try {
  
      const request =
        await getMaterialRequestById(
          req.params.id
        );
  
      return res.json({
  
        success: true,
  
        data:
          request
      });
  
    } catch (error: any) {
  
      return res.status(404).json({
  
        success: false,
  
        message:
          error.message ||
          "Material request not found"
      });
    }
  }
  
  export async function updateMaterialRequestController(
    req: Request,
    res: Response
  ) {
  
    try {
  
      const result =
        updateMaterialRequestSchema.safeParse(
          req.body
        );
  
      if (!result.success) {
  
        return res.status(400).json({
  
          success: false,
  
          message:
            "Validation failed",
  
          errors:
            result.error.flatten()
        });
      }
  
      const request =
        await updateMaterialRequest(
          req.params.id,
          result.data
        );
  
      return res.json({
  
        success: true,
  
        message:
          "Material request updated successfully",
  
        data:
          request
      });
  
    } catch (error: any) {
  
      return res.status(400).json({
  
        success: false,
  
        message:
          error.message ||
          "Failed to update material request"
      });
    }
  }
  
  export async function submitMaterialRequestController(
    req: Request,
    res: Response
  ) {
  
    try {
  
      const request =
        await submitMaterialRequest(
          req.params.id
        );
  
      return res.json({
  
        success: true,
  
        message:
          "Material request submitted for approval",
  
        data:
          request
      });
  
    } catch (error: any) {
  
      return res.status(400).json({
  
        success: false,
  
        message:
          error.message ||
          "Failed to submit material request"
      });
    }
  }

  export async function startMaterialRequestReviewController(
    req: Request,
    res: Response
  ) {
    try {
      const request =
        await startMaterialRequestReview(
          req.params.id
        );
  
      return res.json({
        success: true,
        message:
          "Material request moved to UNDER_REVIEW",
        data: request
      });
  
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to start review"
      });
    }
  }

  export async function approveMaterialRequestController(
    req: Request,
    res: Response
  ) {
    try {
      const request =
        await approveMaterialRequest(
          req.params.id
        );
  
      return res.json({
        success: true,
        message:
          "Material request approved successfully",
        data: request
      });
  
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to approve material request"
      });
    }
  }

  export async function rejectMaterialRequestController(
    req: Request,
    res: Response
  ) {
    try {
  
      const result =
        rejectMaterialRequestSchema.safeParse(
          req.body
        );
  
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten()
        });
      }
  
      const request =
        await rejectMaterialRequest(
          req.params.id,
          result.data.reason
        );
  
      return res.json({
        success: true,
        message:
          "Material request rejected",
        data: request
      });
  
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to reject material request"
      });
    }
  }
  
  export async function cancelMaterialRequestController(
    req: Request,
    res: Response
  ) {
  
    try {
  
      const request =
        await cancelMaterialRequest(
          req.params.id
        );
  
      return res.json({
  
        success: true,
  
        message:
          "Material request cancelled successfully",
  
        data:
          request
      });
  
    } catch (error: any) {
  
      return res.status(400).json({
  
        success: false,
  
        message:
          error.message ||
          "Failed to cancel material request"
      });
    }
  }