import { Request, Response } from "express";

import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById
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
          req.params.id
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