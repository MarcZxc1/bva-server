// src/services/integration.service.ts
import { apiClient } from "../lib/api-client";

export interface Integration {
  id: string;
  shopId: string;
  platform: "SHOPEE" | "LAZADA" | "TIKTOK" | "OTHER";
  settings: Record<string, any>;
  createdAt: string;
  shop?: {
    id: string;
    name: string;
  };
}

export interface CreateIntegrationRequest {
  platform: "SHOPEE" | "LAZADA" | "TIKTOK" | "OTHER";
  settings?: Record<string, any>;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  data?: {
    productCount?: number;
  };
}

export interface SyncResponse {
  success: boolean;
  message: string;
  data: {
    products: number;
    sales: number;
  };
}

class IntegrationService {
  /**
   * Get all integrations for the current user's shop
   */
  async getIntegrations(): Promise<Integration[]> {
    return apiClient.get<Integration[]>("/api/integrations");
  }

  /**
   * Get integration by ID
   */
  async getIntegrationById(id: string): Promise<Integration> {
    return apiClient.get<Integration>(`/api/integrations/${id}`);
  }

  /**
   * Create a new integration
   */
  async createIntegration(data: CreateIntegrationRequest): Promise<Integration> {
    return apiClient.post<Integration>("/api/integrations", data);
  }

  /**
   * Update integration
   */
  async updateIntegration(id: string, data: Partial<CreateIntegrationRequest>): Promise<Integration> {
    return apiClient.put<Integration>(`/api/integrations/${id}`, data);
  }

  /**
   * Delete integration
   */
  async deleteIntegration(id: string): Promise<void> {
    return apiClient.delete(`/api/integrations/${id}`);
  }

  /**
   * Test integration connection
   */
  async testConnection(id: string): Promise<TestConnectionResponse> {
    return apiClient.post<TestConnectionResponse>(`/api/integrations/${id}/test`);
  }

  /**
   * Sync integration data
   */
  async syncIntegration(id: string): Promise<SyncResponse> {
    return apiClient.post<SyncResponse>(`/api/integrations/${id}/sync`);
  }

}

export const integrationService = new IntegrationService();

