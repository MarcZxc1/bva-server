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
          // Only clear auth if we're not on the login page (to avoid redirect loops)
          const currentPath = window.location.pathname;
          const requestUrl = error.config?.url || 'unknown';
          const requestMethod = error.config?.method || 'unknown';
          const hasToken = !!localStorage.getItem("auth_token");
          const hasUser = !!localStorage.getItem("user");
          
          console.error("❌ [API Client] 401 Unauthorized:", {
            url: requestUrl,
            method: requestMethod,
            currentPath,
            hasToken,
            hasUser,
            fullUrl: error.config?.url ? `${error.config.baseURL}${error.config.url}` : 'unknown',
            responseData: error.response?.data,
          });
          
          // Don't redirect for auth endpoints (they might return 401 for valid reasons)
          const isAuthEndpoint = requestUrl?.includes('/auth/') || requestUrl?.includes('/login') || requestUrl?.includes('/register');
          
          // Don't redirect if we have valid auth in localStorage - might be a temporary API issue
          // Only redirect if we're on a protected route and have no auth
          const isProtectedRoute = currentPath.startsWith('/dashboard') || 
                                   currentPath.startsWith('/inventory') || 
                                   currentPath.startsWith('/restock') || 
                                   currentPath.startsWith('/ads') || 
                                   currentPath.startsWith('/smartshelf') || 
                                   currentPath.startsWith('/reports') || 
                                   currentPath.startsWith('/settings');
          
          if (currentPath !== "/login" && 
              currentPath !== "/" && 
              !isAuthEndpoint && 
              isProtectedRoute && 
              (!hasToken || !hasUser)) {
            console.log("⚠️ [API Client] 401 Unauthorized - no valid auth, clearing and redirecting to login");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          } else {
            console.log("ℹ️ [API Client] 401 but keeping auth - might be temporary API issue or auth endpoint");
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<{ success?: boolean; data?: T } | T>(url, config);
    
    // Handle both wrapped and unwrapped responses for backward compatibility
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      // Wrapped response: { success: boolean, data: T }
      return (response.data as { success: boolean; data: T }).data;
    } else {
      // Unwrapped response: T directly (for backward compatibility)
      return response.data as T;
    }
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
    const response = await this.client.delete<{ success: boolean; data?: T; message?: string } | T>(url, config);
    
    // Handle both wrapped and unwrapped responses
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      // Wrapped response: { success: boolean, data?: T, message?: string }
      const wrappedResponse = response.data as { success: boolean; data?: T; message?: string };
      // If data exists, return it; otherwise return the whole response (for responses like { success, message })
      return (wrappedResponse.data !== undefined ? wrappedResponse.data : wrappedResponse) as T;
    } else {
      // Unwrapped response: T directly
      return response.data as T;
    }
  }
}

export const apiClient = new ApiClient();

