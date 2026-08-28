import {
    Request,
    Response,
  } from "express";
  
  import {
    createWarehouse,
    getWarehouses,
    getWarehouseById,
    updateWarehouse,
    deactivateWarehouse,
    activateWarehouse,
  } from "../services/warehouse.service";
  
  import {
    createWarehouseSchema,
    updateWarehouseSchema,
    warehouseListSchema,
  } from "../schemas/warehouse.schema";
  
  /**
   * POST /api/warehouses
   */
  export async function createWarehouseController(
    req: Request,
    res: Response
  ) {
    try {
      const data =
        createWarehouseSchema.parse(
          req.body
        );
  
      const warehouse =
        await createWarehouse(data);
  
      return res.status(201).json({
        success: true,
        message:
          "Warehouse created successfully",
        data: warehouse,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to create warehouse",
      });
    }
  }
  
  /**
   * GET /api/warehouses
   */
  export async function getWarehousesController(
    req: Request,
    res: Response
  ) {
    try {
      const query =
        warehouseListSchema.parse(
          req.query
        );
  
      const result =
        await getWarehouses(query);
  
      return res.status(200).json({
        success: true,
        message:
          "Warehouses retrieved successfully",
        data: result.warehouses,
        pagination:
          result.pagination,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve warehouses",
      });
    }
  }
  
  /**
   * GET /api/warehouses/:id
   */
  export async function getWarehouseByIdController(
    req: Request,
    res: Response
  ) {
    try {
      const warehouse =
        await getWarehouseById(
          req.params.id
        );
  
      return res.status(200).json({
        success: true,
        message:
          "Warehouse retrieved successfully",
        data: warehouse,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message:
          error.message ||
          "Warehouse not found",
      });
    }
  }
  
  /**
   * PATCH /api/warehouses/:id
   */
  export async function updateWarehouseController(
    req: Request,
    res: Response
  ) {
    try {
      const data =
        updateWarehouseSchema.parse(
          req.body
        );
  
      const warehouse =
        await updateWarehouse(
          req.params.id,
          data
        );
  
      return res.status(200).json({
        success: true,
        message:
          "Warehouse updated successfully",
        data: warehouse,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to update warehouse",
      });
    }
  }
  
  /**
   * POST /api/warehouses/:id/deactivate
   */
  export async function deactivateWarehouseController(
    req: Request,
    res: Response
  ) {
    try {
      const warehouse =
        await deactivateWarehouse(
          req.params.id
        );
  
      return res.status(200).json({
        success: true,
        message:
          "Warehouse deactivated successfully",
        data: warehouse,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to deactivate warehouse",
      });
    }
  }
  
  /**
   * POST /api/warehouses/:id/activate
   */
  export async function activateWarehouseController(
    req: Request,
    res: Response
  ) {
    try {
      const warehouse =
        await activateWarehouse(
          req.params.id
        );
  
      return res.status(200).json({
        success: true,
        message:
          "Warehouse activated successfully",
        data: warehouse,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to activate warehouse",
      });
    }
  }