import api from "./api";

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const getSuppliers = async () => {
  const response = await api.get("/suppliers");

  return response.data;
};

export const createSupplier = async (
  data: CreateSupplierData
) => {
  const response = await api.post(
    "/suppliers",
    data
  );

  return response.data;
};

export const updateSupplier = async (
  supplierId: number,
  data: CreateSupplierData
) => {
  const response = await api.put(
    `/suppliers/${supplierId}`,
    data
  );

  return response.data;
};