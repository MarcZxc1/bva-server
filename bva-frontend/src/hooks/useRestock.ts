/**
 * React Query hooks for Restock Planner feature
 * 
 * Handles API communication for AI-powered restocking recommendations
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { aiService } from "@/api/ai.service";
import { RestockRequest, RestockResponse } from "@/api/inventory.service";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

/**
 * Hook for generating restocking strategy
 * Usage: const { mutate, data, isLoading } = useRestockStrategy();
 */
export function useRestockStrategy() {
  return useMutation({
    mutationFn: async (request: RestockRequest): Promise<RestockResponse> => {
      return aiService.getRestockStrategy(request);
    },
    onSuccess: (data) => {
      toast.success("Restock plan generated successfully!");
    },
    onError: (error: ErrorResponse) => {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = 
        axiosError?.response?.data?.message ||
        axiosError?.response?.data?.error ||
        error.message ||
        "Failed to generate restock strategy";
      
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for checking ML service health
 * Usage: const { data: healthData } = useRestockHealth();
 */
export function useRestockHealth() {
  return useQuery({
    queryKey: ["restock-health"],
    queryFn: () => aiService.checkHealth(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
  });
}
