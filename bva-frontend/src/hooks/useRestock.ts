import { useMutation, useQuery } from "@tanstack/react-query";
import { restockApi, RestockRequest, RestockResponse } from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export function useRestockStrategy() {
  return useMutation({
    mutationFn: async (request: RestockRequest): Promise<RestockResponse> => {
      return restockApi.getRestockStrategy(request);
    },
    onError: (error: ErrorResponse) => {
      toast.error(
        (error as AxiosError<{ message?: string }>)?.response?.data?.message || 
        error.message || 
        "Failed to generate restock strategy"
      );
    },
  });
}

export function useRestockHealth() {
  return useQuery({
    queryKey: ["restock-health"],
    queryFn: () => restockApi.checkHealth(),
    refetchInterval: 30000, // Check every 30 seconds
  });
}

