import api from "./api";

export interface SalesReportSummary {
  total_transactions: number;
  total_sales: number;
  total_discount: number;
  total_items: number;
  total_profit: number;
}

export interface SalesReportTransaction {
  id: number;
  transaction_number: string;
  cashier_name: string | null;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  profit: number;
  created_at: string;
}

export interface SalesReportResponse {
  success: boolean;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: SalesReportSummary;
  transactions: SalesReportTransaction[];
}

export const getSalesReport = async (
  startDate: string,
  endDate: string
): Promise<SalesReportResponse> => {
  const response = await api.get(
    "/reports/sales",
    {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    }
  );

  return response.data;
};