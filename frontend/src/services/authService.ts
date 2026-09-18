import api from "./api";

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  access_token?: string;
  token_type?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export const login = async (
  data: LoginData
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    data
  );

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};