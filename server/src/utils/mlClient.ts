import axios, { AxiosInstance } from "axios";

export class MLServiceClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || "http://localhost:8001";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // ML-service returned an error
        throw new Error(
          `ML Service error: ${error.response.data?.detail || error.message}`
        );
      } else if (error.request) {
        // No response received
        throw new Error(
          `ML Service unavailable at ${this.baseURL}. Please ensure the service is running.`
        );
      } else {
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `ML Service error: ${error.response.data?.detail || error.message}`
        );
      } else if (error.request) {
        throw new Error(
          `ML Service unavailable at ${this.baseURL}. Please ensure the service is running.`
        );
      } else {
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/health");
      return true;
    } catch {
      return false;
    }
  }
}

export const mlClient = new MLServiceClient();
