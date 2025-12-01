import { apiClient } from "@/lib/api-client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    name?: string;
  };
  token: string;
  message: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/api/users/login", credentials);
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/api/users/register", data);
  },

  logout: async (): Promise<void> => {
    // Optional: Call backend logout if needed
    // return apiClient.post("/api/users/logout");
  },
};
