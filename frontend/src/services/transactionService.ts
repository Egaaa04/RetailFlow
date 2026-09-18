import api from "./api";

export interface Transaction {
  id: number;
  transaction_number: string;
  cashier_id: number;
  cashier_name: string | null;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  status: string;
  created_at: string;
}

export interface TransactionItem {
  id: number;
  product_id: number;
  product_name: string | null;
  quantity: number;
  selling_price: number;
  purchase_price: number;
  subtotal: number;
}

export interface TransactionDetail
  extends Transaction {
  items: TransactionItem[];
}

export const getTransactions = async () => {
  const response = await api.get(
    "/transactions"
  );

  return response.data;
};

export const getTransactionDetail = async (
  transactionId: number
) => {
  const response = await api.get(
    `/transactions/${transactionId}`
  );

  return response.data;
};