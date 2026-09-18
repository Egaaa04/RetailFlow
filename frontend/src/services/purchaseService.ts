import api from "./api";

export interface PurchaseItem {
  product_id: number;
  quantity: number;
  purchase_price: number;
}

export interface CreatePurchaseData {
  supplier_id: number;
  purchase_date: string;
  items: PurchaseItem[];
}

export const getPurchases = async () => {
  const response = await api.get("/purchases");

  return response.data;
};

export const getPurchaseDetail = async (
  purchaseId: number
) => {
  const response = await api.get(
    `/purchases/${purchaseId}`
  );

  return response.data;
};

export const createPurchase = async (
  data: CreatePurchaseData
) => {
  const response = await api.post(
    "/purchases",
    data
  );

  return response.data;
};

export const receivePurchase = async (
  purchaseId: number
) => {
  const response = await api.post(
    `/purchases/${purchaseId}/receive`
  );

  return response.data;
};