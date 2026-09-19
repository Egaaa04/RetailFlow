import api from "./api";

export interface Product {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  category_id: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  expiration_date: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  sku: string;
  barcode?: string;
  name: string;
  category_id: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  expiration_date?: string;
  status: string;
}

export const getProducts = async () => {
  const response = await api.get("/products");

  return response.data;
};

export const createProduct = async (
  data: FormData
) => {
  const response = await api.post(
    "/products",
    data
  );

  return response.data;
};

export const updateProduct = async (
  productId: number,
  data: FormData
) => {
  const response = await api.put(
    `/products/${productId}`,
    data
  );

  return response.data;
};