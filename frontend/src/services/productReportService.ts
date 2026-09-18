import api from "./api";

export interface ProductReport {
  product_id: number;
  product_name: string;
  sku: string;
  total_quantity: number;
  total_sales: number;
  total_profit: number;
}

export const getProductReport = async (
  startDate: string,
  endDate: string
) => {
  const response = await api.get(
    "/reports/products",
    {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    }
  );

  return response.data;
};