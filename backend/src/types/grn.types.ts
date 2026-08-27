export interface CreateGrnItemInput {
    materialId: string;
    deliveredQuantity: number;
    damagedQuantity?: number;
    rejectedQuantity?: number;
    acceptedQuantity?: number;
    unitId: string;
    batchNumber?: string;
    manufacturingDate?: string;
    expiryDate?: string;
    storageLocationId?: string;
    remarks?: string;
  }
  
  export interface CreateGrnInput {
    projectId: string;
    supplierId: string;
    purchaseOrderId?: string;
    deliveryDate: string;
    deliveryNoteNumber?: string;
    vehicleNumber?: string;
    driverName?: string;
    remarks?: string;
    items: CreateGrnItemInput[];
  }
  
  export interface UpdateGrnInput {
    deliveryDate?: string;
    deliveryNoteNumber?: string;
    vehicleNumber?: string;
    driverName?: string;
    remarks?: string;
    items?: CreateGrnItemInput[];
  }