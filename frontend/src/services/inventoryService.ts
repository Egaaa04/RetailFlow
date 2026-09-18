import api from "./api";

export interface InventoryMovement {
  id: number;
  product_id: number;
  movement_type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

export interface CreateInventoryMovementData {
  product_id: number;
  movement_type: string;
  quantity?: number;
  actual_stock?: number;
  notes?: string;
}

export const getInventoryMovements = async (
  productId?: number,
  movementType?: string
) => {
  const response = await api.get(
    "/inventory/movements",
    {
      params: {
        product_id: productId,
        movement_type: movementType,
      },
    }
  );

  return response.data;
};

export const createInventoryMovement = async (
  data: CreateInventoryMovementData
) => {
  const response = await api.post(
    "/inventory/movements",
    data
  );

  return response.data;
};