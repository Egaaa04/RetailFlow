import api from "./api";

export interface DashboardSummary {
  active_products: number;
  low_stock_products: number;
  today_transactions: number;
  today_sales: number;
}

export interface RecentTransaction {
  id: number;
  transaction_number: string;
  cashier_name: string | null;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
}

export interface DashboardResponse {
  success: boolean;
  summary: DashboardSummary;
  recent_transactions: RecentTransaction[];
  low_stock_list: LowStockProduct[];
}

export const getDashboard =
  async (): Promise<DashboardResponse> => {
    const response = await api.get(
      "/dashboard"
    );

    return response.data;
  };