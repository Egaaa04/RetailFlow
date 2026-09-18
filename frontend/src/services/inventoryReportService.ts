import api from "./api";

export interface InventoryProductReport {
  id: number;
  sku: string;
  name: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  status: string;
}

export interface InventoryReport {
  success: boolean;
  summary: {
    total_products: number;
    total_stock: number;
    low_stock_count: number;
  };
  products: InventoryProductReport[];
}

export const getInventoryReport = async () => {
  const response = await api.get(
    "/reports/inventory"
  );

  return response.data as InventoryReport;
};