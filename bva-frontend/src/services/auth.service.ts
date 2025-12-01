import { mainApi } from "@/api/client";

// --- Types ---

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

// --- Service ---

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await mainApi.post<AuthResponse>(
      "/api/users/login",
      credentials
    );
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await mainApi.post<AuthResponse>(
      "/api/users/register",
      data
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Optional: Call backend logout if needed
    // await mainApi.post("/api/users/logout");
  },
};
