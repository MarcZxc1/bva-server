import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<{ success: boolean; data: T }>(url, config);
    return response.data.data; // Unwrap the data property
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<{ success: boolean; data?: T; error?: string; message?: string; token?: string }>(url, data, config);
      
      // Handle error responses (when success is false) - backend returned 200 but success: false
      if (response.data && !response.data.success) {
        const errorMessage = response.data.error || response.data.message || "Request failed";
        const error = new Error(errorMessage) as any;
        error.response = { data: response.data, status: 400 };
        throw error;
      }
      
      // For auth endpoints (register/login), return the full response object
      // because it contains token, data, message, etc.
      if (response.data && response.data.token !== undefined) {
        return response.data as T;
      }
      
      // For other endpoints, return just the data property
      return response.data?.data as T;
    } catch (error: any) {
      // Handle axios errors (network errors, 4xx, 5xx)
      if (error.response) {
        // Backend returned an error response
        const errorData = error.response.data;
        const errorMessage = errorData?.error || errorData?.message || error.message || "Request failed";
        const backendError = new Error(errorMessage) as any;
        backendError.response = error.response;
        throw backendError;
      }
      // Network error or other axios error
      throw error;
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<{ success: boolean; data: T }>(url, data, config);
    return response.data.data; // Unwrap the data property
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<{ success: boolean; data: T }>(url, data, config);
    return response.data.data; // Unwrap the data property
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<{ success: boolean; data: T }>(url, config);
    return response.data.data; // Unwrap the data property
  }
}

export const apiClient = new ApiClient();

