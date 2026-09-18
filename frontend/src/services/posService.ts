import api from "./api";

export interface POSProduct {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  selling_price: number;
  current_stock: number;
  status: string;
}

export interface POSCartItem {
  product_id: number;
  quantity: number;
}

export interface CreateTransactionData {
  items: POSCartItem[];
  discount: number;
  payment_method: string;
  payment_amount: number;
}

export const getPOSProducts = async () => {
  const response = await api.get("/pos/products");

  return response.data;
};

export const createTransaction = async (
  data: CreateTransactionData
) => {
  const response = await api.post(
    "/transactions",
    data
  );

  return response.data;
};