import { Request, Response } from "express";

import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  submitPurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
  closePurchaseOrder,
} from "../services/purchase-order.service";

import {
  createPurchaseOrderSchema,
  purchaseOrderQuerySchema
} from "../schemas/purchase-order.schema";

export async function createPurchaseOrderController(
  req: Request,
  res: Response
) {
  try {

    const data =
      createPurchaseOrderSchema.parse(req.body);

    const userId =
      (req as any).user.id;

    const purchaseOrder =
      await createPurchaseOrder(
        data,
        userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Purchase order created successfully",
      data: purchaseOrder
    });

  } catch (error: any) {

    console.error(error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.flatten()
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message ||
        "Failed to create purchase order"
    });
  }
}

export async function getPurchaseOrdersController(
    req: Request,
    res: Response
  ) {
    try {
  
      const query =
        purchaseOrderQuerySchema.parse(req.query);
  
      const result =
        await getPurchaseOrders(query);
  
      return res.json({
        success: true,
        data: result.purchaseOrders,
  
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
  
    } catch (error: any) {
  
      console.error(error);
  
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: error.flatten()
        });
      }
  
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch purchase orders"
      });
    }
  }

export async function getPurchaseOrderController(
    req: Request,
    res: Response
  ) {
    try {
  
      const purchaseOrder =
        await getPurchaseOrderById(
          (req as any).params.id
        );
  
      return res.json({
        success: true,
        data: purchaseOrder
      });
  
    } catch (error: any) {
  
      console.error(error);
  
      return res.status(404).json({
        success: false,
        message:
          error.message ||
          "Purchase order not found"
      });
    }
  }

export async function submitPurchaseOrderController(
    req: Request,
    res: Response
  ) {
    try {
      const userId = (req as any).user!.id;
  
      const purchaseOrder =
        await submitPurchaseOrder(
          (req as any).params.id,
          userId
        );
  
      return res.status(200).json({
        success: true,
        message:
          "Purchase order submitted for approval successfully",
        data: purchaseOrder,
      });
    } catch (error: any) {
      console.error(error);
  
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to submit purchase order",
      });
    }
  }

export async function approvePurchaseOrderController(
    req: Request,
    res: Response
  ) {
    try {
      const userId = (req as any).user!.id;
  
      const purchaseOrder =
        await approvePurchaseOrder(
          (req as any).params.id,
          userId
        );
  
      return res.status(200).json({
        success: true,
        message:
          "Purchase order approved successfully",
        data: purchaseOrder,
      });
    } catch (error: any) {
      console.error(error);
  
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to approve purchase order",
      });
    }
  }

export async function cancelPurchaseOrderController(
    req: Request,
    res: Response
  ) {
    try {
      const userId = (req as any).user!.id;
  
      const { reason } = req.body;
  
      const purchaseOrder =
        await cancelPurchaseOrder(
          (req as any).params.id,
          userId,
          reason
        );
  
      return res.status(200).json({
        success: true,
        message:
          "Purchase order cancelled successfully",
        data: purchaseOrder,
      });
    } catch (error: any) {
      console.error(error);
  
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to cancel purchase order",
      });
    }
  }

export async function closePurchaseOrderController(
    req: Request,
    res: Response
  ) {
    try {
      const userId = (req as any).user!.id;
  
      const purchaseOrder =
        await closePurchaseOrder(
          (req as any).params.id,
          userId
        );
  
      return res.status(200).json({
        success: true,
        message:
          "Purchase order closed successfully",
        data: purchaseOrder,
      });
    } catch (error: any) {
      console.error(error);
  
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to close purchase order",
      });
    }
  }