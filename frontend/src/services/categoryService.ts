import api from "./api";

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export const getCategories = async () => {
  const response = await api.get("/categories");

  return response.data;
};

export const createCategory = async (
  data: CreateCategoryData
) => {
  const response = await api.post(
    "/categories",
    data
  );

  return response.data;
};

export const updateCategory = async (
  categoryId: number,
  data: CreateCategoryData
) => {
  const response = await api.put(
    `/categories/${categoryId}`,
    data
  );

  return response.data;
};