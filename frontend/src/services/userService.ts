import api from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const getUsers = async () => {
  const response = await api.get("/users");

  return response.data;
};

export const createUser = async (
  data: CreateUserData
) => {
  const response = await api.post("/users", data);

  return response.data;
};

export const updateUser = async (
  userId: number,
  data: {
    name: string;
    email: string;
    role: string;
  }
) => {
  const response = await api.put(
    `/users/${userId}`,
    data
  );

  return response.data;
};

export const updateUserStatus = async (
  userId: number
) => {
  const response = await api.patch(
    `/users/${userId}/status`
  );

  return response.data;
};

export const resetUserPassword = async (
  userId: number,
  newPassword: string
) => {
  const response = await api.patch(
    `/users/${userId}/password`,
    {
      new_password: newPassword,
    }
  );

  return response.data;
};