import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { apiLogger } from "./logger";

// Extend InternalAxiosRequestConfig to include metadata for logging
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  startTime?: number;
}

// Factory function to create an Axios instance
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // --- Request Interceptor ---
  client.interceptors.request.use(
    (config: CustomAxiosRequestConfig) => {
      // 1. Attach Auth Token
      const token = localStorage.getItem("auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. Start Timer & Log Request
      config.startTime = Date.now();
      apiLogger.request(config.method || "GET", config.url || "", config.data);

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // --- Response Interceptor ---
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // 1. Calculate Duration & Log Response
      const config = response.config as CustomAxiosRequestConfig;
      const duration = config.startTime ? Date.now() - config.startTime : 0;

      apiLogger.response(response.status, config.url || "", duration);

      return response;
    },
    (error: AxiosError) => {
      const config = error.config as CustomAxiosRequestConfig | undefined;
      const duration = config?.startTime ? Date.now() - config.startTime : 0;
      const status = error.response?.status || 500;
      const message = (error.response?.data as any)?.message || error.message;

      // 1. Log Error
      apiLogger.error(status, config?.url || "unknown", message);

      // 2. Handle 401 Unauthorized
      if (status === 401) {
        // Prevent infinite redirect loops if already on login
        if (window.location.pathname !== "/") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          window.location.href = "/";
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// --- Export Instances ---

// Main Node.js API
export const mainApi = createApiClient(
  import.meta.env.VITE_MAIN_API_URL || "http://localhost:5000"
);

// Python AI Service
export const aiApi = createApiClient(
  import.meta.env.VITE_AI_API_URL || "http://localhost:8000"
);
